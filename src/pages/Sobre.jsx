import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supa } from '../lib/supabase';

const FEATURES = [
  { icon: '🗺', title: 'Mapa Interativo',  desc: 'Explore os pontos turísticos com geolocalização em tempo real e marcadores personalizados.' },
  { icon: '📰', title: 'Posts Detalhados', desc: 'Conteúdo rico sobre cada ponto, com história, horários e como chegar.' },
  { icon: '☁',  title: 'Dados em Nuvem',  desc: 'Armazenado no Supabase com sincronização em tempo real em qualquer dispositivo.' },
  { icon: '📱', title: 'Responsivo',       desc: 'Acesse do celular, tablet ou desktop com a mesma experiência.' },
];

export default function Sobre() {
  const [content, setContent] = useState('');

  useEffect(() => {
    supa.from('pages').select('content').eq('id', 'sobre').single().then(({ data }) => {
      if (data?.content) setContent(data.content);
    });
  }, []);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
          Sobre o Projeto
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Conheça a missão e a história por trás do Sobral Cultural</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 20px' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {content && (
        <div
          style={{ lineHeight: 1.8, fontSize: 15, color: 'rgba(245,237,216,.85)', marginBottom: 40 }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      <div style={{ paddingTop: 28, borderTop: '1px solid rgba(200,135,26,.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>© {new Date().getFullYear()} Sobral Cultural · Projeto de Extensão ADS</div>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--ochre)', color: 'var(--deep)', padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          🗺 Explorar o Mapa →
        </Link>
      </div>
    </main>
  );
}
