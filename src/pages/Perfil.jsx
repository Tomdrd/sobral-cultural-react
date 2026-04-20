import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { supa } from '../lib/supabase';

const STATUS_LABEL = { pending: '⏳ Aguardando', approved: '✅ Aprovado', rejected: '❌ Recusado' };
const STATUS_COLOR = { pending: 'rgba(200,135,26,.2)', approved: 'rgba(60,120,40,.2)', rejected: 'rgba(181,74,42,.2)' };

export default function Perfil() {
  const { user, logout } = useOutletContext();
  const navigate = useNavigate();
  const [profile,    setProfile]    = useState(null);
  const [subs,       setSubs]       = useState([]);
  const [reactions,  setReactions]  = useState([]);
  const [spotsMap,   setSpotsMap]   = useState({});
  const [tab,        setTab]        = useState('subs');
  const [loading,    setLoading]    = useState(true);
  const [editMode,   setEditMode]   = useState(false);
  const [newName,    setNewName]    = useState('');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, [user]);

  async function loadData() {
    const [{ data: prof }, { data: subsData }, { data: reactData }] = await Promise.all([
      supa.from('profiles').select('*').eq('id', user.id).single(),
      supa.from('submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supa.from('reactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    setProfile(prof || { role: 'user', full_name: user.user_metadata?.full_name || '' });
    setSubs(subsData || []);
    setReactions(reactData || []);
    setNewName(prof?.full_name || user.user_metadata?.full_name || '');

    const ids = [...new Set((reactData || []).map(r => r.spot_id).filter(Boolean))];
    if (ids.length) {
      const { data: spots } = await supa.from('spots').select('id, name').in('id', ids);
      const map = {};
      (spots || []).forEach(s => { map[s.id] = s; });
      setSpotsMap(map);
    }
    setLoading(false);
  }

  async function saveName() {
    setSaving(true);
    await supa.from('profiles').upsert({ id: user.id, full_name: newName });
    await supa.auth.updateUser({ data: { full_name: newName } });
    setProfile(p => ({ ...p, full_name: newName }));
    setSaving(false);
    setEditMode(false);
  }

  if (loading) return <div style={{ padding: '80px 20px', textAlign: 'center' }}>Carregando perfil…</div>;

  const av = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
  const isAdmin = profile?.role === 'admin';

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>

      {/* Hero */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--ochre)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'var(--deep)', flexShrink: 0, overflow: 'hidden' }}>
          {av ? <img src={av} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editMode ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ background: 'rgba(255,255,255,.07)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--cream)', fontSize: 15, outline: 'none', flex: 1 }}
              />
              <button onClick={saveName} disabled={saving} style={{ background: 'var(--ochre)', color: 'var(--deep)', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {saving ? '…' : 'Salvar'}
              </button>
              <button onClick={() => setEditMode(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>
                Cancelar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800 }}>{name}</h1>
              <button onClick={() => setEditMode(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--muted)' }}>✏</button>
            </div>
          )}
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{user.email}</p>
          {isAdmin && <span style={{ display: 'inline-block', marginTop: 6, background: 'rgba(200,135,26,.2)', color: 'var(--ochre)', fontSize: 11, padding: '2px 10px', borderRadius: 10, fontWeight: 600 }}>⚙ Admin</span>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/submeter" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--ochre)', color: 'var(--deep)', padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>➕ Sugerir Ponto</Link>
          <button onClick={() => { logout(); navigate('/'); }} style={{ background: 'rgba(181,74,42,.15)', color: '#e89e7e', border: '1px solid rgba(181,74,42,.3)', padding: '9px 16px', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}>Sair</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Sugestões enviadas', value: subs.length, icon: '📍' },
          { label: 'Lugares curtidos',   value: reactions.filter(r => r.reaction === 'like').length, icon: '♥' },
          { label: 'Lugares visitados',  value: reactions.filter(r => r.reaction === 'been').length, icon: '✓' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, margin: '4px 0' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,.2)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
        {[['subs', '📍 Minhas Sugestões'], ['reacts', '♥ Pontos Marcados']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: '.2s', background: tab === key ? 'var(--ochre)' : 'transparent', color: tab === key ? 'var(--deep)' : 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Sugestões */}
      {tab === 'subs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {subs.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 14 }}>Você ainda não enviou nenhuma sugestão.</div>
            : subs.map(s => (
              <div key={s.id} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.cat} · {new Date(s.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <span style={{ background: STATUS_COLOR[s.status] || 'rgba(255,255,255,.07)', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                  {STATUS_LABEL[s.status] || s.status}
                </span>
              </div>
            ))
          }
        </div>
      )}

      {/* Reactions */}
      {tab === 'reacts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reactions.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 14 }}>Você ainda não marcou nenhum ponto.</div>
            : reactions.map(r => (
              <div key={r.id} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{spotsMap[r.spot_id]?.name || 'Ponto turístico'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <span style={{ fontSize: 18 }}>
                  {r.reaction === 'like' ? '♥' : r.reaction === 'been' ? '✓' : '📅'}
                </span>
              </div>
            ))
          }
        </div>
      )}
    </main>
  );
}
