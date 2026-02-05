# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## 言語設定

**このリポジトリでは、必ず日本語で回答すること。**

## プロジェクト概要

Dental X-Ray Navigator - 歯科X線撮影管理用のReact + Firebaseウェブアプリケーション。iPadおよびPC向けに設計されており、インタラクティブな歯式チャート、保険点数計算、日次分析機能を備えている。

## 開発コマンド

```bash
npm run dev      # Vite開発サーバーを起動 (http://localhost:3000)
npm run build    # dist/に本番ビルドを作成
npm run preview  # 本番ビルドをローカルでプレビュー
```

Firebaseデプロイ: `firebase deploy`

## 環境設定

`.env.example`を`.env.local`にコピーし、Firebase認証情報を設定:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 技術スタック

- **フロントエンド:** React 19, TypeScript 5.8, Tailwind CSS (CDN)
- **ビルド:** Vite 6
- **バックエンド:** Firebase Firestore (リアルタイムDB)
- **チャート:** Recharts

## アーキテクチャ設計

### ファイル構成と責務

```
App.tsx                    # メインコンポーネント（全画面・ビジネスロジック集約）
├── types.ts               # 型定義（ドメインモデル）
├── constants.ts           # 定数（保険点数、被曝テンプレート）
├── hooks/useDentalData.ts # Firestore連携カスタムフック
├── lib/firebase.ts        # Firebase初期化
└── components/
    ├── DentalChart.tsx    # 歯式選択UI
    └── StatsDashboard.tsx # 統計ダッシュボード
```

### 画面構成（App.tsx内のview state）

| view | 説明 |
|------|------|
| `request` | 新規撮影依頼作成画面（患者情報入力、X線種別選択、歯式指定） |
| `tasks` | 待機中タスク一覧（pending状態の依頼をカード表示） |
| `stats` | 実績ダッシュボード（StatsDashboardコンポーネント） |
| `history` | 撮影完了履歴（completed状態の依頼をテーブル表示） |
| `patients` | 患者データベース管理（一覧・削除） |

### 状態管理パターン

```
┌─────────────────────────────────────────────────────────────┐
│ App.tsx (ローカルstate)                                      │
│  - auth: ClinicAuth | null      # ログイン状態              │
│  - view: string                 # 現在の画面                │
│  - フォーム入力値各種                                        │
│  - logModalTask: XrayRequest    # 照射録モーダル制御         │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ useDentalData() カスタムフック                               │
│  - patients: Patient[]          # Firestoreからリアルタイム  │
│  - requests: XrayRequest[]      # Firestoreからリアルタイム  │
│  - savePatient / deletePatient  # 患者CRUD                  │
│  - addRequest / updateRequest   # 依頼CRUD                  │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Firebase Firestore                                          │
│  - patients コレクション (name順)                            │
│  - requests コレクション (timestamp降順)                     │
└─────────────────────────────────────────────────────────────┘

別系統:
┌─────────────────────────────────────────────────────────────┐
│ localStorage                                                │
│  - dentx_operators_global: Operator[]  # オペレーター情報    │
└─────────────────────────────────────────────────────────────┘
```

### ドメインモデル（types.ts）

**Patient（患者）**
```typescript
{ id, name, gender, birthday, bodyType }
```

**XrayRequest（撮影依頼）**
```typescript
{
  id, patientName, patientId,
  patientGender, patientBirthday, patientAgeAtRequest, patientBodyType,
  types: XrayType[],           // 複数種別選択可能
  selectedTeeth: number[],     // FDI歯番号配列
  bitewingSides?: ('right'|'left')[],
  notes, points,               // 保険点数（自動計算）
  timestamp, scheduledDate, scheduledTime,
  status: 'pending' | 'completed',
  locationFrom, locationTo,
  radiationLogs: Record<XrayType, RadiationLog>  // 種別ごとの照射条件
}
```

**RadiationLog（照射録）**
```typescript
{ kv, ma, sec, operatorName }
```

### 被曝テンプレートシステム（constants.ts）

3次元マトリックス構造: `EXPOSURE_TEMPLATES[XrayType][AgeCategory][BodyType]`

- **XrayType:** DENTAL, PANORAMA, CT, BITEWING, CEPHALO, TMJ, FULL_MOUTH_10
- **AgeCategory:** child（<12歳）, adult（>=12歳）
- **BodyType:** small, normal, large

依頼作成時に患者の年齢・体格から自動でテンプレートを適用。

### 保険点数計算（constants.ts）

`INSURANCE_POINTS[XrayType].basePoints` で基本点数を取得。
BITEWINGのみ左右選択数で乗算（48点 × 選択側数）。

### 歯式チャート（DentalChart.tsx）

FDI方式（国際歯科連盟の歯番号システム）を採用:
- 右上: 18-11 / 左上: 21-28
- 右下: 48-41 / 左下: 31-38

機能:
- 個別歯選択（タップでトグル）
- 四分画の臼歯(4-7)一括選択
- 全臼歯一括選択ボタン

### 主要フロー

**1. 撮影依頼作成フロー**
```
患者ID入力 → DB検索 → 患者情報自動入力（または新規入力）
    ↓
X線種別選択 → 被曝テンプレート表示
    ↓
歯式指定（DENTAL/BITEWING/CTの場合のみ）
    ↓
保険点数自動計算
    ↓
撮影依頼を送信 → Firestoreに保存（患者 + 依頼）
```

**2. 撮影完了フロー**
```
タスク一覧から選択 → 照射録モーダル表示
    ↓
被曝テンプレート自動適用（kV/mA/sec）
    ↓
担当者名入力
    ↓
確定保存 → status: 'completed' に更新
```

### 認証（簡易実装）

現在は単純なフォーム認証（clinicId + staffName）でログイン状態をローカルstateで管理。
Firebase Authenticationは未使用、ページリロードでログアウト。

## パスエイリアス

`@/*`はプロジェクトルートにマッピング（vite.config.ts, tsconfig.json）。
