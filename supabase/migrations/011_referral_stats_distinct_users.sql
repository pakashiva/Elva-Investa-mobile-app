-- Fix Total Referrals to count distinct referred users, not reward rows

CREATE OR REPLACE FUNCTION public.get_my_referral_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total_referrals BIGINT;
  v_total_earnings NUMERIC(15, 2);
  v_pending_earnings NUMERIC(15, 2);
  v_referral_rate NUMERIC(8, 6);
  v_tds_rate NUMERIC(8, 6);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM public.ensure_user_referral_code(v_user_id);

  SELECT referral_rate, tds_rate
  INTO v_referral_rate, v_tds_rate
  FROM public.referral_settings
  WHERE id = 1;

  SELECT COUNT(DISTINCT referred_user_id)::BIGINT
  INTO v_total_referrals
  FROM public.referral_rewards
  WHERE referrer_user_id = v_user_id;

  SELECT COALESCE(SUM(net_bonus), 0)
  INTO v_total_earnings
  FROM public.referral_rewards
  WHERE referrer_user_id = v_user_id;

  SELECT COALESCE(
    SUM(
      round(
        i.fund_amount * v_referral_rate * (1 - v_tds_rate),
        2
      )
    ),
    0
  )
  INTO v_pending_earnings
  FROM public.investments i
  WHERE i.referrer_user_id = v_user_id
    AND i.status = 'Pending'
    AND NOT EXISTS (
      SELECT 1
      FROM public.referral_rewards rr
      WHERE rr.investment_id = i.id
    );

  RETURN json_build_object(
    'total_referrals', v_total_referrals,
    'total_earnings', v_total_earnings,
    'pending_earnings', v_pending_earnings,
    'referral_rate', v_referral_rate,
    'tds_rate', v_tds_rate
  );
END;
$$;
