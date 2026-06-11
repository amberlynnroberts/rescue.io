export type OrgRole = 'owner' | 'admin' | 'staff' | 'volunteer'
export type OrgPlan = 'free' | 'pro' | 'growth'
export type AnimalSpecies = 'dog' | 'cat' | 'rabbit' | 'bird' | 'reptile' | 'small_animal' | 'other'
export type AnimalSex = 'male' | 'female' | 'unknown'
export type AnimalStatus = 'available' | 'hold' | 'medical' | 'adopted' | 'fostered' | 'transferred' | 'deceased' | 'quarantine' | 'stray_hold'
export type IntakeType = 'stray' | 'owner_surrender' | 'transfer' | 'born_in_care' | 'other'
export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'denied' | 'withdrawn'
export type QuarantineReason = 'new_intake' | 'illness' | 'bite_case' | 'exposure' | 'post_surgery' | 'behavior' | 'other'
export type QuarantineStatus = 'active' | 'cleared' | 'extended' | 'euthanized'

export type AppetiteLevel = 'good' | 'reduced' | 'not_eating'
export type WaterLevel = 'normal' | 'reduced' | 'not_drinking'
export type StoolType = 'normal' | 'soft' | 'diarrhea' | 'none_observed' | 'blood'
export type UrinationType = 'normal' | 'reduced' | 'none' | 'abnormal'
export type BehaviorType = 'normal' | 'lethargic' | 'anxious' | 'aggressive' | 'other'

export interface Organization {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  logo_url: string | null
  plan: OrgPlan
  modules: string[]
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface OrgMembership {
  id: string
  org_id: string
  user_id: string
  role: OrgRole
  invited_by: string | null
  accepted_at: string | null
  created_at: string
  profile?: Profile
}

export interface Animal {
  id: string
  org_id: string
  name: string | null
  species: AnimalSpecies
  breed: string | null
  secondary_breed: string | null
  mix: boolean
  color: string | null
  markings: string | null
  sex: AnimalSex
  dob: string | null
  age_years: number | null
  age_months: number | null
  weight_lbs: number | null
  intake_type: IntakeType
  intake_date: string
  intake_notes: string | null
  intake_by: string | null
  microchip_id: string | null
  shelter_id: string | null
  status: AnimalStatus
  location: string | null
  altered: boolean
  heartworm_pos: boolean
  fiv_pos: boolean
  felv_pos: boolean
  outcome_date: string | null
  outcome_type: string | null
  outcome_notes: string | null
  created_at: string
  updated_at: string
  // joined
  primary_photo?: string | null
  photos?: AnimalPhoto[]
}

export interface AnimalPhoto {
  id: string
  org_id: string
  animal_id: string
  url: string
  is_primary: boolean
  caption: string | null
  uploaded_by: string | null
  created_at: string
}

export interface DailyObservation {
  id: string
  org_id: string
  animal_id: string
  observed_at: string
  observed_by: string | null
  appetite: AppetiteLevel
  water_intake: WaterLevel
  stool: StoolType
  urination: UrinationType
  vomiting: boolean
  coughing: boolean
  sneezing: boolean
  discharge: boolean
  temp_f: number | null
  weight_lbs: number | null
  behavior: BehaviorType
  behavior_notes: string | null
  notes: string | null
  flag_for_vet: boolean
  quarantine_case_id: string | null
  created_at: string
  // joined
  observed_by_profile?: Profile
}

export interface MedicalRecord {
  id: string
  org_id: string
  animal_id: string
  type: string
  date: string
  title: string
  notes: string | null
  vet_name: string | null
  cost: number | null
  recorded_by: string | null
  created_at: string
}

export interface Medication {
  id: string
  org_id: string
  animal_id: string
  name: string
  dosage: string | null
  frequency: string | null
  instructions: string | null
  start_date: string
  end_date: string | null
  active: boolean
  prescribed_by: string | null
  created_at: string
}

export interface QuarantineCase {
  id: string
  org_id: string
  animal_id: string
  reason: QuarantineReason
  status: QuarantineStatus
  start_date: string
  expected_end: string | null
  actual_end: string | null
  kennel_location: string | null
  notes: string | null
  opened_by: string | null
  closed_by: string | null
  created_at: string
  updated_at: string
  animal?: Animal
  observations?: DailyObservation[]
}

export interface AdoptionApplication {
  id: string
  org_id: string
  animal_id: string
  status: ApplicationStatus
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  applicant_address: string | null
  answers: Record<string, unknown>
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  adopted_at: string | null
  adoption_fee: number | null
  fee_paid: boolean
  contract_url: string | null
  created_at: string
  updated_at: string
  animal?: Animal
}
