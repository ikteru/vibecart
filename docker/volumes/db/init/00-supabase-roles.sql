-- ============================================================
-- Supabase Roles and Extensions Setup
-- This script sets up the required roles for Supabase to work
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgjwt;

-- Create Supabase roles
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
CREATE ROLE supabase_auth_admin LOGIN PASSWORD 'postgres' NOINHERIT CREATEROLE CREATEDB;
CREATE ROLE supabase_storage_admin LOGIN PASSWORD 'postgres' NOINHERIT;
CREATE ROLE supabase_admin NOLOGIN NOINHERIT BYPASSRLS;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'postgres';

-- Grant roles
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_admin TO authenticator;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Create auth schema (required for Supabase Auth)
-- Note: GoTrue will manage the auth schema tables
CREATE SCHEMA IF NOT EXISTS auth;
ALTER SCHEMA auth OWNER TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO service_role;

-- Create storage schema
CREATE SCHEMA IF NOT EXISTS storage;
ALTER SCHEMA storage OWNER TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT USAGE ON SCHEMA storage TO service_role, authenticated, anon;

-- Create realtime schema
CREATE SCHEMA IF NOT EXISTS _realtime;
GRANT USAGE ON SCHEMA _realtime TO supabase_admin;
GRANT ALL ON ALL TABLES IN SCHEMA _realtime TO supabase_admin;
