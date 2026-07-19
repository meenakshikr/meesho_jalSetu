export type UserRole = 'resident' | 'coordinator' | 'driver' | 'owner'
export type BookingType = 'community' | 'individual'
export type BookingStatus = 'pending' | 'open' | 'confirmed' | 'dispatched' | 'delivered' | 'disputed' | 'cancelled'
export type PaymentMethod = 'upi' | 'cash' | 'points'
export type HeatwaveSeverity = 'watch' | 'warning' | 'emergency'
export type Language = 'hi' | 'en'
export type NudgeType = 'predictive' | 'heatwave' | 'coordinator'

export interface User {
  id: string
  auth_id: string
  name: string
  phone: string
  role: UserRole
  ward_id: string | null
  language: Language
  subsidy_points: number
  created_at: string
  ward?: Ward
}

export interface Ward {
  id: string
  name: string
  city: string
  district: string
  state: string
  lat: number
  lng: number
  created_at: string
}

export interface Tanker {
  id: string
  owner_id: string
  driver_id: string
  operator_name: string
  vehicle_number: string
  capacity_liters: number
  price_per_liter: number
  is_certified: boolean
  is_available: boolean
  current_lat: number
  current_lng: number
  rating: number
  total_deliveries: number
  created_at: string
  distance_km?: number
  ai_rank_score?: number
  ai_rank_reason?: string
  driver?: User
  owner?: User
}

export interface Booking {
  id: string
  type: BookingType
  status: BookingStatus
  tanker_id: string
  coordinator_id?: string
  driver_id?: string
  ward_id: string
  resident_id?: string
  volume_ordered: number
  volume_delivered?: number
  price_per_liter: number
  total_amount: number
  delivery_address: string
  delivery_lat?: number
  delivery_lng?: number
  scheduled_at?: string
  delivered_at?: string
  anomaly_flagged: boolean
  anomaly_reason?: string
  cv_confirmed?: boolean
  receipt_url?: string
  created_at: string
  tanker?: Tanker
  participants?: BookingParticipant[]
  coordinator?: User
  resident?: User
  driver?: User
}

export interface BookingParticipant {
  id: string
  booking_id: string
  user_id: string
  share_liters: number
  share_amount: number
  payment_status: 'pending' | 'paid' | 'points_used'
  payment_method?: PaymentMethod
  payment_ref?: string
  joined_at: string
  user?: User
}

export interface Payment {
  id: string
  booking_id: string
  user_id: string
  amount: number
  method: PaymentMethod
  status: 'pending' | 'success' | 'failed'
  razorpay_order_id?: string
  razorpay_payment_id?: string
  created_at: string
}

export interface Receipt {
  id: string
  booking_id: string
  user_id: string
  amount: number
  volume_liters: number
  tanker_id: string
  ward_id: string
  issued_at: string
  tanker?: Tanker
  booking?: Booking
}

export interface HeatwaveAlert {
  id: string
  district: string
  state: string
  temperature: number
  feels_like: number
  severity: HeatwaveSeverity
  ai_advisory: string
  cooling_centers?: CoolingCenter[]
  ors_points?: ORSPoint[]
  active: boolean
  created_at: string
  expires_at: string
}

export interface CoolingCenter {
  name: string
  address: string
  lat: number
  lng: number
}

export interface ORSPoint {
  name: string
  address: string
}

export interface AnomalyLog {
  id: string
  booking_id: string
  tanker_id: string
  ward_id: string
  district_avg_price: number
  charged_price: number
  percent_above: number
  ai_reason?: string
  resolved: boolean
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  user_id: string
  tanker_id: string
  rating: number
  comment?: string
  created_at: string
  user?: User
  booking?: Booking
}

export interface NudgeLog {
  id: string
  user_id: string
  type: NudgeType
  message: string
  read: boolean
  created_at: string
}

export interface BillSplitItem {
  user_id: string
  name: string
  share_liters: number
  share_amount: number
  payment_status: string
}

export interface DriverLocation {
  id: string
  driver_id: string
  lat: number
  lng: number
  booking_id?: string
  updated_at: string
}

export interface DriverLocationHistory {
  id: string
  driver_id: string
  lat: number
  lng: number
  booking_id?: string
  recorded_at: string
}
