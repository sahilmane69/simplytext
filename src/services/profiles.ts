import { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const PROFILE_PHOTOS_BUCKET = 'avatars';

export type Profile = {
  avatar_url: string | null;
  id: string;
  name: string;
};

type SaveProfileInput = {
  image: ImagePickerAsset | null;
  name: string;
  userId: string;
};

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,avatar_url')
    .eq('id', userId)
    .maybeSingle<Profile>();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveProfile({ image, name, userId }: SaveProfileInput) {
  const avatarUrl = image ? await uploadProfilePhoto(userId, image) : null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        avatar_url: avatarUrl,
        id: userId,
        name: name.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id,name,avatar_url')
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
