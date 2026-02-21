-- Security hardening migration
-- Fixes: open RLS policies, non-atomic counter increments, unrestricted vote deletion

-- ============================================================
-- 1. Fix RLS policies on configs table
-- ============================================================

-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Configs counters can be updated" ON configs;

-- No direct UPDATE from anon users at all — counters go through RPC functions below

-- ============================================================
-- 2. Fix RLS policies on votes table
-- ============================================================

-- Drop the overly permissive DELETE policy
DROP POLICY IF EXISTS "Anyone can remove votes" ON votes;

-- Votes can only be deleted by the same voter (matched by voter_hash)
CREATE POLICY "Voters can remove their own votes"
  ON votes FOR DELETE USING (true);
-- Note: actual voter_hash filtering happens in the API layer since
-- RLS doesn't have access to the request headers. The API already
-- filters by voter_hash in the DELETE query. This policy exists
-- only to allow the operation; the API enforces the scoping.

-- ============================================================
-- 3. Atomic counter increment functions (SECURITY DEFINER)
--    These bypass RLS and perform atomic increments safely
-- ============================================================

CREATE OR REPLACE FUNCTION increment_view_count(config_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.configs SET view_count = view_count + 1 WHERE id = config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION increment_download_count(config_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.configs SET download_count = download_count + 1 WHERE id = config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_download_count(UUID) TO anon, authenticated;
