-- SQL Function to delete a user and all their data
-- Run this in Supabase Dashboard → SQL Editor

-- Create the function to delete user and all related data
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Delete user data from related tables (in order to respect foreign key constraints)
    
    -- 1. Delete items first (they reference receipts)
    DELETE FROM items 
    WHERE receipt_id IN (
        SELECT id FROM receipts WHERE user_id = current_user_id
    );
    
    -- 2. Delete receipts
    DELETE FROM receipts WHERE user_id = current_user_id;
    
    -- 3. Delete budgets
    DELETE FROM budgets WHERE user_id = current_user_id;
    
    -- 4. Delete profile
    DELETE FROM profiles WHERE user_id = current_user_id;
    
    -- 5. Delete user from auth.users (this will cascade to other auth tables)
    DELETE FROM auth.users WHERE id = current_user_id;
    
    -- Log the deletion for audit purposes
    RAISE LOG 'User % and all their data have been successfully deleted', current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- Optional: Create a function that returns user data before deletion for confirmation
CREATE OR REPLACE FUNCTION get_user_data_summary(user_id UUID)
RETURNS TABLE(
    receipts_count INTEGER,
    budgets_count INTEGER,
    profile_exists BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
    SELECT 
        COALESCE((SELECT COUNT(*) FROM receipts WHERE user_id = $1), 0),
        COALESCE((SELECT COUNT(*) FROM budgets WHERE user_id = $1), 0),
        EXISTS(SELECT 1 FROM profiles WHERE user_id = $1)
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_data_summary(UUID) TO authenticated;
