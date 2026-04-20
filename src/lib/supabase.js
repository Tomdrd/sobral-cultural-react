import { createClient } from '@supabase/supabase-js';

const SUPA_URL = 'https://nrohpfggqcbscyoigpiz.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';

export const supa = createClient(SUPA_URL, SUPA_KEY);

export const CAT_LABELS = {
  todos:     'Todos',
  eventos:   'Eventos',
  religioso: 'Religioso',
  cultura:   'Cultura',
  historico: 'Histórico',
  natureza:  'Natureza',
  lazer:     'Lazer',
};

export const CATS = ['todos', 'eventos', 'religioso', 'cultura', 'historico', 'natureza', 'lazer'];

export function mapRow(r) {
  return {
    id:          r.id,
    name:        r.name,
    cat:         r.cat,
    color:       r.color,
    lat:         r.lat,
    lng:         r.lng,
    desc:        r.description,
    address:     r.address,
    horario:     r.horario,
    entrada:     r.entrada,
    photo:       r.photo,
    type:        r.type || 'spot',
    eventDate:   r.event_date  || null,
    eventEnd:    r.event_end   || null,
    isFeatured:  !!r.is_featured,
    blogTitle:   r.blog_title,
    blogContent: r.blog_content,
    blogAuthor:  r.blog_author,
    blogDate:    r.blog_date,
    createdAt:   r.created_at,
  };
}
