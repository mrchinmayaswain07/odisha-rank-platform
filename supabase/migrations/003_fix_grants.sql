-- ==============================================================================
-- OdishaRank Permissions & Role Grants (Corrected)
-- Migration: 003_fix_grants.sql
-- ==============================================================================

-- 1. Ensure schema usage
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant table permissions to authenticated users & service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO postgres, authenticated, service_role;

-- 3. Grant SELECT to anonymous visitors (for viewing catalog)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO anon;

-- 4. Ensure future tables automatically inherit these permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON ROUTINES TO postgres, authenticated, service_role;
