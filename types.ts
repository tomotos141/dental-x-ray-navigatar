
export type XrayType = 'DENTAL' | 'PANORAMA' | 'CT' | 'BITEWING' | 'CEPHALO' | 'TMJ' | 'FULL_MOUTH_10';
export type Gender = 'male' | 'female' | 'other';
export type BodyType = 'small' | 'normal' | 'large';
export type AgeCategory = 'child' | 'adult';

export interface RadiationLog {
  kv: number;
  ma: number;
  sec: number;
  operatorName: string;
}

export interface Patient {
  id: string;
  name: string;
  gender: Gender;
  birthday: string;
  bodyType: BodyType;
}

export type StaffRole = 'doctor' | 'technician' | 'hygienist';

export interface Operator {
  id: string;
  name: string;
  role: StaffRole;
  active: boolean;
}

export interface ClinicAuth {
  clinicId: string;
  staffName: string;
}

// Fix: Added missing InsurancePointConfig export needed by constants.ts
export interface InsurancePointConfig {
  type: XrayType;
  basePoints: number;
}

export interface XrayRequest {
  id: string;
  patientName: string;
  patientId: string;
  patientGender: Gender;
  patientBirthday: string;
  patientAgeAtRequest: number;
  patientBodyType: BodyType;
  types: XrayType[]; 
  selectedTeeth: number[];
  bitewingSides?: ('right' | 'left')[];
  notes: string;
  points: number;
  timestamp: Date;
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'completed';
  locationFrom: string; 
  locationTo: string;   
  radiationLogs: Partial<Record<XrayType, RadiationLog>>; // 種別ごとのログ
  reminded?: boolean;
}

export interface ExposureSettings {
  kv: number;
  ma: number;
  sec: number;
}

export type ExposureTemplate = Record<XrayType, Record<AgeCategory, Record<BodyType, ExposureSettings>>>;
