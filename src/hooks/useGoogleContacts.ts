import { useState, useEffect } from 'react';
import { getAccessToken } from '../firebase';
import { GoogleContact } from '../components/ContactsManager';

export function useGoogleContacts(user: any) {
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    loadContactsList();
    
    const handleTokenChange = () => {
      loadContactsList();
    };
    window.addEventListener('google-token-changed', handleTokenChange);
    return () => window.removeEventListener('google-token-changed', handleTokenChange);
  }, [user]);

  const loadContactsList = async () => {
    setLoadingContacts(true);
    const activeToken = getAccessToken();
    
    if (!activeToken || (user && user.uid.startsWith('guest_offline_'))) {
      const local = localStorage.getItem(`local_contacts_${user?.uid || 'guest'}`);
      if (local) {
        try {
          setContacts(JSON.parse(local));
        } catch (e) {
          console.error(e);
        }
      }
      setLoadingContacts(false);
      return;
    }

    try {
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos,organizations&pageSize=150', {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      
      if (!res.ok) {
        setLoadingContacts(false);
        return;
      }

      const data = await res.json();
      const connections = data.connections || [];
      
      const parsedContacts: GoogleContact[] = connections.map((conn: any) => {
        const nameObj = conn.names?.[0] || {};
        const emailObj = conn.emailAddresses?.[0] || {};
        const phoneObj = conn.phoneNumbers?.[0] || {};
        const photoObj = conn.photos?.[0] || {};
        const orgObj = conn.organizations?.[0] || {};

        const customMetaStr = localStorage.getItem(`contact_meta_${conn.resourceName}`);
        let category: any = 'General';
        if (customMetaStr) {
          try {
            category = JSON.parse(customMetaStr).category || 'General';
          } catch (e) {}
        }

        return {
          resourceName: conn.resourceName,
          etag: conn.etag,
          name: nameObj.displayName || 'Unnamed Contact',
          givenName: nameObj.givenName || '',
          familyName: nameObj.familyName || '',
          email: emailObj.value || '',
          phone: phoneObj.value || '',
          photoUrl: photoObj.url || '',
          organization: orgObj.name || '',
          category
        };
      });

      setContacts(parsedContacts);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  return { contacts, loadingContacts, reloadContacts: loadContactsList };
}
