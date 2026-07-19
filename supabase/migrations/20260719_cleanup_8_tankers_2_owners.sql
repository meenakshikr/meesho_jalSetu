-- Clean up: 8 tankers, 2 owners
-- owner@test.com (Mohan Singh): 5 tankers (already assigned)
-- owner2@test.com: 3 tankers (reassigned from old owners)

-- ============================================================
-- STEP 1: Create owner2 profile (no auth_id yet — user will create auth)
-- ============================================================
INSERT INTO users (id, name, phone, role, language, subsidy_points, created_at)
VALUES (
  'b0000001-0000-0000-0000-000000000001',
  'Rajesh Kumar',
  '9876543211',
  'owner',
  'en',
  0,
  now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 2: Reassign 3 tankers to owner2
-- Keep: d1000001 (Balaji), d1000004 (Shri Shyam), d1000007 (Veer Teja)
-- ============================================================
UPDATE tankers SET owner_id = 'b0000001-0000-0000-0000-000000000001'
WHERE id IN (
  'd1000001-0000-0000-0000-000000000001',
  'd1000004-0000-0000-0000-000000000004',
  'd1000007-0000-0000-0000-000000000007'
);

-- ============================================================
-- STEP 3: Delete child records for 4 tankers being removed
-- ============================================================
-- Delete anomaly_logs first (references tanker_id and booking_id)
DELETE FROM anomaly_logs WHERE tanker_id IN (
  'd1000002-0000-0000-0000-000000000002',
  'd1000003-0000-0000-0000-000000000003',
  'd1000005-0000-0000-0000-000000000005',
  'd1000006-0000-0000-0000-000000000006'
);

-- Delete reviews
DELETE FROM reviews WHERE tanker_id IN (
  'd1000002-0000-0000-0000-000000000002',
  'd1000003-0000-0000-0000-000000000003',
  'd1000005-0000-0000-0000-000000000005',
  'd1000006-0000-0000-0000-000000000006'
);

-- Delete payments for bookings on these tankers
DELETE FROM payments WHERE booking_id IN (
  SELECT id FROM bookings WHERE tanker_id IN (
    'd1000002-0000-0000-0000-000000000002',
    'd1000003-0000-0000-0000-000000000003',
    'd1000005-0000-0000-0000-000000000005',
    'd1000006-0000-0000-0000-000000000006'
  )
);

-- Delete receipts
DELETE FROM receipts WHERE tanker_id IN (
  'd1000002-0000-0000-0000-000000000002',
  'd1000003-0000-0000-0000-000000000003',
  'd1000005-0000-0000-0000-000000000005',
  'd1000006-0000-0000-0000-000000000006'
);

-- Delete booking_participants for bookings on these tankers
DELETE FROM booking_participants WHERE booking_id IN (
  SELECT id FROM bookings WHERE tanker_id IN (
    'd1000002-0000-0000-0000-000000000002',
    'd1000003-0000-0000-0000-000000000003',
    'd1000005-0000-0000-0000-000000000005',
    'd1000006-0000-0000-0000-000000000006'
  )
);

-- Delete bookings themselves
DELETE FROM bookings WHERE tanker_id IN (
  'd1000002-0000-0000-0000-000000000002',
  'd1000003-0000-0000-0000-000000000003',
  'd1000005-0000-0000-0000-000000000005',
  'd1000006-0000-0000-0000-000000000006'
);

-- ============================================================
-- STEP 4: Delete the 4 tankers
-- ============================================================
DELETE FROM tankers WHERE id IN (
  'd1000002-0000-0000-0000-000000000002',
  'd1000003-0000-0000-0000-000000000003',
  'd1000005-0000-0000-0000-000000000005',
  'd1000006-0000-0000-0000-000000000006'
);

-- ============================================================
-- STEP 5: Delete old owner profiles (no auth, not needed anymore)
-- ============================================================
DELETE FROM users WHERE id IN (
  'a4000001-0000-0000-0000-000000000001',
  'a4000002-0000-0000-0000-000000000002',
  'a4000003-0000-0000-0000-000000000003',
  'a4000004-0000-0000-0000-000000000004'
);

-- ============================================================
-- STEP 6: Also clean up orphaned nudge_log for deleted users
-- ============================================================
DELETE FROM nudge_log WHERE user_id IN (
  'a4000001-0000-0000-0000-000000000001',
  'a4000002-0000-0000-0000-000000000002',
  'a4000003-0000-0000-0000-000000000003',
  'a4000004-0000-0000-0000-000000000004'
);
