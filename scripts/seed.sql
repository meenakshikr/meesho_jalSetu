
INSERT INTO wards (id, name, city, district, state, lat, lng, created_at) VALUES
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Koramangala',    'Bengaluru', 'Bengaluru South', 'Karnataka', 12.9352, 77.6245, now() - interval '90 days'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'HSR Layout',     'Bengaluru', 'Bengaluru South', 'Karnataka', 12.9116, 77.6389, now() - interval '90 days'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Whitefield',     'Bengaluru', 'Bengaluru East',  'Karnataka', 12.9698, 77.7500, now() - interval '90 days'),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'Yelahanka',      'Bengaluru', 'Bengaluru North', 'Karnataka', 13.1007, 77.5963, now() - interval '90 days'),
  ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', 'Banashankari',   'Bengaluru', 'Bengaluru South', 'Karnataka', 12.9250, 77.5475, now() - interval '90 days')
ON CONFLICT (id) DO NOTHING;


INSERT INTO auth.users (id, instance_id, role, aud, email, encrypted_password, created_at, updated_at) VALUES
  
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya@example.com',    crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rajesh@example.com',   crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anita@example.com',    crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'suresh@example.com',   crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'meena@example.com',    crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  -- Coordinators
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coordinator1@ex.com',  crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coordinator2@ex.com',  crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  -- Drivers
  ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'driver1@example.com',  crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'driver2@example.com',  crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'driver3@example.com',  crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  -- Owners
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner1@example.com',   crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner2@example.com',   crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner3@example.com',   crypt('demo123', gen_salt('bf')), now() - interval '90 days', now() - interval '90 days')
ON CONFLICT (id) DO NOTHING;


-- USERS (app profiles linked to auth)

INSERT INTO users (id, auth_id, name, phone, role, ward_id, language, subsidy_points, created_at) VALUES
  -- Residents (5)
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Priya Sharma',     '9876543210', 'resident',     'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'hi', 150, now() - interval '90 days'),
  ('10000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Rajesh Kumar',     '9876543211', 'resident',     'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'hi', 80,  now() - interval '90 days'),
  ('10000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Anita Desai',      '9876543212', 'resident',     'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'en', 200, now() - interval '90 days'),
  ('10000000-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'Suresh Babu',      '9876543213', 'resident',     'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'hi', 50,  now() - interval '90 days'),
  ('10000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 'Meena Kumari',     '9876543214', 'resident',     'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'hi', 0,   now() - interval '90 days'),
  -- Coordinators (2)
  ('10000000-0000-0000-0000-000000000006', '66666666-6666-6666-6666-666666666666', 'Arun Nair',        '9876543215', 'coordinator',  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'en', 0,   now() - interval '90 days'),
  ('10000000-0000-0000-0000-000000000007', '77777777-7777-7777-7777-777777777777', 'Lakshmi Iyer',     '9876543216', 'coordinator',  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'en', 0,   now() - interval '90 days'),
  -- Drivers (3)
  ('10000000-0000-0000-0000-000000000008', '88888888-8888-8888-8888-888888888888', 'Ravi Singh',       '9876543217', 'driver',       NULL, 'hi', 0, now() - interval '90 days'),
  ('10000000-0000-0000-0000-000000000009', '99999999-9999-9999-9999-999999999999', 'Mohammed Irfan',   '9876543218', 'driver',       NULL, 'hi', 0, now() - interval '90 days'),
  ('10000000-0000-0000-0000-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Venkatesh R',      '9876543219', 'driver',       NULL, 'en', 0, now() - interval '90 days'),
  -- Owners (3)
  ('10000000-0000-0000-0000-000000000011', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Srinivas Reddy',   '9876543220', 'owner',        NULL, 'en', 0, now() - interval '90 days'),
  ('10000000-0000-0000-0000-000000000012', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Vijay Enterprises','9876543221', 'owner',        NULL, 'en', 0, now() - interval '90 days'),
  ('10000000-0000-0000-0000-000000000013', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Karnataka Water Co','9876543222', 'owner',       NULL, 'en', 0, now() - interval '90 days')
ON CONFLICT (id) DO NOTHING;


-- TANKERS (8 tankers with varied specs)

INSERT INTO tankers (id, owner_id, driver_id, operator_name, vehicle_number, capacity_liters, price_per_liter, is_certified, is_available, current_lat, current_lng, rating, total_deliveries, created_at) VALUES
  -- Owner 1 (Srinivas Reddy) — 3 tankers
  ('f0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000008', 'Srinivas Water Supply',   'KA-01-AB-1234', 5000, 4.50, true,  true, 12.9200, 77.6400, 4.7, 142, now() - interval '85 days'),
  ('f0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000008', 'Srinivas Water Supply',   'KA-01-AB-5678', 3000, 4.00, true,  true, 12.9300, 77.6300, 4.5, 98,  now() - interval '80 days'),
  ('f0000003-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000009', 'Srinivas Water Supply',   'KA-01-CD-9012', 8000, 5.25, true,  true, 12.9400, 77.6500, 4.3, 67,  now() - interval '75 days'),
  -- Owner 2 (Vijay Enterprises) — 3 tankers
  ('f0000004-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000009', 'Vijay Water Tankers',     'KA-02-EF-3456', 6000, 5.00, true,  true, 12.9600, 77.7000, 4.8, 203, now() - interval '85 days'),
  ('f0000005-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000010', 'Vijay Water Tankers',     'KA-02-GH-7890', 2000, 3.75, false, true, 12.9700, 77.7200, 4.2, 45,  now() - interval '70 days'),
  ('f0000006-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000010', 'Vijay Water Tankers',     'KA-02-IJ-1234', 10000, 6.00, true,  true, 12.9800, 77.7400, 4.9, 312, now() - interval '90 days'),
  -- Owner 3 (Karnataka Water Co) — 2 tankers
  ('f0000007-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000010', 'Karnataka Water Supply',  'KA-03-KL-5678', 5000, 4.25, true,  true, 12.9500, 77.5600, 4.6, 178, now() - interval '80 days'),
  ('f0000008-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000008', 'Karnataka Water Supply',  'KA-03-MN-9012', 3000, 3.50, false, false, 12.9100, 77.5300, 3.8, 23,  now() - interval '60 days')
ON CONFLICT (id) DO NOTHING;


-- BOOKINGS (15 bookings, mix of statuses and types)

INSERT INTO bookings (id, type, status, tanker_id, coordinator_id, ward_id, resident_id, volume_ordered, volume_delivered, price_per_liter, total_amount, delivery_address, delivery_lat, delivery_lng, scheduled_at, delivered_at, anomaly_flagged, anomaly_reason, cv_confirmed, created_at) VALUES
  -- Delivered bookings (5)
  ('b0000001-0000-0000-0000-000000000001', 'individual', 'delivered',   'f0000001-0000-0000-0000-000000000001', NULL, 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '10000000-0000-0000-0000-000000000001', 2000, 2000, 4.50, 9000, '42, 1st Cross, Koramangala', 12.9350, 77.6240, now() - interval '25 days', now() - interval '24 days', false, NULL, true, now() - interval '25 days'),
  ('b0000002-0000-0000-0000-000000000002', 'community',  'delivered',   'f0000004-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '10000000-0000-0000-0000-000000000006', 5000, 4800, 5.00, 25000, 'Community Hall, Koramangala 5th Block', 12.9360, 77.6250, now() - interval '20 days', now() - interval '19 days', false, NULL, true, now() - interval '20 days'),
  ('b0000003-0000-0000-0000-000000000003', 'individual', 'delivered',   'f0000007-0000-0000-0000-000000000007', NULL, 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', '10000000-0000-0000-0000-000000000005', 3000, 2950, 4.25, 12750, '15, Banashankari 2nd Stage', 12.9240, 77.5480, now() - interval '18 days', now() - interval '17 days', false, NULL, true, now() - interval '18 days'),
  ('b0000004-0000-0000-0000-000000000004', 'individual', 'disputed',    'f0000005-0000-0000-0000-000000000005', NULL, 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '10000000-0000-0000-0000-000000000004', 2000, 1500, 3.75, 7500, '88, Whitefield Main Road', 12.9700, 77.7500, now() - interval '15 days', now() - interval '14 days', true, 'Volume discrepancy: only 1500L delivered against 2000L order. Possible short delivery.', false, now() - interval '15 days'),
  ('b0000005-0000-0000-0000-000000000005', 'individual', 'delivered',   'f0000003-0000-0000-0000-000000000003', NULL, 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', '10000000-0000-0000-0000-000000000005', 5000, 5000, 5.25, 26250, '23, Yelahanka New Town', 13.1010, 77.5960, now() - interval '12 days', now() - interval '11 days', false, NULL, true, now() - interval '12 days'),
  -- Dispatched bookings (3)
  ('b0000006-0000-0000-0000-000000000006', 'individual', 'dispatched',  'f0000002-0000-0000-0000-000000000002', NULL, 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '10000000-0000-0000-0000-000000000002', 3000, NULL, 4.00, 12000, '67, 2nd Main, Koramangala', 12.9340, 77.6230, now() + interval '1 day', NULL, false, NULL, NULL, now() - interval '1 day'),
  ('b0000007-0000-0000-0000-000000000007', 'community',  'dispatched',  'f0000006-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000007', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '10000000-0000-0000-0000-000000000007', 8000, NULL, 6.00, 48000, 'HSR Layout Sector 3 Community Center', 12.9120, 77.6390, now() + interval '2 days', NULL, false, NULL, NULL, now() - interval '2 days'),
  ('b0000008-0000-0000-0000-000000000008', 'individual', 'dispatched',  'f0000001-0000-0000-0000-000000000001', NULL, 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '10000000-0000-0000-0000-000000000003', 2500, NULL, 4.50, 11250, '34, HSR Layout Sector 2', 12.9110, 77.6380, now() + interval '1 day', NULL, false, NULL, NULL, now() - interval '1 day'),
  -- Confirmed bookings (3)
  ('b0000009-0000-0000-0000-000000000009', 'individual', 'confirmed',   'f0000007-0000-0000-0000-000000000007', NULL, 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', '10000000-0000-0000-0000-000000000005', 2000, NULL, 4.25, 8500, '45, Banashankari 1st Stage', 12.9230, 77.5470, now() + interval '3 days', NULL, false, NULL, NULL, now() - interval '3 days'),
  ('b0000010-0000-0000-0000-000000000010', 'individual', 'confirmed',   'f0000004-0000-0000-0000-000000000004', NULL, 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '10000000-0000-0000-0000-000000000004', 3000, NULL, 5.00, 15000, '12, Whitefield ITPL Road', 12.9690, 77.7490, now() + interval '2 days', NULL, false, NULL, NULL, now() - interval '3 days'),
  ('b0000011-0000-0000-0000-000000000011', 'community',  'confirmed',   'f0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '10000000-0000-0000-0000-000000000006', 4000, NULL, 4.50, 18000, 'Community Hall, Koramangala 5th Block', 12.9360, 77.6250, now() + interval '4 days', NULL, false, NULL, NULL, now() - interval '2 days'),
  -- Open (community, waiting for participants) (2)
  ('b0000012-0000-0000-0000-000000000012', 'community',  'open',         NULL,               '10000000-0000-0000-0000-000000000007', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '10000000-0000-0000-0000-000000000007', 6000, NULL, 4.50, 27000, 'HSR Layout BDA Complex', 12.9118, 77.6385, now() + interval '5 days', NULL, false, NULL, NULL, now() - interval '1 day'),
  ('b0000013-0000-0000-0000-000000000013', 'individual', 'open',         NULL,               NULL, 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', '10000000-0000-0000-0000-000000000005', 3000, NULL, 4.00, 12000, '78, Yelahanka 1st Stage', 13.1005, 77.5965, now() + interval '6 days', NULL, false, NULL, NULL, now() - interval '1 day'),
  -- Old bookings (for nudge triggers, 6-7 days ago) (2)
  ('b0000014-0000-0000-0000-000000000014', 'individual', 'delivered',   'f0000002-0000-0000-0000-000000000002', NULL, 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '10000000-0000-0000-0000-000000000002', 2500, 2500, 4.00, 10000, '67, 2nd Main, Koramangala', 12.9340, 77.6230, now() - interval '7 days', now() - interval '6 days', false, NULL, true, now() - interval '7 days'),
  ('b0000015-0000-0000-0000-000000000015', 'individual', 'delivered',   'f0000007-0000-0000-0000-000000000007', NULL, 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', '10000000-0000-0000-0000-000000000005', 1500, 1500, 4.25, 6375, '15, Banashankari 2nd Stage', 12.9240, 77.5480, now() - interval '6 days', now() - interval '5 days', false, NULL, true, now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;


-- BOOKING PARTICIPANTS (for community bookings)

INSERT INTO booking_participants (id, booking_id, user_id, share_liters, share_amount, payment_status, payment_method, joined_at) VALUES
  -- Booking 2 (community, delivered)
  ('p0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 1500, 7500, 'paid', 'upi', now() - interval '20 days'),
  ('p0000002-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1500, 7500, 'paid', 'upi', now() - interval '20 days'),
  ('p0000003-0000-0000-0000-000000000003', 'b0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1000, 5000, 'paid', 'cash', now() - interval '20 days'),
  -- Booking 7 (community, dispatched)
  ('p0000004-0000-0000-0000-000000000004', 'b0000007-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 2000, 12000, 'paid', 'upi', now() - interval '2 days'),
  ('p0000005-0000-0000-0000-000000000005', 'b0000007-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 1500, 9000, 'paid', 'upi', now() - interval '2 days'),
  ('p0000006-0000-0000-0000-000000000006', 'b0000007-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 2000, 12000, 'pending', NULL, now() - interval '2 days'),
  -- Booking 11 (community, confirmed)
  ('p0000007-0000-0000-0000-000000000007', 'b0000011-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000006', 1000, 4500, 'paid', 'upi', now() - interval '2 days'),
  ('p0000008-0000-0000-0000-000000000008', 'b0000011-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 1500, 6750, 'paid', 'cash', now() - interval '2 days'),
  ('p0000009-0000-0000-0000-000000000009', 'b0000011-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 1000, 4500, 'pending', NULL, now() - interval '2 days'),
  ('p0000010-0000-0000-0000-000000000010', 'b0000011-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005', 500, 2250, 'paid', 'points', now() - interval '2 days'),
  -- Booking 12 (community, open)
  ('p0000011-0000-0000-0000-000000000011', 'b0000012-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000007', 2000, 9000, 'pending', NULL, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;


-- HEATWAVE ALERTS (3 active alerts, different severity)

INSERT INTO heatwave_alerts (id, district, state, temperature, feels_like, severity, ai_advisory, active, created_at, expires_at) VALUES
  ('h0000001-0000-0000-0000-000000000001', 'Bengaluru South', 'Karnataka', 41.2, 44.5, 'warning',
   'Bengaluru South mein heatwave warning hai. 12 PM se 4 PM tak ghar mein rahein. Paani peete rahein. Bacchon aur buzurgon ka khayal rakhein.',
   true, now() - interval '3 days', now() + interval '4 days'),
  ('h0000002-0000-0000-0000-000000000002', 'Bengaluru East',  'Karnataka', 43.8, 47.0, 'emergency',
   'Bengaluru East mein atyadhik garmi ka emergency. Turant paani arrange karein. Bahar bilkul na nikle. ORS piyein.',
   true, now() - interval '2 days', now() + interval '5 days'),
  ('h0000003-0000-0000-0000-000000000003', 'Bengaluru North', 'Karnataka', 39.5, 42.0, 'watch',
   'Bengaluru North mein garmi ki nigrani jaari hai. Paani piyein aur dhoop se bachein. JalSetu se paani book karein agar zarurat ho.',
   true, now() - interval '1 day', now() + interval '6 days')
ON CONFLICT (id) DO NOTHING;


-- NUDGE LOGS (5 nudge entries)

INSERT INTO nudge_log (id, user_id, type, message, read, created_at) VALUES
  ('n0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'predictive',
   'Hi Priya! Aapka last order 7 din pehle tha. Garmi badh rahi hai — paani ka stock rakhein. JalSetu se abhi book karein!',
   false, now() - interval '1 day'),
  ('n0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'heatwave',
   'Rajesh ji, Bengaluru South mein heatwave warning hai. Paani ki zarurat badh sakti hai. Community booking mein join karein!',
   false, now() - interval '2 days'),
  ('n0000003-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'predictive',
   'Hi Suresh! Whitefield mein paani ki demand zyada hai. Early book karein toh best price milega.',
   true, now() - interval '3 days'),
  ('n0000004-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 'coordinator',
   'Meena ji, Yelahanka mein naya tanker available hai ₹3.50/L. Limited slots — jaldi book karein!',
   true, now() - interval '4 days'),
  ('n0000005-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'heatwave',
   'Anita, HSR Layout mein paani ki demand badh rahi hai. Community booking se 20% bachat karein!',
   false, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;


-- ANOMALY LOGS (3 anomaly entries)

INSERT INTO anomaly_logs (id, booking_id, tanker_id, ward_id, district_avg_price, charged_price, percent_above, ai_reason, resolved, created_at) VALUES
  ('a000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004', 'f0000005-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
   4.50, 3.75, -16.7, 'Price is below district average. Possible data entry error or promotional pricing. No price gouging detected.', false, now() - interval '15 days'),
  ('a000002-0000-0000-0000-000000000002', 'b0000004-0000-0000-0000-000000000004', 'f0000005-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
   4.50, 3.75, -16.7, 'Volume discrepancy detected: 1500L delivered vs 2000L ordered. 25% short delivery. Tanker capacity is 2000L — possible incomplete fill.', true, now() - interval '14 days'),
  ('a000003-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   4.75, 4.50, -5.3, 'Price slightly below average. No anomaly detected. Tanker has good rating and delivery history.', false, now() - interval '25 days')
ON CONFLICT (id) DO NOTHING;

-- REVIEWS (5 reviews)

INSERT INTO reviews (id, booking_id, user_id, tanker_id, rating, comment, created_at) VALUES
  ('r0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001',
   5, 'Bahut acha tanker! Samay pe aaya aur paani saaf tha. Highly recommend.', now() - interval '23 days'),
  ('r0000002-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'f0000004-0000-0000-0000-000000000004',
   4, 'Good service for community booking. 200L less than ordered but driver adjusted quickly.', now() - interval '18 days'),
  ('r0000003-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'f0000007-0000-0000-0000-000000000007',
   5, 'Excellent service! Affordable price and delivered on time. Water was clean.', now() - interval '16 days'),
  ('r0000004-0000-0000-0000-000000000004', 'b0000005-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'f0000003-0000-0000-0000-000000000003',
   4, 'Price thoda zyada tha but capacity badi thi. Overall acha experience.', now() - interval '10 days'),
  ('r0000005-0000-0000-0000-000000000005', 'b0000014-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', 'f0000002-0000-0000-0000-000000000002',
   5, 'Quick delivery and very polite driver. Will book again!', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;


-- PAYMENTS (linked to bookings)

INSERT INTO payments (id, booking_id, user_id, amount, method, status, created_at) VALUES
  ('pay00001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 9000, 'upi', 'success', now() - interval '25 days'),
  ('pay00002-0000-0000-0000-000000000002', 'b0000003-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 12750, 'cash', 'success', now() - interval '18 days'),
  ('pay00003-0000-0000-0000-000000000003', 'b0000004-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 7500, 'upi', 'success', now() - interval '15 days'),
  ('pay00004-0000-0000-0000-000000000004', 'b0000005-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 26250, 'upi', 'success', now() - interval '12 days'),
  ('pay00005-0000-0000-0000-000000000005', 'b0000006-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 12000, 'upi', 'success', now() - interval '1 day'),
  ('pay00006-0000-0000-0000-000000000006', 'b0000014-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', 10000, 'upi', 'success', now() - interval '7 days'),
  ('pay00007-0000-0000-0000-000000000007', 'b0000015-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000005', 6375, 'cash', 'success', now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;
