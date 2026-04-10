\set ON_ERROR_STOP on

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

WITH input AS (
    SELECT
        COALESCE(NULLIF(BTRIM(:'tenant_name'), ''), 'SmartF&B Trial Demo')::text AS tenant_name,
        NULLIF(BTRIM(:'tenant_slug'), '')::text AS tenant_slug,
        COALESCE(NULLIF(BTRIM(:'owner_name'), ''), 'Trial Owner')::text AS owner_name,
        LOWER(BTRIM(:'owner_email'))::text AS owner_email,
        :'owner_password'::text AS owner_password,
        NULLIF(BTRIM(:'owner_phone'), '')::text AS owner_phone,
        GREATEST(:'trial_days'::int, 1) AS trial_days
),
tenant_seed AS (
    SELECT
        gen_random_uuid() AS tenant_id,
        input.tenant_name,
        input.owner_name,
        input.owner_email,
        input.owner_password,
        input.owner_phone,
        input.trial_days,
        COALESCE(
            input.tenant_slug,
            CONCAT(
                COALESCE(
                    NULLIF(
                        TRIM(BOTH '-' FROM REGEXP_REPLACE(SPLIT_PART(input.owner_email, '@', 1), '[^a-z0-9]+', '-', 'g')),
                        ''
                    ),
                    'trial-tenant'
                ),
                '-',
                SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 6)
            )
        ) AS tenant_slug
    FROM input
),
trial_plan AS (
    INSERT INTO plans (
        id,
        name,
        slug,
        price_monthly,
        max_branches,
        features,
        is_active,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        'Trial',
        'trial',
        0,
        1,
        '{
            "POS": true,
            "MENU": true,
            "INVENTORY": false,
            "PROMOTION": false,
            "REPORT_BASIC": false,
            "REPORT_ADVANCED": false,
            "AI_INSIGHTS": false,
            "MULTI_BRANCH": false,
            "STAFF_MANAGEMENT": false,
            "TABLE_MAP": false
        }'::jsonb,
        TRUE,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        price_monthly = EXCLUDED.price_monthly,
        max_branches = EXCLUDED.max_branches,
        features = EXCLUDED.features,
        is_active = TRUE
    RETURNING id
),
existing_tenant AS (
    SELECT t.id
    FROM tenants t
    JOIN tenant_seed ts ON LOWER(t.email) = ts.owner_email
    LIMIT 1
),
inserted_tenant AS (
    INSERT INTO tenants (
        id,
        plan_id,
        name,
        slug,
        email,
        phone,
        status,
        plan_expires_at,
        created_at
    )
    SELECT
        ts.tenant_id,
        tp.id,
        ts.tenant_name,
        ts.tenant_slug,
        ts.owner_email,
        ts.owner_phone,
        'ACTIVE',
        CURRENT_TIMESTAMP + MAKE_INTERVAL(days => ts.trial_days),
        CURRENT_TIMESTAMP
    FROM tenant_seed ts
    CROSS JOIN trial_plan tp
    WHERE NOT EXISTS (SELECT 1 FROM existing_tenant)
    RETURNING id
),
updated_tenant AS (
    UPDATE tenants t
    SET plan_id = tp.id,
        name = ts.tenant_name,
        email = ts.owner_email,
        phone = ts.owner_phone,
        status = 'ACTIVE',
        plan_expires_at = CURRENT_TIMESTAMP + MAKE_INTERVAL(days => ts.trial_days)
    FROM tenant_seed ts
    CROSS JOIN trial_plan tp
    WHERE t.id = (SELECT id FROM existing_tenant)
    RETURNING t.id
),
tenant_ctx AS (
    SELECT id FROM inserted_tenant
    UNION ALL
    SELECT id FROM updated_tenant
),
existing_owner AS (
    SELECT u.id
    FROM users u
    JOIN tenant_ctx tc ON tc.id = u.tenant_id
    JOIN tenant_seed ts ON LOWER(u.email) = ts.owner_email
    LIMIT 1
),
inserted_owner AS (
    INSERT INTO users (
        id,
        tenant_id,
        full_name,
        email,
        phone,
        password_hash,
        status,
        failed_login_count,
        locked_until,
        created_at
    )
    SELECT
        gen_random_uuid(),
        tc.id,
        ts.owner_name,
        ts.owner_email,
        ts.owner_phone,
        crypt(ts.owner_password, gen_salt('bf', 12)),
        'ACTIVE',
        0,
        NULL,
        CURRENT_TIMESTAMP
    FROM tenant_ctx tc
    CROSS JOIN tenant_seed ts
    WHERE NOT EXISTS (SELECT 1 FROM existing_owner)
    RETURNING id
),
updated_owner AS (
    UPDATE users u
    SET full_name = ts.owner_name,
        phone = ts.owner_phone,
        password_hash = crypt(ts.owner_password, gen_salt('bf', 12)),
        status = 'ACTIVE',
        failed_login_count = 0,
        locked_until = NULL
    FROM tenant_seed ts
    JOIN tenant_ctx tc ON TRUE
    WHERE u.id = (SELECT id FROM existing_owner)
      AND u.tenant_id = tc.id
    RETURNING u.id
),
owner_ctx AS (
    SELECT id FROM inserted_owner
    UNION ALL
    SELECT id FROM updated_owner
),
owner_role AS (
    INSERT INTO roles (
        id,
        tenant_id,
        name,
        description,
        is_system
    )
    SELECT
        gen_random_uuid(),
        tc.id,
        'OWNER',
        'Chủ cửa hàng (Quản trị viên toàn quyền)',
        TRUE
    FROM tenant_ctx tc
    ON CONFLICT ON CONSTRAINT uq_role_name_tenant DO UPDATE
    SET description = EXCLUDED.description,
        is_system = TRUE
    RETURNING id
),
granted_role_permissions AS (
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT
        orl.id,
        p.id
    FROM owner_role orl
    CROSS JOIN permissions p
    ON CONFLICT DO NOTHING
    RETURNING permission_id
),
granted_owner_role AS (
    INSERT INTO user_roles (
        user_id,
        role_id,
        assigned_by,
        assigned_at
    )
    SELECT
        oc.id,
        orl.id,
        oc.id,
        CURRENT_TIMESTAMP
    FROM owner_ctx oc
    CROSS JOIN owner_role orl
    ON CONFLICT (user_id, role_id) DO UPDATE
    SET assigned_by = EXCLUDED.assigned_by,
        assigned_at = CURRENT_TIMESTAMP
    RETURNING user_id
),
expired_active_subscriptions AS (
    UPDATE subscriptions s
    SET status = 'EXPIRED',
        expires_at = COALESCE(s.expires_at, CURRENT_TIMESTAMP)
    FROM tenant_ctx tc
    WHERE s.tenant_id = tc.id
      AND s.status = 'ACTIVE'
    RETURNING s.id
),
inserted_subscription AS (
    INSERT INTO subscriptions (
        id,
        tenant_id,
        plan_id,
        status,
        started_at,
        expires_at,
        created_at
    )
    SELECT
        gen_random_uuid(),
        tc.id,
        tp.id,
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + MAKE_INTERVAL(days => ts.trial_days),
        CURRENT_TIMESTAMP
    FROM tenant_ctx tc
    CROSS JOIN trial_plan tp
    CROSS JOIN tenant_seed ts
    RETURNING id
)
SELECT
    tc.id AS tenant_id,
    oc.id AS owner_user_id,
    orl.id AS owner_role_id,
    ins.id AS subscription_id
FROM tenant_ctx tc
CROSS JOIN owner_ctx oc
CROSS JOIN owner_role orl
CROSS JOIN inserted_subscription ins;

COMMIT;

SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    u.id AS owner_user_id,
    u.full_name AS owner_name,
    u.email AS owner_email,
    p.slug AS plan_slug,
    s.status AS subscription_status,
    TO_CHAR(s.expires_at, 'YYYY-MM-DD HH24:MI:SS') AS subscription_expires_at,
    COALESCE((
        SELECT STRING_AGG(r.name, ', ' ORDER BY r.name)
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id
    ), '') AS roles
FROM tenants t
JOIN users u
    ON u.tenant_id = t.id
LEFT JOIN LATERAL (
    SELECT sub.plan_id, sub.status, sub.expires_at
    FROM subscriptions sub
    WHERE sub.tenant_id = t.id
      AND sub.status = 'ACTIVE'
    ORDER BY sub.created_at DESC NULLS LAST, sub.started_at DESC NULLS LAST
    LIMIT 1
) s ON TRUE
LEFT JOIN plans p ON p.id = s.plan_id
WHERE LOWER(t.email) = LOWER(:'owner_email')
  AND LOWER(u.email) = LOWER(:'owner_email')
LIMIT 1;
