-- Grant permissions on the sequence to the authenticated role
GRANT USAGE, SELECT ON SEQUENCE "public"."order_number_sequence_2025" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE "public"."order_number_sequence_2025" TO anon;
GRANT USAGE, SELECT ON SEQUENCE "public"."order_number_sequence_2025" TO service_role;