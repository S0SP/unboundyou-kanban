-- Analytics RPC Functions

-- 1. Get Ticket Volume by Type
CREATE OR REPLACE FUNCTION get_ticket_volume_by_type()
RETURNS TABLE (ticket_type text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.ticket_type, COUNT(*) as count
  FROM tickets t
  GROUP BY t.ticket_type;
END;
$$;

-- Allow authenticated users to execute the function
GRANT EXECUTE ON FUNCTION get_ticket_volume_by_type TO authenticated;
