import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const OTP_BASE_URL = 'https://api.notify.elvatech.in';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type OtpAction = 'send' | 'resend' | 'verify' | 'resetPassword';
type OtpMode = 'registration' | 'recovery';

type OtpRequestBody = {
  action?: OtpAction;
  mode?: OtpMode;
  otp?: string;
  email?: string;
  newPassword?: string;
};

type OtpProviderResponse = {
  success?: boolean;
  message?: string;
  expiresIn?: number;
  requestId?: string;
};

type ProfileRow = {
  user_id: string;
  mobile_number: string;
  email_address: string;
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizePhoneForOtp(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.startsWith('91')) {
    return digits;
  }

  return `91${digits}`;
}

function maskMobileNumber(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  const local = digits.startsWith('91') ? digits.slice(2) : digits;
  if (local.length < 5) {
    return mobile.trim() || '—';
  }
  return `+91 ${local.slice(0, 5)}XXXXX`;
}

async function callOtpProvider(
  path: 'send' | 'resend' | 'verify',
  phone: string,
  otp?: string
): Promise<OtpProviderResponse> {
  const appId = Deno.env.get('OTP_APP_ID') ?? 'eNandi';
  const apiKey = Deno.env.get('OTP_API_KEY');
  const brandId = Deno.env.get('OTP_BRAND_ID') ?? 'elva-sales';

  if (!apiKey) {
    throw new Error('OTP provider is not configured on the server.');
  }

  const payload: Record<string, string> = {
    appId,
    apiKey,
    brandId,
    phone,
  };

  if (path === 'verify') {
    if (!otp) {
      throw new Error('OTP is required.');
    }
    payload.otp = otp;
  }

  const response = await fetch(`${OTP_BASE_URL}/otp/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let body: OtpProviderResponse;
  try {
    body = (await response.json()) as OtpProviderResponse;
  } catch {
    throw new Error('Unexpected response from OTP provider.');
  }

  if (!response.ok) {
    return {
      success: false,
      message: body.message ?? `OTP provider request failed (${response.status}).`,
    };
  }

  return body;
}

async function getRecoveryProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id, mobile_number, email_address')
    .eq('email_address', email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProfileRow | null) ?? null;
}

async function getRegistrationProfile(
  supabaseUser: ReturnType<typeof createClient>,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabaseUser
    .from('profiles')
    .select('user_id, mobile_number, email_address')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProfileRow | null) ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json(
        { success: false, message: 'Server configuration is incomplete.' },
        500
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const body = (await req.json()) as OtpRequestBody;
    const action = body.action;
    const mode: OtpMode = body.mode === 'recovery' ? 'recovery' : 'registration';

    if (
      !action ||
      !['send', 'resend', 'verify', 'resetPassword'].includes(action)
    ) {
      return json({ success: false, message: 'Invalid OTP action.' }, 400);
    }

    let profile: ProfileRow | null = null;
    let phone = '';

    if (mode === 'recovery') {
      const email = body.email?.trim().toLowerCase();
      if (!email) {
        return json(
          { success: false, message: 'Registered email address is required.' },
          400
        );
      }

      profile = await getRecoveryProfile(supabaseAdmin, email);
      if (!profile?.mobile_number) {
        return json(
          {
            success: false,
            message: 'No account found for this email address.',
          },
          404
        );
      }
      phone = normalizePhoneForOtp(profile.mobile_number);
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return json({ success: false, message: 'Unauthorized' }, 401);
      }

      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      });

      const {
        data: { user },
        error: userError,
      } = await supabaseUser.auth.getUser();

      if (userError || !user) {
        return json({ success: false, message: 'Unauthorized' }, 401);
      }

      profile = await getRegistrationProfile(supabaseUser, user.id);
      if (!profile?.mobile_number) {
        return json(
          { success: false, message: 'Registered mobile number not found.' },
          400
        );
      }
      phone = normalizePhoneForOtp(profile.mobile_number);
    }

    if (action === 'resetPassword') {
      if (mode !== 'recovery' || !profile) {
        return json(
          { success: false, message: 'Password reset is only for recovery.' },
          400
        );
      }

      const otp = body.otp?.trim();
      const newPassword = body.newPassword?.trim();

      if (!otp || !/^\d{6}$/.test(otp)) {
        return json(
          { success: false, message: 'Please enter a valid 6-digit OTP.' },
          400
        );
      }

      if (!newPassword || newPassword.length < 8) {
        return json(
          {
            success: false,
            message: 'Password must be at least 8 characters.',
          },
          400
        );
      }

      const providerResult = await callOtpProvider('verify', phone, otp);
      if (!providerResult.success) {
        return json({
          success: false,
          message: providerResult.message ?? 'OTP verification failed.',
        });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.user_id,
        { password: newPassword }
      );

      if (updateError) {
        return json(
          {
            success: false,
            message: updateError.message ?? 'Failed to update password.',
          },
          500
        );
      }

      return json({
        success: true,
        message: 'Password updated successfully.',
      });
    }

    if (action === 'verify') {
      const otp = body.otp?.trim();
      if (!otp || !/^\d{6}$/.test(otp)) {
        return json(
          { success: false, message: 'Please enter a valid 6-digit OTP.' },
          400
        );
      }

      const providerResult = await callOtpProvider('verify', phone, otp);
      if (!providerResult.success) {
        return json({
          success: false,
          message: providerResult.message ?? 'OTP verification failed.',
        });
      }

      if (mode === 'registration' && profile) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            mobile_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', profile.user_id);

        if (updateError) {
          return json(
            {
              success: false,
              message: 'OTP verified but profile update failed. Please try again.',
            },
            500
          );
        }
      }

      return json({
        success: true,
        message:
          mode === 'recovery'
            ? providerResult.message ?? 'OTP verified successfully.'
            : providerResult.message ?? 'Mobile number verified successfully.',
      });
    }

    const providerResult = await callOtpProvider(action, phone);
    if (!providerResult.success) {
      return json({
        success: false,
        message: providerResult.message ?? `Failed to ${action} OTP.`,
      });
    }

    return json({
      success: true,
      message: providerResult.message ?? 'OTP sent successfully',
      expiresIn: providerResult.expiresIn ?? 300,
      requestId: providerResult.requestId,
      maskedPhone: maskMobileNumber(profile.mobile_number),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';
    return json({ success: false, message }, 500);
  }
});
