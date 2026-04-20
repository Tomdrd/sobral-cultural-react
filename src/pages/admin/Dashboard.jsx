import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supa } from '../../lib/supabase';

export default function Dashboard() {
  const [stats,   setStats]   = useState({ spots: 0, pending: 0, reactions: 0, contacts: 0 });
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supa.from('spots').select('id', { count: 'exact', head: true }),
      supa.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      supa.from('reactions').select('id', { count: 'exact', head: true }),
      supa.from('contacts').select('id', { count: 'exact', head: true }),
    ]).then(([spots, subs, reacts, contacts]) => {
      setStats({
        spots:     spots.count     || 0,
        pending:   subs.data?.length || 0,
        reactions: reacts.count    || 0,
        contacts:  contacts.count  || 0,
      });
      setPending(subs.data || []);
      setLoading(false);
    });
  }, []);

  async function moderate(id, status) {
    await supa.from('submissions').update({ status }).eq('id', id);
    setPending(p => p.filter(s => s.id !== id));
    setStats(s => ({ ...s, pending: s.pending - 1 }));
  }

  const STAT_CARDS = [
    { label: 'Pontos no mapa',   value: stats.spots,     icon: '📍', color: 'var(--ochre)' },
    { label: 'Sugestões pending', value: stats.pending,  icon: '⏳', color: 'var(--terra)' },
    { label: 'Total reactions',  value: stats.reactions,  icon: '♥',  color: 'var(--teal)' },
    { label: 'Mensagens',        value: stats.contacts,   icon: '✉',  color: 'var(--purple)' },
  ];

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Carregando…</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Dashboard</h2>
          <p>Visão geral do Sobral Cultural</p>
        </div>
        <div className="page-actions">
          <Link to="/admin/spots/novo" className="btn btn-primary">+ Novo Ponto</Link>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-row">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ position: 'absolute', right: 16, top: 16, fontSize: 22, opacity: .35 }}>{s.icon}</div>
              <div className="stat-num">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {pending.length > 0 && (
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16 }}>Sugestões Pendentes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map(s => (
                <div key={s.id} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.cat} · {s.type === 'event' ? 'Evento' : 'Ponto'} · {new Date(s.created_at).toLocaleDateString('pt-BR')}</div>
                    {s.description && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, maxWidth: 400 }}>{s.description.slice(0, 120)}…</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => moderate(s.id, 'approved')} className="btn btn-sm" style={{ background: 'rgba(60,120,40,.2)', color: '#8ecb6e', border: '1px solid rgba(60,120,40,.4)' }}>✅ Aprovar</button>
                    <button onClick={() => moderate(s.id, 'rejected')} className="btn btn-sm" style={{ background: 'rgba(181,74,42,.15)', color: '#e89e7e', border: '1px solid rgba(181,74,42,.3)' }}>❌ Recusar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
