import { supabase } from '../lib/supabase';

export async function sendPhoneOtp(phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
    options: {
      channel: 'sms',
    },
  });

  if (error) {
    throw error;
  }
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  const normalizedToken = token.trim();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: normalizedToken,
    type: 'sms',
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

function normalizePhoneNumber(phone: string) {
  const normalizedPhone = phone.replace(/[^\d+]/g, '').trim();

  if (!normalizedPhone.startsWith('+') || normalizedPhone.length < 8) {
    throw new Error('Enter a valid phone number with country code');
  }

  return normalizedPhone;
}
