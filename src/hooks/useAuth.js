import { useState, useEffect } from 'react';
import { supa } from '../lib/supabase';

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supa.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) checkAdmin(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supa.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) checkAdmin(session.user.id);
      else { setIsAdmin(false); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdmin(userId) {
    const { data } = await supa.from('profiles').select('role').eq('id', userId).single();
    setIsAdmin(data?.role === 'admin');
    setLoading(false);
  }

  async function logout() {
    await supa.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }

  return { user, isAdmin, loading, logout };
}
