import { useCallback, useEffect, useState } from 'react';
import {
  getContactsWithRegistrationStatus,
  MatchedContact,
  requestContactsPermission,
} from '../services';

export function useContacts() {
  const [contacts, setContacts] = useState<MatchedContact[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const permissionGranted = await requestContactsPermission();
      setHasPermission(permissionGranted);

      if (!permissionGranted) {
        setContacts([]);
        return;
      }

      const nextContacts = await getContactsWithRegistrationStatus();
      setContacts(nextContacts);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    errorMessage,
    hasPermission,
    isLoading,
    loadContacts,
  };
}
