-- Add owner_id to users so drivers can be linked to an owner
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- Link driver2 to owner2
UPDATE users SET owner_id = '7036591c-4071-4980-a4bd-6314be78738f' WHERE id = '4ab49f45-1705-4ca1-b7c6-274faf7e1935';

-- Link existing driver to owner (owner@test.com)
UPDATE users SET owner_id = 'a4e94f56-0375-4e1f-84d1-d24327bec6d0' WHERE id = '410fda8e-db12-4e2b-bcdc-9887d0f98852';
