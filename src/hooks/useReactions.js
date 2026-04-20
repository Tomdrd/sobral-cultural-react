import { useState, useEffect } from 'react';
import { supa } from '../lib/supabase';

export function useReactions(user) {
  const [myReactions, setMyReactions] = useState([]);
  const [countCache,  setCountCache]  = useState({});

  useEffect(() => {
    if (user) loadMyReactions();
    else setMyReactions([]);
  }, [user]);

  async function loadMyReactions() {
    const { data } = await supa.from('reactions').select('*').eq('user_id', user.id);
    setMyReactions(data || []);
  }

  async function getCountsFor(spotId) {
    const key = String(spotId);
    if (countCache[key]) return countCache[key];
    const { data } = await supa.from('reactions').select('reaction').eq('spot_id', key);
    const counts = {
      like:  (data || []).filter(r => r.reaction === 'like').length,
      been:  (data || []).filter(r => r.reaction === 'been').length,
      going: (data || []).filter(r => r.reaction === 'going').length,
    };
    setCountCache(prev => ({ ...prev, [key]: counts }));
    return counts;
  }

  function myReactionFor(spotId, type) {
    return myReactions.find(r => r.spot_id === String(spotId) && r.reaction === type);
  }

  async function toggle(spotId, reaction) {
    if (!user) return;
    const existing = myReactionFor(spotId, reaction);
    const key = String(spotId);
    if (existing) {
      await supa.from('reactions').delete().eq('id', existing.id);
      setMyReactions(prev => prev.filter(r => r.id !== existing.id));
      setCountCache(prev => ({ ...prev, [key]: { ...prev[key], [reaction]: Math.max(0, (prev[key]?.[reaction] || 1) - 1) } }));
    } else {
      const { data } = await supa.from('reactions').insert({ user_id: user.id, spot_id: key, reaction, spot_type: 'spot' }).select().single();
      if (data) setMyReactions(prev => [...prev, data]);
      setCountCache(prev => ({ ...prev, [key]: { ...prev[key], [reaction]: (prev[key]?.[reaction] || 0) + 1 } }));
    }
  }

  return { myReactionFor, getCountsFor, toggle };
}
