import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supa } from '../../lib/supabase';
import { useSpots } from '../../hooks/useSpots';
import { CAT_LABELS } from '../../lib/supabase';

export default function SpotList() {
  const { spots, loading } = useSpots();
  const [query, setQuery] = useState('');
  const [cat,   setCat]   = useState('todos');

  const filtered = spots.filter(s => {
    const catOk = cat === 'todos' || s.cat === cat;
    return catOk && s.name.toLowerCase().includes(query.toLowerCase());
  });

  async function handleDelete(id, name) {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    await supa.from('spots').delete().eq('id', id);
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Carregando…</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Pontos Turísticos <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)' }}>({filtered.length})</span></h2>
          <p>Gerencie todos os pontos e eventos do mapa</p>
        </div>
        <div className="page-actions">
          <Link to="/admin/spots/novo" className="btn btn-primary">+ Novo Ponto</Link>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            className="sbox"
            placeholder="Buscar…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, background: 'var(--panel)', border: '1.5px solid var(--border)' }}
          />
          <select value={cat} onChange={e => setCat(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--panel)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer', outline: 'none' }}>
            <option value="todos">Todas as categorias</option>
            {Object.entries(CAT_LABELS).filter(([k]) => k !== 'todos' && k !== 'eventos').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><div style={{ fontSize: 48, marginBottom: 16 }}>📍</div><h3>Nenhum ponto encontrado</h3></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                {['Nome', 'Categoria', 'Tipo', 'Destaque', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--muted)' }}>{CAT_LABELS[s.cat] || s.cat}</td>
                  <td style={{ padding: '12px', color: 'var(--muted)' }}>{s.type === 'event' ? '📅 Evento' : '📍 Ponto'}</td>
                  <td style={{ padding: '12px' }}>{s.isFeatured ? <span style={{ color: 'var(--ochre)' }}>⭐ Sim</span> : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/admin/spots/${s.id}`} className="btn btn-sm btn-secondary">Editar</Link>
                      <button onClick={() => handleDelete(s.id, s.name)} className="btn btn-sm btn-danger">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
