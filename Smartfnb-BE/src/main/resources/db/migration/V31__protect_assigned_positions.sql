-- ==============================================================================
-- V31: Protect positions that are still assigned to staff
-- ==============================================================================

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_position_id_fkey;

ALTER TABLE users
    ADD CONSTRAINT users_position_id_fkey
    FOREIGN KEY (position_id)
    REFERENCES positions(id)
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_users_position_not_deleted
    ON users(position_id)
    WHERE position_id IS NOT NULL
      AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION prevent_assigned_position_deactivation()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF EXISTS (
            SELECT 1
            FROM users u
            WHERE u.position_id = OLD.id
              AND u.deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Cannot delete assigned position %', OLD.id
                USING ERRCODE = '23503';
        END IF;

        RETURN OLD;
    END IF;

    IF OLD.is_active = TRUE
       AND NEW.is_active = FALSE
       AND EXISTS (
            SELECT 1
            FROM users u
            WHERE u.position_id = OLD.id
              AND u.deleted_at IS NULL
       ) THEN
        RAISE EXCEPTION 'Cannot deactivate assigned position %', OLD.id
            USING ERRCODE = '23503';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_assigned_position_deactivation ON positions;

CREATE TRIGGER trg_prevent_assigned_position_deactivation
BEFORE UPDATE OF is_active OR DELETE ON positions
FOR EACH ROW
EXECUTE FUNCTION prevent_assigned_position_deactivation();
