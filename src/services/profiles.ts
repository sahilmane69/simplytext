import { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const PROFILE_PHOTOS_BUCKET = 'avatars';

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
    .select('id,name,username,bio,avatar_url,phone,last_seen_at,show_last_seen,show_online_status,show_typing_indicator')
    .eq('id', userId)
    .maybeSingle<Profile>();

  if (error) {
    throw error;
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
  const avatarUrl = image ? await uploadProfilePhoto(userId, image) : currentAvatarUrl ?? null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        avatar_url: avatarUrl,
        bio: bio?.trim() || null,
        id: userId,
        name: trimmedUsername,
        phone,
        show_last_seen: privacy?.show_last_seen ?? true,
        show_online_status: privacy?.show_online_status ?? true,
        show_typing_indicator: privacy?.show_typing_indicator ?? true,
        username: trimmedUsername,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id,name,username,bio,avatar_url,phone,last_seen_at,show_last_seen,show_online_status,show_typing_indicator')
    .single<Profile>();

  if (error) {
    throw error;
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
    throw error;
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
    .select('id,name,username,bio,avatar_url,phone,last_seen_at,show_last_seen,show_online_status,show_typing_indicator')
    .single<Profile>();

  if (error) {
    throw error;
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
  const arrayBuffer = await response.arrayBuffer();
  const contentType = image.mimeType ?? 'image/jpeg';
  const extension = getImageExtension(image.fileName, contentType);
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
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
