import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '../firebase/authService';
import { getOrCreateClientProfile, ClientProfile } from '../firebase/firestoreService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        try {
          const userProfile = await getOrCreateClientProfile(authUser);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, profile, loading };
};