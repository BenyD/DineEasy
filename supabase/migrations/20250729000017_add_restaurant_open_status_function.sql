-- Function to check if restaurant should be open based on opening hours and current time
CREATE OR REPLACE FUNCTION "public"."check_restaurant_open_status"("p_restaurant_id" "uuid")
RETURNS TABLE("is_open" boolean, "auto_managed" boolean, "current_time" timestamp with time zone, "next_open" timestamp with time zone, "next_close" timestamp with time zone)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_restaurant RECORD;
    v_current_time timestamp with time zone;
    v_current_day text;
    v_current_time_str text;
    v_opening_hours jsonb;
    v_today_hours jsonb;
    v_is_open boolean := false;
    v_next_open timestamp with time zone;
    v_next_close timestamp with time zone;
BEGIN
    -- Get current time in restaurant's timezone (default to UTC if not specified)
    v_current_time := NOW();
    v_current_day := LOWER(TO_CHAR(v_current_time, 'Day'));
    v_current_time_str := TO_CHAR(v_current_time, 'HH24:MI');
    
    -- Get restaurant data
    SELECT 
        r.auto_open_close,
        r.is_open,
        r.opening_hours,
        r.country
    INTO v_restaurant
    FROM restaurants r
    WHERE r.id = p_restaurant_id;
    
    -- If restaurant not found, return false
    IF v_restaurant IS NULL THEN
        RETURN QUERY SELECT false, false, v_current_time, NULL::timestamp with time zone, NULL::timestamp with time zone;
        RETURN;
    END IF;
    
    -- If auto_open_close is false, return manual status
    IF NOT v_restaurant.auto_open_close THEN
        RETURN QUERY SELECT v_restaurant.is_open, false, v_current_time, NULL::timestamp with time zone, NULL::timestamp with time zone;
        RETURN;
    END IF;
    
    -- Get opening hours
    v_opening_hours := v_restaurant.opening_hours;
    
    -- If no opening hours set, return false
    IF v_opening_hours IS NULL THEN
        RETURN QUERY SELECT false, true, v_current_time, NULL::timestamp with time zone, NULL::timestamp with time zone;
        RETURN;
    END IF;
    
    -- Get today's hours
    v_today_hours := v_opening_hours->v_current_day;
    
    -- If no hours set for today, return false
    IF v_today_hours IS NULL OR v_today_hours = 'null'::jsonb THEN
        RETURN QUERY SELECT false, true, v_current_time, NULL::timestamp with time zone, NULL::timestamp with time zone;
        RETURN;
    END IF;
    
    -- Check if current time is within opening hours
    v_is_open := v_current_time_str >= (v_today_hours->>'open')::text 
                 AND v_current_time_str < (v_today_hours->>'close')::text;
    
    -- Calculate next open/close times for reference
    v_next_open := v_current_time::date + (v_today_hours->>'open')::time;
    v_next_close := v_current_time::date + (v_today_hours->>'close')::time;
    
    -- Handle overnight hours (close time is before open time)
    IF (v_today_hours->>'close')::time < (v_today_hours->>'open')::time THEN
        IF v_current_time_str >= (v_today_hours->>'open')::text THEN
            -- After opening time, close is next day
            v_next_close := v_current_time::date + INTERVAL '1 day' + (v_today_hours->>'close')::time;
        ELSE
            -- Before opening time, open is today, close is next day
            v_next_open := v_current_time::date + (v_today_hours->>'open')::time;
            v_next_close := v_current_time::date + INTERVAL '1 day' + (v_today_hours->>'close')::time;
        END IF;
    END IF;
    
    RETURN QUERY SELECT v_is_open, true, v_current_time, v_next_open, v_next_close;
END;
$function$;

-- Add comment to the function
COMMENT ON FUNCTION "public"."check_restaurant_open_status"("p_restaurant_id" "uuid") IS 'Checks if a restaurant should be open based on auto_open_close setting and opening hours. Returns is_open status, whether it is auto-managed, current time, and next open/close times.'; 