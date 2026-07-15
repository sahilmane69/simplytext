import { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const PROFILE_PHOTOS_BUCKET = 'avatars';

export type Profile = {
  avatar_url: string | null;
  bio: string | null;
  id: string;
  name: string;
  phone: string | null;
  username: string;
};

type SaveProfileInput = {
  bio?: string;
  currentAvatarUrl?: string | null;
  image: ImagePickerAsset | null;
  phone?: string | null;
  username: string;
  userId: string;
};

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,username,bio,avatar_url,phone')
    .eq('id', userId)
    .maybeSingle<Profile>();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveProfile({ bio, currentAvatarUrl, image, phone, username, userId }: SaveProfileInput) {
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
        username: trimmedUsername,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id,name,username,bio,avatar_url,phone')
    .single<Profile>();

  if (error) {
    throw error;
  }

  return data;
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
