import * as Contacts from 'expo-contacts';
import { supabase } from '../lib/supabase';
import { Profile } from './profiles';

export type DeviceContact = {
  id: string;
  name: string;
  phoneNumbers: string[];
};

export type MatchedContact = DeviceContact & {
  profile: Profile | null;
};

type RegisteredProfile = Profile & {
  normalizedPhones: Set<string>;
};

const CONTACT_FIELDS = [Contacts.ContactField.FULL_NAME, Contacts.ContactField.PHONES] as const;

export async function requestContactsPermission() {
  const currentPermission = await Contacts.getPermissionsAsync();

  if (currentPermission.granted) {
    return true;
  }

  const nextPermission = await Contacts.requestPermissionsAsync();

  return nextPermission.granted;
}

export async function getDeviceContacts() {
  const contacts = await Contacts.Contact.getAllDetails(CONTACT_FIELDS);

  return contacts
    .map((contact, index): DeviceContact | null => {
      const phoneNumbers = (contact.phones ?? [])
        .map((phone) => phone.number)
        .filter((phone): phone is string => Boolean(phone));

      if (phoneNumbers.length === 0) {
        return null;
      }

      return {
        id: String(contact.id ?? index),
        name: contact.fullName?.trim() || phoneNumbers[0],
        phoneNumbers,
      };
    })
    .filter((contact): contact is DeviceContact => Boolean(contact));
}

export async function getContactsWithRegistrationStatus() {
  const deviceContacts = await getDeviceContacts();
  const registeredProfiles = await getRegisteredProfiles();

  return deviceContacts.map((contact): MatchedContact => {
    const profile = contact.phoneNumbers
      .flatMap(getPhoneComparisons)
      .map((phone) => registeredProfiles.get(phone))
      .find((matchedProfile): matchedProfile is Profile => Boolean(matchedProfile));

    return {
      ...contact,
      profile: profile ?? null,
    };
  });
}

async function getRegisteredProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,username,bio,avatar_url,phone')
    .not('phone', 'is', null);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((profiles, profile) => {
    const registeredProfile: RegisteredProfile = {
      ...profile,
      normalizedPhones: new Set(getPhoneComparisons(profile.phone)),
    };

    registeredProfile.normalizedPhones.forEach((phone) => {
      profiles.set(phone, profile);
    });

    return profiles;
  }, new Map<string, Profile>());
}

function getPhoneComparisons(phone: string | null | undefined) {
  if (!phone) {
    return [];
  }

  const digits = phone.replace(/\D/g, '');
  const withPlus = phone.startsWith('+') ? `+${digits}` : '';
  const comparisons = [digits, withPlus, digits.slice(-10)].filter(Boolean);

  return [...new Set(comparisons)];
}
