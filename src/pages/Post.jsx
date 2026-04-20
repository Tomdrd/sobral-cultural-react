import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supa, mapRow } from '../lib/supabase';

export default function Post() {
  const { id } = useParams();
  const [spot,    setSpot]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supa.from('spots').select('*').eq('id', id).single().then(({ data }) => {
      setSpot(data ? mapRow(data) : null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div style={{ padding: '80px 20px', textAlign: 'center' }}>Carregando…</div>;
  if (!spot)   return <div style={{ padding: '80px 20px', textAlign: 'center' }}>Ponto não encontrado. <Link to="/" style={{ color: 'var(--ochre)' }}>Voltar ao mapa</Link></div>;

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      {spot.photo && (
        <img src={spot.photo} alt={spot.name} style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 16, marginBottom: 32 }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ background: spot.color + '33', color: spot.color, border: `1px solid ${spot.color}66`, fontSize: 11, padding: '2px 10px', borderRadius: 10 }}>
          {spot.cat}
        </div>
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
        {spot.blogTitle || spot.name}
      </h1>
      {(spot.blogAuthor || spot.blogDate) && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>
          {spot.blogAuthor && <span>{spot.blogAuthor}</span>}
          {spot.blogAuthor && spot.blogDate && <span> · </span>}
          {spot.blogDate && <span>{new Date(spot.blogDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>}
        </p>
      )}
      <div
        style={{ lineHeight: 1.8, fontSize: 15, color: 'rgba(245,237,216,.85)' }}
        dangerouslySetInnerHTML={{ __html: spot.blogContent || `<p>${spot.desc}</p>` }}
      />
      {spot.address && (
        <div style={{ marginTop: 32, padding: '16px 20px', background: 'rgba(200,135,26,.08)', border: '1px solid rgba(200,135,26,.2)', borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>📍 {spot.address}{spot.horario && ` · 🕐 ${spot.horario}`}{spot.entrada && ` · 🎟 ${spot.entrada}`}</p>
        </div>
      )}
      <div style={{ marginTop: 32 }}>
        <Link to="/" style={{ color: 'var(--ochre)', fontSize: 13 }}>← Voltar ao mapa</Link>
      </div>
    </main>
  );
}
