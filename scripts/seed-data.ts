import { readFileSync } from 'fs'
import { resolve } from 'path'

const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8')
const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)="?(.+?)"?\s*$/)
  if (match) env[match[1]] = match[2]
})

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

async function supaInsert(table: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  const res = await fetch(`${URL}/rest/v1/${table}`, { method: 'POST', headers, body: JSON.stringify(data) })
  if (!res.ok) { const e = await res.text(); console.error(`INSERT ${table} failed:`, e); return null }
  return res.json()
}

async function supaUpsert(table: string, data: Record<string, unknown> | Record<string, unknown>[], onConflict?: string) {
  const h = { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' }
  if (onConflict) h.Prefer += `,on_conflict=${onConflict}`
  const res = await fetch(`${URL}/rest/v1/${table}`, { method: 'POST', headers: h, body: JSON.stringify(data) })
  if (!res.ok) { const e = await res.text(); console.error(`UPSERT ${table} failed:`, e); return null }
  return res.json()
}

async function supaUpdate(table: string, data: Record<string, unknown>, filter: string) {
  const res = await fetch(`${URL}/rest/v1/${table}?${filter}`, { method: 'PATCH', headers, body: JSON.stringify(data) })
  if (!res.ok) { const e = await res.text(); console.error(`UPDATE ${table} failed:`, e) }
}

async function supaDelete(table: string, filter: string) {
  const res = await fetch(`${URL}/rest/v1/${table}?${filter}`, { method: 'DELETE', headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  if (!res.ok) { const e = await res.text(); console.error(`DELETE ${table} failed:`, e) }
}

async function supaSelect(table: string, select = '*', filter = '') {
  const url = `${URL}/rest/v1/${table}?select=${select}${filter ? '&' + filter : ''}`
  const res = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  return res.json()
}

async function getOrCreateUser(email: string, name: string, phone: string, role: string, extras: Record<string, unknown> = {}): Promise<string | null> {
  const { data: existing } = await supaSelect('users', 'id', `auth_id=not.is.null&role=eq.${role}`)
  const { data: usersByEmail } = await supaSelect('users', 'id', `role=eq.${role}`)
  if (usersByEmail && usersByEmail.length > 0) {
    const byAuth = await supaSelect('users', 'id,auth_id,name', `name=eq.${name}`)
    if (byAuth?.[0]?.id) return byAuth[0].id
  }
  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', email_confirm: true }),
  })
  const authData = await res.json()
  if (authData.code) { console.error(`  Auth create ${email}:`, authData.message); return null }
  const users = await supaInsert('users', { auth_id: authData.id, name, phone, role, ...extras })
  return users?.[0]?.id || null
}

const OWNER_ID = 'a4e94f56-0375-4e1f-84d1-d24327bec6d0'
const OWNER2_ID = '7036591c-4071-4980-a4bd-6314be78738f'
const DRIVER1_ID = '410fda8e-db12-4e2b-bcdc-9887d0f98852'
const DRIVER2_ID = '4ab49f45-1705-4ca1-b7c6-274faf7e1935'
const DRIVER3_ID = 'c16bc848-43b3-4c79-8835-83d60a79fb05'
const DRIVER4_ID = '2788bf72-c9cf-4408-b69a-d03e486e1405'
const COORD_ID = '95456931-b0e0-46ad-942a-c494e188d7cd'
const R1_ID = 'c8433c39-1b98-454a-8fa7-b5a15ce18f8f'
const R2_ID = '85702bdb-c0c2-4fc0-8877-02462842ee9f'
const R3_ID = '8a11f5ee-1aba-4289-8dc7-45f615676846'
const T1 = 'fbf8ea04-0f3b-4cb2-af56-f7be45332d7b'
const T2 = '778c18dd-2ec7-4c73-b550-93c2b168fba8'
const T3 = 'c2c8bbee-b17b-4f64-8b0f-fec569ca15cd'
const T4 = 'd3452b47-73f3-4c2e-9473-ae3e8762b0f9'

const WARD_MANSAROVAR = 'aaaaaaaa-0000-0000-0000-000000000001'
const WARD_VAISHALI = '9ef262a8-7735-4591-9601-cf726f69fc85'
const WARD_MALVIYA = 'cb830a6f-2256-4ade-ab99-e577e76a314a'
const WARD_CIVIL = '0dfb36c8-4a0a-4d78-a259-e7e42adb85fe'
const WARD_TONK = '4dce8a39-fc49-4eaa-a173-931f940daf0e'
const WARD_JAGATPURA = '9be4f7be-8974-44fe-b7c9-2401d002b48b'
const ALL_WARDS = [WARD_MANSAROVAR, WARD_VAISHALI, WARD_MALVIYA, WARD_CIVIL, WARD_TONK, WARD_JAGATPURA]

const WARD_ADDRESSES: Record<string, { address: string; lat: number; lng: number }[]> = {
  [WARD_MANSAROVAR]: [
    { address: '33 Mansarovar, Jaipur, Rajasthan 302020', lat: 26.8467, lng: 75.8026 },
    { address: '78 Civil Lines, Jaipur, Rajasthan 302006', lat: 26.9210, lng: 75.7870 },
  ],
  [WARD_VAISHALI]: [
    { address: '55 Vaishali Nagar, Jaipur, Rajasthan 302021', lat: 26.9110, lng: 75.7270 },
    { address: '15 Jhotwara, Jaipur, Rajasthan 302012', lat: 26.9420, lng: 75.7730 },
  ],
  [WARD_MALVIYA]: [
    { address: '45 Malviya Nagar, Jaipur, Rajasthan 302017', lat: 26.8850, lng: 75.8070 },
    { address: '12 Bapu Nagar, Jaipur, Rajasthan 302015', lat: 26.8930, lng: 75.8120 },
  ],
  [WARD_CIVIL]: [
    { address: '88 Shastri Nagar, Jaipur, Rajasthan 302003', lat: 26.9330, lng: 75.7830 },
    { address: '67 Raja Park, Jaipur, Rajasthan 302004', lat: 26.8930, lng: 75.8110 },
  ],
  [WARD_TONK]: [
    { address: '9 Tonk Road, Jaipur, Rajasthan 302018', lat: 26.8950, lng: 75.8050 },
    { address: '41 Laxmi Colony, Jaipur, Rajasthan 302015', lat: 26.8870, lng: 75.8090 },
  ],
  [WARD_JAGATPURA]: [
    { address: '21 Jagatpura, Jaipur, Rajasthan 302025', lat: 26.8630, lng: 75.8180 },
    { address: '52 Sodala, Jaipur, Rajasthan 302019', lat: 26.9080, lng: 75.7800 },
  ],
}

const REVIEWS = [
  'Excellent service! Water delivered on time and in good quantity.',
  'Very professional driver. Tank was full and clean.',
  'Good experience overall. Would recommend to neighbors.',
  'Quick delivery. The CV verification gave us confidence.',
  'Satisfied with the service. Water quality was good.',
  'Driver arrived on time. Volume matched the order.',
  'Reliable service. Have used multiple times now.',
  'Great coordination between owner and driver.',
  'Fair pricing and honest delivery. No issues.',
  'Community booking was smooth. Everyone got their share.',
  'Fast response to our heatwave emergency booking.',
  'The GPS tracking was helpful to know when they would arrive.',
  'Water was clean and delivery was prompt.',
  'Good communication from the driver throughout.',
  'Verified volume with the CV scan. Very transparent.',
]

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randBetween(a: number, b: number) { return Math.round((Math.random() * (b - a) + a) * 100) / 100 }
function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n)
  d.setHours(Math.floor(Math.random() * 6) + 8, Math.floor(Math.random() * 60), 0, 0)
  return d
}

async function main() {
  console.log('=== JALSETU SEED SCRIPT ===\n')

  console.log('Clearing old data...')
  await supaDelete('driver_location_history', 'driver_id=neq.00000000-0000-0000-0000-000000000000')
  await supaDelete('driver_locations', 'driver_id=neq.00000000-0000-0000-0000-000000000000')
  await supaDelete('receipts', 'id=neq.00000000-0000-0000-0000-000000000000')
  await supaDelete('booking_participants', 'id=neq.00000000-0000-0000-0000-000000000000')
  await supaDelete('reviews', 'id=neq.00000000-0000-0000-0000-000000000000')
  await supaDelete('bookings', 'id=neq.00000000-0000-0000-0000-000000000000')
  console.log('  Done.\n')

  console.log('Upserting wards...')
  const wards = [
    { id: WARD_MANSAROVAR, name: 'Mansarovar Ward 12', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.8467, lng: 75.8026 },
    { id: WARD_VAISHALI, name: 'Vaishali Nagar Ward 8', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.9110, lng: 75.7270 },
    { id: WARD_MALVIYA, name: 'Malviya Nagar Ward 15', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.8850, lng: 75.8070 },
    { id: WARD_CIVIL, name: 'Civil Lines Ward 3', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.9210, lng: 75.7870 },
    { id: WARD_TONK, name: 'Tonk Road Ward 20', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.8950, lng: 75.8050 },
    { id: WARD_JAGATPURA, name: 'Jagatpura Ward 25', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.8630, lng: 75.8180 },
  ]
  await supaUpsert('wards', wards, 'id')
  console.log(`  Upserted ${wards.length} wards\n`)

  console.log('Assigning residents to wards...')
  await supaUpdate('users', { ward_id: WARD_VAISHALI }, `id=eq.${R1_ID}`)
  await supaUpdate('users', { ward_id: WARD_MANSAROVAR }, `id=eq.${R2_ID}`)
  await supaUpdate('users', { ward_id: WARD_CIVIL }, `id=eq.${R3_ID}`)
  console.log('  resident1 -> Vaishali Nagar Ward 8')
  console.log('  resident2 -> Mansarovar Ward 12')
  console.log('  resident3 -> Civil Lines Ward 3\n')

  const allDrivers = [DRIVER1_ID, DRIVER2_ID, DRIVER3_ID, DRIVER4_ID]
  const allResidents = [R1_ID, R2_ID, R3_ID]

  console.log('Updating tankers...')
  const tankerUpdates = [
    { id: T3, owner_id: OWNER_ID, driver_id: DRIVER3_ID, operator_name: 'Ganga Water Supply', capacity_liters: 7500, price_per_liter: 1.20, is_certified: true, current_lat: 26.885, current_lng: 75.807, rating: 4.3, total_deliveries: 156, is_available: true },
    { id: T1, owner_id: OWNER_ID, driver_id: DRIVER1_ID, operator_name: 'Neeraj Tankers', capacity_liters: 11000, price_per_liter: 0.70, is_certified: true, current_lat: 26.893, current_lng: 75.812, rating: 4.6, total_deliveries: 312, is_available: true },
    { id: T4, owner_id: OWNER2_ID, driver_id: DRIVER4_ID, operator_name: 'Brij Water Works', capacity_liters: 8500, price_per_liter: 1.05, is_certified: false, current_lat: 26.863, current_lng: 75.818, rating: 3.9, total_deliveries: 78, is_available: true },
    { id: T2, owner_id: OWNER2_ID, driver_id: DRIVER2_ID, operator_name: 'Yamuna Tankers', capacity_liters: 10000, price_per_liter: 0.95, is_certified: true, current_lat: 26.908, current_lng: 75.780, rating: 4.1, total_deliveries: 203, is_available: true },
  ]

  for (const t of tankerUpdates) {
    const { id, ...fields } = t
    await supaUpdate('tankers', fields, `id=eq.${id}`)
    console.log(`  ${t.operator_name} (${t.capacity_liters}L, driver: ${t.driver_id.slice(0,8)})`)
  }
  console.log(`  Total tankers: 4\n`)

  const allTankers = [T1, T2, T3, T4]

  console.log('Creating delivery history across all wards...')
  const bookingIds: string[] = []

  for (let day = 1; day <= 7; day++) {
    const count = Math.floor(Math.random() * 3) + 2
    for (let i = 0; i < count; i++) {
      const wardId = pick(ALL_WARDS)
      const loc = pick(WARD_ADDRESSES[wardId])
      const tankerId = pick(allTankers)
      const driverId = pick(allDrivers)
      const residentId = pick(allResidents)
      const volume = pick([7000, 7500, 8000, 9000, 10000, 11000, 12000])
      const created = daysAgo(day)
      const delivered = new Date(created.getTime() + (Math.random() * 3 + 1) * 3600000)
      const pricePerLiter = pick([0.70, 0.80, 0.90, 1.05, 1.10, 1.20])
      const totalAmount = Math.round(volume * pricePerLiter)

      const rows = await supaInsert('bookings', {
        type: 'individual', status: 'delivered', tanker_id: tankerId, driver_id: driverId,
        resident_id: residentId, ward_id: wardId, volume_ordered: volume,
        volume_delivered: volume + Math.floor(Math.random() * 200 - 100),
        price_per_liter: pricePerLiter, total_amount: totalAmount,
        delivery_address: loc.address,
        delivery_lat: loc.lat + randBetween(-0.005, 0.005),
        delivery_lng: loc.lng + randBetween(-0.005, 0.005),
        anomaly_flagged: false, cv_confirmed: true,
        created_at: created.toISOString(), delivered_at: delivered.toISOString(),
      })

      if (rows?.[0]) {
        const bid = rows[0].id
        bookingIds.push(bid)
        await supaInsert('booking_participants', {
          booking_id: bid, user_id: residentId, share_liters: volume,
          share_amount: totalAmount, payment_status: 'paid', payment_method: 'upi',
        })
        await supaInsert('receipts', {
          booking_id: bid, user_id: residentId, amount: totalAmount,
          volume_liters: volume, tanker_id: tankerId, ward_id: wardId,
        })
      }
    }
    process.stdout.write(`  Day -${day}: ${count} bookings\n`)
  }
  console.log(`  Total delivered: ${bookingIds.length}\n`)

  console.log('Creating reviews...')
  let reviewCount = 0
  for (const bid of bookingIds) {
    if (Math.random() < 0.7) {
      const { data: b } = await supaSelect('bookings', 'resident_id,tanker_id', `id=eq.${bid}`)
      if (b?.[0]?.resident_id && b?.[0]?.tanker_id) {
        await supaInsert('reviews', {
          booking_id: bid, user_id: b[0].resident_id, tanker_id: b[0].tanker_id,
          rating: pick([3, 4, 4, 5, 5, 5]),
          comment: pick(REVIEWS),
          created_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        })
        reviewCount++
      }
    }
  }
  console.log(`  Created ${reviewCount} reviews\n`)

  console.log('Creating active bookings (one per driver)...')

  const ab1 = await supaInsert('bookings', {
    type: 'individual', status: 'confirmed', tanker_id: T1, driver_id: DRIVER1_ID,
    resident_id: R1_ID, ward_id: WARD_VAISHALI, volume_ordered: 8000, price_per_liter: 1.10, total_amount: 8800,
    delivery_address: WARD_ADDRESSES[WARD_VAISHALI][0].address,
    delivery_lat: WARD_ADDRESSES[WARD_VAISHALI][0].lat, delivery_lng: WARD_ADDRESSES[WARD_VAISHALI][0].lng,
    anomaly_flagged: false,
  })
  console.log(`  driver1 -> confirmed -> ${ab1?.[0]?.id}`)

  const ab2 = await supaInsert('bookings', {
    type: 'individual', status: 'dispatched', tanker_id: T4, driver_id: DRIVER2_ID,
    resident_id: R2_ID, ward_id: WARD_MANSAROVAR, volume_ordered: 10000, price_per_liter: 0.90, total_amount: 9000,
    delivery_address: WARD_ADDRESSES[WARD_MANSAROVAR][0].address,
    delivery_lat: WARD_ADDRESSES[WARD_MANSAROVAR][0].lat, delivery_lng: WARD_ADDRESSES[WARD_MANSAROVAR][0].lng,
    anomaly_flagged: false,
  })
  console.log(`  driver2 -> dispatched -> ${ab2?.[0]?.id}`)

  const ab3 = await supaInsert('bookings', {
    type: 'individual', status: 'dispatched', tanker_id: T3, driver_id: DRIVER3_ID,
    resident_id: R3_ID, ward_id: WARD_CIVIL, volume_ordered: 7500, price_per_liter: 2.50, total_amount: 18750,
    delivery_address: WARD_ADDRESSES[WARD_CIVIL][0].address,
    delivery_lat: WARD_ADDRESSES[WARD_CIVIL][0].lat, delivery_lng: WARD_ADDRESSES[WARD_CIVIL][0].lng,
    anomaly_flagged: false,
  })
  console.log(`  driver3 -> dispatched -> ${ab3?.[0]?.id}`)

  const ab4 = await supaInsert('bookings', {
    type: 'individual', status: 'confirmed', tanker_id: T4, driver_id: DRIVER4_ID,
    resident_id: R1_ID, ward_id: WARD_JAGATPURA, volume_ordered: 8500, price_per_liter: 1.05, total_amount: 8925,
    delivery_address: WARD_ADDRESSES[WARD_JAGATPURA][0].address,
    delivery_lat: WARD_ADDRESSES[WARD_JAGATPURA][0].lat, delivery_lng: WARD_ADDRESSES[WARD_JAGATPURA][0].lng,
    anomaly_flagged: false,
  })
  console.log(`  driver4 -> confirmed -> ${ab4?.[0]?.id}\n`)

  console.log('Creating driver GPS locations...')
  const driverLocations = [
    { driver_id: DRIVER1_ID, lat: 26.9115, lng: 75.7265, booking_id: ab1?.[0]?.id },
    { driver_id: DRIVER2_ID, lat: 26.8475, lng: 75.8030, booking_id: ab2?.[0]?.id },
    { driver_id: DRIVER3_ID, lat: 26.9215, lng: 75.7865, booking_id: ab3?.[0]?.id },
    { driver_id: DRIVER4_ID, lat: 26.8635, lng: 75.8175, booking_id: ab4?.[0]?.id },
  ]
  for (const loc of driverLocations) {
    await supaInsert('driver_locations', { ...loc, updated_at: new Date().toISOString() })
  }
  console.log('  Done.\n')

  console.log('Updating heatwave alert...')
  await supaUpdate('heatwave_alerts', { expires_at: new Date(Date.now() + 86400000 * 2).toISOString() }, 'active=eq.true')
  console.log('  Done.\n')

  console.log('=== SEED COMPLETE ===')
}

main().catch(console.error)
