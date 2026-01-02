
import { XrayType, InsurancePointConfig, ExposureTemplate } from './types';

export const INSURANCE_POINTS: Record<XrayType, InsurancePointConfig> = {
  DENTAL: { type: 'DENTAL', basePoints: 48 },
  PANORAMA: { type: 'PANORAMA', basePoints: 402 },
  CT: { type: 'CT', basePoints: 1170 },
  BITEWING: { type: 'BITEWING', basePoints: 48 },
  CEPHALO: { type: 'CEPHALO', basePoints: 402 },
  TMJ: { type: 'TMJ', basePoints: 402 },
  FULL_MOUTH_10: { type: 'FULL_MOUTH_10', basePoints: 480 }
};

export const XRAY_LABELS: Record<XrayType, string> = {
  DENTAL: 'デンタル',
  PANORAMA: 'パノラマ',
  CT: '歯科用CT',
  BITEWING: 'バイトウィング',
  CEPHALO: 'セファロ',
  TMJ: '顎関節',
  FULL_MOUTH_10: 'デンタル10枚法'
};

export const EXPOSURE_TEMPLATES: ExposureTemplate = {
  DENTAL: {
    adult: {
      small: { kv: 60, ma: 7, sec: 0.08 },
      normal: { kv: 60, ma: 7, sec: 0.10 },
      large: { kv: 65, ma: 7, sec: 0.12 },
    },
    child: {
      small: { kv: 55, ma: 5, sec: 0.05 },
      normal: { kv: 55, ma: 5, sec: 0.06 },
      large: { kv: 60, ma: 5, sec: 0.08 },
    }
  },
  PANORAMA: {
    adult: {
      small: { kv: 68, ma: 8, sec: 12.0 },
      normal: { kv: 70, ma: 10, sec: 12.0 },
      large: { kv: 74, ma: 12, sec: 14.0 },
    },
    child: {
      small: { kv: 60, ma: 6, sec: 10.0 },
      normal: { kv: 62, ma: 8, sec: 10.0 },
      large: { kv: 65, ma: 8, sec: 12.0 },
    }
  },
  CT: {
    adult: {
      small: { kv: 85, ma: 5, sec: 15.0 },
      normal: { kv: 90, ma: 6, sec: 15.0 },
      large: { kv: 90, ma: 8, sec: 15.0 },
    },
    child: {
      small: { kv: 80, ma: 4, sec: 12.0 },
      normal: { kv: 80, ma: 5, sec: 12.0 },
      large: { kv: 85, ma: 5, sec: 12.0 },
    }
  },
  BITEWING: {
    adult: {
      small: { kv: 60, ma: 7, sec: 0.10 },
      normal: { kv: 60, ma: 7, sec: 0.12 },
      large: { kv: 65, ma: 7, sec: 0.15 },
    },
    child: {
      small: { kv: 55, ma: 5, sec: 0.06 },
      normal: { kv: 55, ma: 5, sec: 0.08 },
      large: { kv: 60, ma: 5, sec: 0.10 },
    }
  },
  CEPHALO: {
    adult: {
      small: { kv: 80, ma: 10, sec: 0.5 },
      normal: { kv: 84, ma: 12, sec: 0.5 },
      large: { kv: 88, ma: 12, sec: 0.6 },
    },
    child: {
      small: { kv: 75, ma: 8, sec: 0.4 },
      normal: { kv: 78, ma: 10, sec: 0.4 },
      large: { kv: 80, ma: 10, sec: 0.5 },
    }
  },
  TMJ: {
    adult: {
      small: { kv: 70, ma: 10, sec: 10.0 },
      normal: { kv: 75, ma: 10, sec: 12.0 },
      large: { kv: 80, ma: 10, sec: 12.0 },
    },
    child: {
      small: { kv: 65, ma: 8, sec: 8.0 },
      normal: { kv: 70, ma: 8, sec: 8.0 },
      large: { kv: 75, ma: 8, sec: 10.0 },
    }
  },
  FULL_MOUTH_10: {
    adult: {
      small: { kv: 60, ma: 7, sec: 0.08 },
      normal: { kv: 60, ma: 7, sec: 0.10 },
      large: { kv: 65, ma: 7, sec: 0.12 },
    },
    child: {
      small: { kv: 55, ma: 5, sec: 0.05 },
      normal: { kv: 55, ma: 5, sec: 0.06 },
      large: { kv: 60, ma: 5, sec: 0.08 },
    }
  }
};

export const LOCATION_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => `チェア ${i + 1}`),
  'レントゲン室',
  '待合室',
  '受付'
];
