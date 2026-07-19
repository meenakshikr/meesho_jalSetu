const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const EXISTING_WARD = 'aaaaaaaa-0000-0000-0000-000000000001'
const EXISTING_OWNER = '3e286e05-92be-4cb8-901c-1ff87b98353e'
const EXISTING_DRIVER = 'de04c439-c09f-473b-a3a8-379e66963786'
const EXISTING_RESIDENT = '96b39df4-3e7d-4570-85f0-5da2f88d2104'
const EXISTING_COORDINATOR = 'ca8f1e59-cb49-43a6-94fb-0c4ae3ca914f'

const VAISHALI_WARD = 'c0000001-0000-0000-0000-000000000001'
const MALVIYA_WARD = 'c0000002-0000-0000-0000-000000000002'
const JAGATPURA_WARD = 'c0000003-0000-0000-0000-000000000003'
const CIVIL_LINES_WARD = 'c0000004-0000-0000-0000-000000000004'

const RESIDENTS = {
  rahul: 'a1000001-0000-0000-0000-000000000001',
  sakshi: 'a1000002-0000-0000-0000-000000000002',
  deepak: 'a1000003-0000-0000-0000-000000000003',
  neha: 'a1000004-0000-0000-0000-000000000004',
  vikram: 'a1000005-0000-0000-0000-000000000005',
}

const COORDS = {
  anjali: 'a2000001-0000-0000-0000-000000000001',
  karan: 'a2000002-0000-0000-0000-000000000002',
}

const DRIVERS = {
  ram: 'a3000001-0000-0000-0000-000000000001',
  sham: 'a3000002-0000-0000-0000-000000000002',
  ganesh: 'a3000003-0000-0000-0000-000000000003',
  mahesh: 'a3000004-0000-0000-0000-000000000004',
}

const OWNERS = {
  balaji: 'a4000001-0000-0000-0000-000000000001',
  shyam: 'a4000002-0000-0000-0000-000000000002',
  harsh: 'a4000003-0000-0000-0000-000000000003',
  veer: 'a4000004-0000-0000-0000-000000000004',
}

const TANKERS = {
  balaji1: 'd1000001-0000-0000-0000-000000000001',
  balaji2: 'd1000002-0000-0000-0000-000000000002',
  shyam1: 'd1000003-0000-0000-0000-000000000003',
  shyam2: 'd1000004-0000-0000-0000-000000000004',
  harsh1: 'd1000005-0000-0000-0000-000000000005',
  veer1: 'd1000006-0000-0000-0000-000000000006',
  veer2: 'd1000007-0000-0000-0000-000000000007',
  sunder: 'd1000008-0000-0000-0000-000000000008',
}

const BOOKINGS = {
  b1: 'e1000001-0000-0000-0000-000000000001',
  b2: 'e1000002-0000-0000-0000-000000000002',
  b3: 'e1000003-0000-0000-0000-000000000003',
  b4: 'e1000004-0000-0000-0000-000000000004',
  b5: 'e1000005-0000-0000-0000-000000000005',
  b6: 'e1000006-0000-0000-0000-000000000006',
  b7: 'e1000007-0000-0000-0000-000000000007',
  b8: 'e1000008-0000-0000-0000-000000000008',
  b9: 'e1000009-0000-0000-0000-000000000009',
  b10: 'e1000010-0000-0000-0000-000000000010',
  b11: 'e1000011-0000-0000-0000-000000000011',
  b12: 'e1000012-0000-0000-0000-000000000012',
}

const now = new Date()
const daysAgo = (d) => new Date(now - d * 86400000).toISOString()
const daysFromNow = (d) => new Date(now.getTime() + d * 86400000).toISOString()

async function seed() {
  let errors = 0

  console.log('Inserting wards...')
  const { error: wErr } = await sb.from('wards').upsert([
    { id: VAISHALI_WARD, name: 'Vaishali Nagar', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.8938, lng: 75.7753, created_at: daysAgo(90) },
    { id: MALVIYA_WARD, name: 'Malviya Nagar', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.8725, lng: 75.8075, created_at: daysAgo(90) },
    { id: JAGATPURA_WARD, name: 'Jagatpura', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.8550, lng: 75.8180, created_at: daysAgo(90) },
    { id: CIVIL_LINES_WARD, name: 'Civil Lines', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.9128, lng: 75.7872, created_at: daysAgo(90) },
  ], { onConflict: 'id' })
  if (wErr) { console.error('Wards error:', wErr); errors++ }

  console.log('Inserting owners...')
  const { error: oErr } = await sb.from('users').upsert([
    { id: OWNERS.balaji, auth_id: null, name: 'Balaji Water Suppliers', phone: '9876540001', role: 'owner', ward_id: VAISHALI_WARD, language: 'hi', subsidy_points: 0, created_at: daysAgo(85) },
    { id: OWNERS.shyam, auth_id: null, name: 'Shri Shyam Tanker Services', phone: '9876540002', role: 'owner', ward_id: EXISTING_WARD, language: 'hi', subsidy_points: 0, created_at: daysAgo(80) },
    { id: OWNERS.harsh, auth_id: null, name: 'Harsh Aqua Corporation', phone: '9876540003', role: 'owner', ward_id: MALVIYA_WARD, language: 'en', subsidy_points: 0, created_at: daysAgo(75) },
    { id: OWNERS.veer, auth_id: null, name: 'Veer Teja Water Supply', phone: '9876540004', role: 'owner', ward_id: JAGATPURA_WARD, language: 'hi', subsidy_points: 0, created_at: daysAgo(70) },
  ], { onConflict: 'id' })
  if (oErr) { console.error('Owners error:', oErr); errors++ }

  console.log('Inserting drivers...')
  const { error: dErr } = await sb.from('users').upsert([
    { id: DRIVERS.ram, auth_id: null, name: 'Ramveer Singh', phone: '9876540010', role: 'driver', ward_id: null, language: 'hi', subsidy_points: 0, created_at: daysAgo(80) },
    { id: DRIVERS.sham, auth_id: null, name: 'Shambhu Sharma', phone: '9876540011', role: 'driver', ward_id: null, language: 'hi', subsidy_points: 0, created_at: daysAgo(75) },
    { id: DRIVERS.ganesh, auth_id: null, name: 'Ganesh Lal', phone: '9876540012', role: 'driver', ward_id: null, language: 'hi', subsidy_points: 0, created_at: daysAgo(70) },
    { id: DRIVERS.mahesh, auth_id: null, name: 'Mahesh Prajapat', phone: '9876540013', role: 'driver', ward_id: null, language: 'hi', subsidy_points: 0, created_at: daysAgo(65) },
  ], { onConflict: 'id' })
  if (dErr) { console.error('Drivers error:', dErr); errors++ }

  console.log('Inserting residents...')
  const { error: rErr } = await sb.from('users').upsert([
    { id: RESIDENTS.rahul, auth_id: null, name: 'Rahul Meena', phone: '9876540020', role: 'resident', ward_id: VAISHALI_WARD, language: 'hi', subsidy_points: 120, created_at: daysAgo(60) },
    { id: RESIDENTS.sakshi, auth_id: null, name: 'Sakshi Gupta', phone: '9876540021', role: 'resident', ward_id: MALVIYA_WARD, language: 'en', subsidy_points: 85, created_at: daysAgo(55) },
    { id: RESIDENTS.deepak, auth_id: null, name: 'Deepak Jat', phone: '9876540022', role: 'resident', ward_id: JAGATPURA_WARD, language: 'hi', subsidy_points: 200, created_at: daysAgo(50) },
    { id: RESIDENTS.neha, auth_id: null, name: 'Neha Choudhary', phone: '9876540023', role: 'resident', ward_id: CIVIL_LINES_WARD, language: 'en', subsidy_points: 50, created_at: daysAgo(45) },
    { id: RESIDENTS.vikram, auth_id: null, name: 'Vikram Singh', phone: '9876540024', role: 'resident', ward_id: EXISTING_WARD, language: 'hi', subsidy_points: 0, created_at: daysAgo(40) },
  ], { onConflict: 'id' })
  if (rErr) { console.error('Residents error:', rErr); errors++ }

  console.log('Inserting coordinators...')
  const { error: cErr } = await sb.from('users').upsert([
    { id: COORDS.anjali, auth_id: null, name: 'Anjali Kumari', phone: '9876540030', role: 'coordinator', ward_id: VAISHALI_WARD, language: 'hi', subsidy_points: 0, created_at: daysAgo(50) },
    { id: COORDS.karan, auth_id: null, name: 'Karan Patel', phone: '9876540031', role: 'coordinator', ward_id: MALVIYA_WARD, language: 'en', subsidy_points: 0, created_at: daysAgo(45) },
  ], { onConflict: 'id' })
  if (cErr) { console.error('Coords error:', cErr); errors++ }

  console.log('Inserting tankers...')
  const { error: tErr } = await sb.from('tankers').upsert([
    { id: TANKERS.balaji1, owner_id: OWNERS.balaji, driver_id: DRIVERS.ram, operator_name: 'Balaji Water Suppliers', vehicle_number: 'RJ14-WT-1001', capacity_liters: 5000, price_per_liter: 0.35, is_certified: true, is_available: true, current_lat: 26.8950, current_lng: 75.7760, rating: 4.4, total_deliveries: 187, created_at: daysAgo(85) },
    { id: TANKERS.balaji2, owner_id: OWNERS.balaji, driver_id: DRIVERS.sham, operator_name: 'Balaji Water Suppliers', vehicle_number: 'RJ14-WT-1002', capacity_liters: 3000, price_per_liter: 0.40, is_certified: true, is_available: true, current_lat: 26.8920, current_lng: 75.7740, rating: 4.2, total_deliveries: 95, created_at: daysAgo(80) },
    { id: TANKERS.shyam1, owner_id: OWNERS.shyam, driver_id: DRIVERS.ganesh, operator_name: 'Shri Shyam Tanker Service', vehicle_number: 'RJ14-WT-2001', capacity_liters: 8000, price_per_liter: 0.30, is_certified: true, is_available: true, current_lat: 26.8470, current_lng: 75.8030, rating: 4.1, total_deliveries: 156, created_at: daysAgo(80) },
    { id: TANKERS.shyam2, owner_id: OWNERS.shyam, driver_id: EXISTING_DRIVER, operator_name: 'Shri Shyam Tanker Service', vehicle_number: 'RJ14-WT-2002', capacity_liters: 5000, price_per_liter: 0.32, is_certified: false, is_available: true, current_lat: 26.8440, current_lng: 75.8060, rating: 3.8, total_deliveries: 67, created_at: daysAgo(75) },
    { id: TANKERS.harsh1, owner_id: OWNERS.harsh, driver_id: DRIVERS.mahesh, operator_name: 'Harsh Aqua Water Suppliers', vehicle_number: 'RJ14-WT-3001', capacity_liters: 5000, price_per_liter: 0.45, is_certified: true, is_available: true, current_lat: 26.8730, current_lng: 75.8090, rating: 5.0, total_deliveries: 210, created_at: daysAgo(75) },
    { id: TANKERS.veer1, owner_id: OWNERS.veer, driver_id: DRIVERS.ram, operator_name: 'Veer Teja Water Supplier', vehicle_number: 'RJ14-WT-4001', capacity_liters: 3000, price_per_liter: 0.28, is_certified: false, is_available: true, current_lat: 26.8560, current_lng: 75.8190, rating: 4.5, total_deliveries: 134, created_at: daysAgo(70) },
    { id: TANKERS.veer2, owner_id: OWNERS.veer, driver_id: DRIVERS.sham, operator_name: 'Veer Teja Water Supplier', vehicle_number: 'RJ14-WT-4002', capacity_liters: 10000, price_per_liter: 0.25, is_certified: true, is_available: true, current_lat: 26.8530, current_lng: 75.8170, rating: 4.3, total_deliveries: 89, created_at: daysAgo(65) },
    { id: TANKERS.sunder, owner_id: EXISTING_OWNER, driver_id: DRIVERS.ganesh, operator_name: 'Sunder Traders Water Supply', vehicle_number: 'RJ14-WT-5001', capacity_liters: 5000, price_per_liter: 0.38, is_certified: true, is_available: true, current_lat: 26.9100, current_lng: 75.8100, rating: 4.1, total_deliveries: 312, created_at: daysAgo(80) },
  ], { onConflict: 'id' })
  if (tErr) { console.error('Tankers error:', tErr); errors++ }

  console.log('Inserting bookings...')
  const { error: bErr } = await sb.from('bookings').upsert([
    { id: BOOKINGS.b1, type: 'individual', status: 'delivered', tanker_id: TANKERS.balaji1, coordinator_id: null, ward_id: VAISHALI_WARD, resident_id: RESIDENTS.rahul, volume_ordered: 3000, volume_delivered: 3000, price_per_liter: 0.35, total_amount: 1050, delivery_address: '45, Vaishali Nagar Sector 3', delivery_lat: 26.8940, delivery_lng: 75.7755, scheduled_at: daysAgo(20), delivered_at: daysAgo(19), anomaly_flagged: false, anomaly_reason: null, cv_confirmed: true, created_at: daysAgo(20) },
    { id: BOOKINGS.b2, type: 'individual', status: 'delivered', tanker_id: TANKERS.shyam1, coordinator_id: null, ward_id: EXISTING_WARD, resident_id: RESIDENTS.vikram, volume_ordered: 5000, volume_delivered: 4800, price_per_liter: 0.30, total_amount: 1500, delivery_address: '12, Mansarovar Sector 7', delivery_lat: 26.8475, delivery_lng: 75.8025, scheduled_at: daysAgo(18), delivered_at: daysAgo(17), anomaly_flagged: false, anomaly_reason: null, cv_confirmed: true, created_at: daysAgo(18) },
    { id: BOOKINGS.b3, type: 'individual', status: 'delivered', tanker_id: TANKERS.harsh1, coordinator_id: null, ward_id: MALVIYA_WARD, resident_id: RESIDENTS.sakshi, volume_ordered: 2000, volume_delivered: 2000, price_per_liter: 0.45, total_amount: 900, delivery_address: '78, Malviya Nagar Block B', delivery_lat: 26.8720, delivery_lng: 75.8080, scheduled_at: daysAgo(15), delivered_at: daysAgo(14), anomaly_flagged: false, anomaly_reason: null, cv_confirmed: true, created_at: daysAgo(15) },
    { id: BOOKINGS.b4, type: 'individual', status: 'delivered', tanker_id: TANKERS.veer1, coordinator_id: null, ward_id: JAGATPURA_WARD, resident_id: RESIDENTS.deepak, volume_ordered: 3000, volume_delivered: 2900, price_per_liter: 0.28, total_amount: 840, delivery_address: '33, Jagatpura Getor Road', delivery_lat: 26.8555, delivery_lng: 75.8175, scheduled_at: daysAgo(12), delivered_at: daysAgo(11), anomaly_flagged: false, anomaly_reason: null, cv_confirmed: true, created_at: daysAgo(12) },
    { id: BOOKINGS.b5, type: 'individual', status: 'delivered', tanker_id: TANKERS.shyam2, coordinator_id: null, ward_id: EXISTING_WARD, resident_id: EXISTING_RESIDENT, volume_ordered: 5000, volume_delivered: 5000, price_per_liter: 0.80, total_amount: 4000, delivery_address: '5, Mansarovar Sector 2', delivery_lat: 26.8460, delivery_lng: 75.8040, scheduled_at: daysAgo(10), delivered_at: daysAgo(9), anomaly_flagged: true, anomaly_reason: 'Price 167% above ward average of 0.30/L — possible price gouging', cv_confirmed: true, created_at: daysAgo(10) },
    { id: BOOKINGS.b6, type: 'individual', status: 'delivered', tanker_id: TANKERS.sunder, coordinator_id: null, ward_id: CIVIL_LINES_WARD, resident_id: RESIDENTS.neha, volume_ordered: 4000, volume_delivered: 4000, price_per_liter: 0.38, total_amount: 1520, delivery_address: '22, Civil Lines Metro Station Road', delivery_lat: 26.9130, delivery_lng: 75.7870, scheduled_at: daysAgo(8), delivered_at: daysAgo(7), anomaly_flagged: false, anomaly_reason: null, cv_confirmed: true, created_at: daysAgo(8) },
    { id: BOOKINGS.b7, type: 'individual', status: 'delivered', tanker_id: TANKERS.balaji2, coordinator_id: null, ward_id: VAISHALI_WARD, resident_id: RESIDENTS.rahul, volume_ordered: 3000, volume_delivered: 3000, price_per_liter: 0.40, total_amount: 1200, delivery_address: '45, Vaishali Nagar Sector 3', delivery_lat: 26.8940, delivery_lng: 75.7755, scheduled_at: daysAgo(7), delivered_at: daysAgo(6), anomaly_flagged: false, anomaly_reason: null, cv_confirmed: true, created_at: daysAgo(7) },
    { id: BOOKINGS.b8, type: 'individual', status: 'dispatched', tanker_id: TANKERS.harsh1, coordinator_id: null, ward_id: MALVIYA_WARD, resident_id: RESIDENTS.sakshi, volume_ordered: 5000, volume_delivered: null, price_per_liter: 0.45, total_amount: 2250, delivery_address: '78, Malviya Nagar Block B', delivery_lat: 26.8720, delivery_lng: 75.8080, scheduled_at: daysFromNow(1), delivered_at: null, anomaly_flagged: false, anomaly_reason: null, cv_confirmed: null, created_at: daysAgo(1) },
    { id: BOOKINGS.b9, type: 'individual', status: 'confirmed', tanker_id: TANKERS.veer2, coordinator_id: null, ward_id: JAGATPURA_WARD, resident_id: RESIDENTS.deepak, volume_ordered: 10000, volume_delivered: null, price_per_liter: 0.25, total_amount: 2500, delivery_address: '33, Jagatpura Getor Road', delivery_lat: 26.8555, delivery_lng: 75.8175, scheduled_at: daysFromNow(2), delivered_at: null, anomaly_flagged: false, anomaly_reason: null, cv_confirmed: null, created_at: daysAgo(2) },
    { id: BOOKINGS.b10, type: 'community', status: 'open', tanker_id: null, coordinator_id: COORDS.anjali, ward_id: VAISHALI_WARD, resident_id: COORDS.anjali, volume_ordered: 15000, volume_delivered: null, price_per_liter: 0.30, total_amount: 4500, delivery_address: 'Vaishali Nagar Community Hall', delivery_lat: 26.8935, delivery_lng: 75.7750, scheduled_at: daysFromNow(4), delivered_at: null, anomaly_flagged: false, anomaly_reason: null, cv_confirmed: null, created_at: daysAgo(1) },
    { id: BOOKINGS.b11, type: 'individual', status: 'pending', tanker_id: TANKERS.balaji1, coordinator_id: null, ward_id: VAISHALI_WARD, resident_id: RESIDENTS.rahul, volume_ordered: 2000, volume_delivered: null, price_per_liter: 0.35, total_amount: 700, delivery_address: '45, Vaishali Nagar Sector 3', delivery_lat: 26.8940, delivery_lng: 75.7755, scheduled_at: daysFromNow(3), delivered_at: null, anomaly_flagged: false, anomaly_reason: null, cv_confirmed: null, created_at: now.toISOString() },
    { id: BOOKINGS.b12, type: 'individual', status: 'open', tanker_id: null, coordinator_id: null, ward_id: CIVIL_LINES_WARD, resident_id: RESIDENTS.neha, volume_ordered: 3000, volume_delivered: null, price_per_liter: 0.40, total_amount: 1200, delivery_address: '22, Civil Lines Metro Station Road', delivery_lat: 26.9130, delivery_lng: 75.7870, scheduled_at: daysFromNow(5), delivered_at: null, anomaly_flagged: false, anomaly_reason: null, cv_confirmed: null, created_at: now.toISOString() },
  ], { onConflict: 'id' })
  if (bErr) { console.error('Bookings error:', bErr); errors++ }

  console.log('Inserting participants...')
  const { error: pErr } = await sb.from('booking_participants').upsert([
    { id: 'f1000001-0000-0000-0000-000000000001', booking_id: BOOKINGS.b10, user_id: COORDS.anjali, share_liters: 5000, share_amount: 1500, payment_status: 'paid', payment_method: 'upi', payment_ref: null, joined_at: daysAgo(1) },
    { id: 'f1000002-0000-0000-0000-000000000002', booking_id: BOOKINGS.b10, user_id: RESIDENTS.rahul, share_liters: 3000, share_amount: 900, payment_status: 'paid', payment_method: 'upi', payment_ref: null, joined_at: daysAgo(1) },
    { id: 'f1000003-0000-0000-0000-000000000003', booking_id: BOOKINGS.b10, user_id: RESIDENTS.vikram, share_liters: 4000, share_amount: 1200, payment_status: 'pending', payment_method: null, payment_ref: null, joined_at: daysAgo(0) },
  ], { onConflict: 'id' })
  if (pErr) { console.error('Participants error:', pErr); errors++ }

  console.log('Inserting heatwave alerts...')
  const { error: hErr } = await sb.from('heatwave_alerts').upsert([
    { id: 'aaaa0001-0000-0000-0000-000000000001', district: 'Jaipur', state: 'Rajasthan', temperature: 43.2, feels_like: 47.5, severity: 'warning', ai_advisory: 'Jaipur mein heatwave warning hai. 12 PM se 4 PM tak ghar mein rahein. Paani peete rahein. AC ya cooler chalayein.', cooling_centers: null, ors_points: null, active: true, created_at: daysAgo(2), expires_at: daysFromNow(5) },
    { id: 'aaaa0002-0000-0000-0000-000000000002', district: 'Jaipur', state: 'Rajasthan', temperature: 45.8, feels_like: 50.2, severity: 'emergency', ai_advisory: 'Jaipur mein extreme heat emergency. Turant paani arrange karein. Bahar bilkul na niklein. ORS piyein. JalSetu se tanker book karein.', cooling_centers: null, ors_points: null, active: true, created_at: daysAgo(1), expires_at: daysFromNow(3) },
    { id: 'aaaa0003-0000-0000-0000-000000000003', district: 'Jaipur', state: 'Rajasthan', temperature: 40.5, feels_like: 43.0, severity: 'watch', ai_advisory: 'Jaipur mein garmi ki nigrani jaari hai. Paani piyein aur dhoop se bachein. Community booking se 20% bachat karein.', cooling_centers: null, ors_points: null, active: true, created_at: daysAgo(0), expires_at: daysFromNow(7) },
  ], { onConflict: 'id' })
  if (hErr) { console.error('Heatwave error:', hErr); errors++ }

  console.log('Inserting anomaly logs...')
  const { error: aErr } = await sb.from('anomaly_logs').upsert([
    { id: 'aaaa0001-0000-0000-0000-000000000010', booking_id: BOOKINGS.b5, tanker_id: TANKERS.shyam2, ward_id: EXISTING_WARD, district_avg_price: 0.30, charged_price: 0.80, percent_above: 167, ai_reason: 'Price is 167% above ward average. Likely price gouging during water shortage. Tanker operator may be exploiting high demand in Mansarovar.', resolved: false, created_at: daysAgo(10) },
  ], { onConflict: 'id' })
  if (aErr) { console.error('Anomaly logs error:', aErr); errors++ }

  console.log('Inserting nudge logs...')
  const { error: nErr } = await sb.from('nudge_log').upsert([
    { id: 'bbbb0001-0000-0000-0000-000000000001', user_id: RESIDENTS.rahul, type: 'predictive', message: 'Rahul ji, aapka last order 7 din pehle tha. Garmi badh rahi hai — paani ka stock rakhein. JalSetu se abhi book karein!', read: false, created_at: daysAgo(1) },
    { id: 'bbbb0002-0000-0000-0000-000000000002', user_id: RESIDENTS.sakshi, type: 'heatwave', message: 'Sakshi, Jaipur mein heatwave warning hai. Paani ki zarurat badh sakti hai. Community booking mein join karein aur 20% bachat karein!', read: false, created_at: daysAgo(0) },
    { id: 'bbbb0003-0000-0000-0000-000000000003', user_id: RESIDENTS.deepak, type: 'predictive', message: 'Deepak, aapka paani 2-3 din mein khatam ho sakta hai. Abhi book karein toh best price milega.', read: true, created_at: daysAgo(2) },
    { id: 'bbbb0004-0000-0000-0000-000000000004', user_id: EXISTING_RESIDENT, type: 'predictive', message: 'Priya ji, Mansarovar mein paani ki demand zyada hai. Early book karein toh best tanker milega.', read: false, created_at: daysAgo(1) },
    { id: 'bbbb0005-0000-0000-0000-000000000005', user_id: RESIDENTS.neha, type: 'heatwave', message: 'Neha, Civil Lines mein heatwave alert hai. JalSetu se paani book karein — certified tankers available hain.', read: false, created_at: daysAgo(0) },
  ], { onConflict: 'id' })
  if (nErr) { console.error('Nudge logs error:', nErr); errors++ }

  console.log('Inserting reviews...')
  const { error: rvErr } = await sb.from('reviews').upsert([
    { id: 'cccc0001-0000-0000-0000-000000000001', booking_id: BOOKINGS.b1, user_id: RESIDENTS.rahul, tanker_id: TANKERS.balaji1, rating: 5, comment: 'Bahut acha tanker! Samay pe aaya aur paani saaf tha. Highly recommend Balaji Water.', created_at: daysAgo(19) },
    { id: 'cccc0002-0000-0000-0000-000000000002', booking_id: BOOKINGS.b2, user_id: RESIDENTS.vikram, tanker_id: TANKERS.shyam1, rating: 4, comment: 'Good service, 200L less than ordered but driver adjusted quickly. Price was fair.', created_at: daysAgo(17) },
    { id: 'cccc0003-0000-0000-0000-000000000003', booking_id: BOOKINGS.b3, user_id: RESIDENTS.sakshi, tanker_id: TANKERS.harsh1, rating: 5, comment: 'Excellent service! Clean water, on time delivery. Harsh Aqua is the best in Malviya Nagar.', created_at: daysAgo(14) },
    { id: 'cccc0004-0000-0000-0000-000000000004', booking_id: BOOKINGS.b4, user_id: RESIDENTS.deepak, tanker_id: TANKERS.veer1, rating: 5, comment: 'Sasta aur acha! Veer Teja bhai ne time pe deliver kiya. Jagatpura mein best option.', created_at: daysAgo(11) },
    { id: 'cccc0005-0000-0000-0000-000000000005', booking_id: BOOKINGS.b5, user_id: EXISTING_RESIDENT, tanker_id: TANKERS.shyam2, rating: 2, comment: 'Price bahut zyada tha — ₹0.80/L jo ki 2x se zyada hai. Pehle confirm karo ki rate sahi hai.', created_at: daysAgo(9) },
    { id: 'cccc0006-0000-0000-0000-000000000006', booking_id: BOOKINGS.b6, user_id: RESIDENTS.neha, tanker_id: TANKERS.sunder, rating: 4, comment: 'Sunder Traders reliable hai. Civil Lines area mein timely delivery mili.', created_at: daysAgo(7) },
  ], { onConflict: 'id' })
  if (rvErr) { console.error('Reviews error:', rvErr); errors++ }

  console.log('Inserting payments...')
  const { error: payErr } = await sb.from('payments').upsert([
    { id: 'dddd0001-0000-0000-0000-000000000001', booking_id: BOOKINGS.b1, user_id: RESIDENTS.rahul, amount: 1050, method: 'upi', status: 'success', razorpay_order_id: null, razorpay_payment_id: null, created_at: daysAgo(20) },
    { id: 'dddd0002-0000-0000-0000-000000000002', booking_id: BOOKINGS.b2, user_id: RESIDENTS.vikram, amount: 1500, method: 'upi', status: 'success', razorpay_order_id: null, razorpay_payment_id: null, created_at: daysAgo(18) },
    { id: 'dddd0003-0000-0000-0000-000000000003', booking_id: BOOKINGS.b3, user_id: RESIDENTS.sakshi, amount: 900, method: 'upi', status: 'success', razorpay_order_id: null, razorpay_payment_id: null, created_at: daysAgo(15) },
    { id: 'dddd0004-0000-0000-0000-000000000004', booking_id: BOOKINGS.b4, user_id: RESIDENTS.deepak, amount: 840, method: 'cash', status: 'success', razorpay_order_id: null, razorpay_payment_id: null, created_at: daysAgo(12) },
    { id: 'dddd0005-0000-0000-0000-000000000005', booking_id: BOOKINGS.b5, user_id: EXISTING_RESIDENT, amount: 4000, method: 'upi', status: 'success', razorpay_order_id: null, razorpay_payment_id: null, created_at: daysAgo(10) },
    { id: 'dddd0006-0000-0000-0000-000000000006', booking_id: BOOKINGS.b6, user_id: RESIDENTS.neha, amount: 1520, method: 'upi', status: 'success', razorpay_order_id: null, razorpay_payment_id: null, created_at: daysAgo(8) },
    { id: 'dddd0007-0000-0000-0000-000000000007', booking_id: BOOKINGS.b7, user_id: RESIDENTS.rahul, amount: 1200, method: 'upi', status: 'success', razorpay_order_id: null, razorpay_payment_id: null, created_at: daysAgo(7) },
    { id: 'dddd0008-0000-0000-0000-000000000008', booking_id: BOOKINGS.b8, user_id: RESIDENTS.sakshi, amount: 2250, method: 'upi', status: 'success', razorpay_order_id: null, razorpay_payment_id: null, created_at: daysAgo(1) },
    { id: 'dddd0009-0000-0000-0000-000000000009', booking_id: BOOKINGS.b9, user_id: RESIDENTS.deepak, amount: 2500, method: 'upi', status: 'success', razorpay_order_id: null, razorpay_payment_id: null, created_at: daysAgo(2) },
  ], { onConflict: 'id' })
  if (payErr) { console.error('Payments error:', payErr); errors++ }

  console.log(`\nDone! ${errors === 0 ? 'All data seeded successfully.' : `${errors} errors occurred.`}`)
}

seed().catch(console.error)
