import { useState, useEffect } from 'react';
import { supa, mapRow } from '../lib/supabase';

export function useSpots() {
  const [spots,   setSpots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    load();
    const channel = supa.channel('spots-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spots' }, load)
      .subscribe();
    return () => supa.removeChannel(channel);
  }, []);

  async function load() {
    const { data, error } = await supa
      .from('spots').select('*').order('created_at', { ascending: true });
    if (error) { setError(error.message); setLoading(false); return; }
    setSpots((data || []).map(mapRow));
    setLoading(false);
    setError(null);
  }

  return { spots, loading, error };
}
