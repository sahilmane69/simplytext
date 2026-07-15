import { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const PROFILE_PHOTOS_BUCKET = 'avatars';
const PROFILE_SELECT = 'id,name,username,bio,avatar_url,phone,last_seen_at,show_last_seen,show_online_status,show_typing_indicator';

export type Profile = {
  avatar_url: string | null;
  bio: string | null;
  id: string;
  last_seen_at: string | null;
  name: string;
  phone: string | null;
  show_last_seen: boolean;
  show_online_status: boolean;
  show_typing_indicator: boolean;
  username: string;
};

type SaveProfileInput = {
  bio?: string;
  currentAvatarUrl?: string | null;
  image: ImagePickerAsset | null;
  phone?: string | null;
  privacy?: Partial<Pick<Profile, 'show_last_seen' | 'show_online_status' | 'show_typing_indicator'>>;
  username: string;
  userId: string;
};

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle<Profile>();

  if (error) {
    throwSupabaseError(error, 'Unable to load profile');
  }

  return data;
}

export async function saveProfile({
  bio,
  currentAvatarUrl,
  image,
  phone,
  privacy,
  username,
  userId,
}: SaveProfileInput) {
  const trimmedUsername = username.trim();
  const trimmedBio = bio?.trim() || null;
  const normalizedPhone = phone?.trim() || null;

  if (!trimmedUsername) {
    throw new Error('Enter your username');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throwSupabaseError(userError, 'Unable to verify signed in user');
  }

  if (!user || user.id !== userId) {
    throw new Error('Sign in again to save your profile');
  }

  const avatarUrl = image ? await uploadProfilePhoto(userId, image) : currentAvatarUrl ?? null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        avatar_url: avatarUrl,
        bio: trimmedBio,
        id: userId,
        name: trimmedUsername,
        phone: normalizedPhone,
        show_last_seen: privacy?.show_last_seen ?? true,
        show_online_status: privacy?.show_online_status ?? true,
        show_typing_indicator: privacy?.show_typing_indicator ?? true,
        username: trimmedUsername,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select(PROFILE_SELECT)
    .single<Profile>();

  if (error) {
    throwSupabaseError(error, 'Unable to save profile');
  }

  return data;
}

export async function updateLastSeen(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throwSupabaseError(error, 'Unable to update last seen');
  }
}

export async function updatePresencePrivacy(
  userId: string,
  settings: Pick<Profile, 'show_last_seen' | 'show_online_status' | 'show_typing_indicator'>,
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select(PROFILE_SELECT)
    .single<Profile>();

  if (error) {
    throwSupabaseError(error, 'Unable to update privacy settings');
  }

  return data;
}

export function subscribeToProfile(userId: string, onProfile: (profile: Profile) => void) {
  return supabase
    .channel(`profile:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        filter: `id=eq.${userId}`,
        schema: 'public',
        table: 'profiles',
      },
      (payload) => onProfile(payload.new as Profile),
    )
    .subscribe();
}

async function uploadProfilePhoto(userId: string, image: ImagePickerAsset) {
  const response = await fetch(image.uri);

  if (!response.ok) {
    throw new Error('Unable to read selected profile photo');
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = image.mimeType ?? 'image/jpeg';
  const extension = getImageExtension(image.fileName, contentType);
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throwSupabaseError(error, 'Unable to upload profile photo');
  }

  const { data } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

function getImageExtension(fileName: string | null | undefined, contentType: string) {
  const fileExtension = fileName?.split('.').pop()?.toLowerCase();

  if (fileExtension) {
    return fileExtension;
  }

  if (contentType === 'image/png') {
    return 'png';
  }

  if (contentType === 'image/webp') {
    return 'webp';
  }

  return 'jpg';
}

function throwSupabaseError(error: unknown, fallbackMessage: string): never {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    throw new Error(error.message);
  }

  throw new Error(fallbackMessage);
}
