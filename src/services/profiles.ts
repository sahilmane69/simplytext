import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  name: string;
  phone: string | null;
};

type SaveProfileInput = {
  name: string;
  phone?: string | null;
  userId: string;
};

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,phone')
    .eq('id', userId)
    .maybeSingle<Profile>();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveProfile({ name, phone, userId }: SaveProfileInput) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        name: name.trim(),
        phone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id,name,phone')
    .single<Profile>();

  if (error) {
    throw error;
  }

  return data;
}
