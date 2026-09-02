const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ??
        process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabasePublishableKey:
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      otpApiBaseUrl:
        process.env.EXPO_PUBLIC_OTP_API_BASE_URL ??
        'https://api.notify.elvatech.in',
      otpAppId: process.env.EXPO_PUBLIC_OTP_APP_ID ?? 'eNandi',
      otpApiKey: process.env.EXPO_PUBLIC_OTP_API_KEY,
      otpBrandId: process.env.EXPO_PUBLIC_OTP_BRAND_ID ?? 'elva-sales',
    },
  },
};
