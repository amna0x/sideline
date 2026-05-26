-- Zero out points_total for mohibk0004@gmail.com due to account inconsistency
BEGIN;
UPDATE users SET points_total = 0 WHERE lower(email) = 'mohibk0004@gmail.com';
-- Optional: also reset predictions/vault spending inconsistencies if needed
COMMIT;
