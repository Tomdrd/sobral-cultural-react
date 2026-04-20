import { useEffect, useState } from 'react';
import { supa } from '../lib/supabase';

export default function Termos() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supa.from('pages').select('content').eq('id', 'termos').single().then(({ data }) => {
      setContent(data?.content || '<p>Termos de uso em breve.</p>');
      setLoading(false);
    });
  }, []);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, marginBottom: 28 }}>Termos de Uso</h1>
      {loading
        ? <p style={{ color: 'var(--muted)' }}>Carregando…</p>
        : <div style={{ lineHeight: 1.8, fontSize: 14.5, color: 'rgba(245,237,216,.85)' }} dangerouslySetInnerHTML={{ __html: content }} />
      }
    </main>
  );
}
