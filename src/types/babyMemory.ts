export type ParentStage = 'expecting' | 'new_parent';
export type LanguageCode = 'en' | 'es' | 'hi' | 'fr';

export type HealthConditionId =
  | 'gestational_diabetes'
  | 'anemia'
  | 'hypertension'
  | 'thyroid'
  | 'nausea'
  | 'c_section_recovery'
  | 'lactation_support';

export type NavTabId =
  | 'overview'
  | 'daily'
  | 'milestones'
  | 'wellness'
  | 'locator'
  | 'memories'
  | 'connect';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  parentStage: ParentStage;
  babyName: string;
  dueOrBirthDate: string; // YYYY-MM-DD
  currentWeek: number;
  healthConditions: HealthConditionId[];
  language: LanguageCode;
  darkMode: boolean;
  biometricEnabled: boolean;
  dailyWaterGoalMl: number;
  targetWeightKg: number;
  dailySleepGoalHours: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type HealthLogType = 'tablet' | 'food' | 'water' | 'sleep' | 'activity' | 'feeding';

export interface HealthLog {
  id: string;
  ownerId: string;
  logType: HealthLogType;
  title: string;
  valueNum: number;
  unit: string;
  notes: string;
  loggedDate: string; // YYYY-MM-DD
  loggedTime: string; // HH:mm
  completed: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GrowthEntry {
  id: string;
  ownerId: string;
  weekNumber: number;
  date: string;
  weightKg: number;
  heightCm: number;
  headCm: number;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type MilestoneCategory =
  | 'checkup_5w'
  | 'checkup_10w'
  | 'checkup_20w'
  | 'vaccine'
  | 'appointment'
  | 'developmental';

export type MilestoneStatus = 'upcoming' | 'completed' | 'overdue';

export interface Milestone {
  id: string;
  ownerId: string;
  category: MilestoneCategory;
  title: string;
  weekTarget: number;
  scheduledDate: string;
  status: MilestoneStatus;
  doctorName: string;
  notes: string;
  reminderEnabled: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type MemoryCategory = 'milestone' | 'ultrasound' | 'firsts' | 'wellness';

export interface MemoryPhoto {
  id: string;
  ownerId: string;
  title: string;
  caption: string;
  milestoneWeek: number;
  category: MemoryCategory;
  dateTaken: string;
  imageData: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type MedicalRecordType = 'insurance' | 'lab_report' | 'medication' | 'immunization';

export interface MedicalRecord {
  id: string;
  ownerId: string;
  recordType: MedicalRecordType;
  title: string;
  providerOrInsurer: string;
  dateIssued: string;
  summary: string;
  policyOrRefNumber: string;
  attachmentPreview: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ServiceBookingType = 'blood_collection' | 'ambulance' | 'cab_ride' | 'clinic_visit';
export type ServiceBookingStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface ServiceBooking {
  id: string;
  ownerId: string;
  serviceType: ServiceBookingType;
  providerName: string;
  address: string;
  scheduledFor: string;
  status: ServiceBookingStatus;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ConsultationThread {
  id: string;
  ownerId: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  lastMessage: string;
  status: 'active' | 'resolved';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ConsultationMessage {
  id: string;
  ownerId: string;
  senderRole: 'parent' | 'doctor';
  senderName: string;
  body: string;
  urgent: boolean;
  createdAt?: unknown;
}

export type CommunityTopic = 'pregnancy' | 'newborn' | 'milestones' | 'nutrition' | 'sleep';

export interface CommunityPost {
  id: string;
  authorUid: string;
  authorHandle: string;
  topic: CommunityTopic;
  title: string;
  body: string;
  isPublic: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityReply {
  id: string;
  postId: string;
  authorUid: string;
  authorHandle: string;
  body: string;
  createdAt?: unknown;
}

export interface CommunityLike {
  id: string;
  postId: string;
  userId: string;
  createdAt?: unknown;
}
