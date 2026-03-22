'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useLanguage } from '@/contexts/LanguageContext'
import { useQuery } from '@tanstack/react-query'
import CheckoutButton from '@/components/CheckoutButton'
import { useTranslation } from '@/hooks/useTranslation'

export default function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const { t, language } = useLanguage()

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  const { data: work, isLoading, error } = useQuery({
    queryKey: ['work', id],
    queryFn: async () => {
      if (!id) return null
      const { data: workData, error: workError } = await supabase
        .from('works')
        .select('*')
        .eq('id', id)
        .single()
      if (workError || !workData) throw new Error(t.verify?.notFound || 'Obra no encontrada')
      await supabase.from('work_visits').insert([{ work_id: workData.id }])
      const { count } = await supabase.from('work_visits').select('*', { count: 'exact', head: true }).eq('work_id', workData.id)
      const { data: creatorData } = await supabase
        .from('creators')
        .select('full_first_name, full_last_name, first_name, last_name, creator_id, country_name')
        .eq('creator_id', workData.creator_id)
        .single()
      return { ...workData, visits: count || 0, creator: creatorData }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  const { translatedText: translatedDescription, isTranslating: isTranslatingDesc } = useTranslation(work?.description || '')
  const { translatedText: translatedTitle, isTranslating: isTranslatingTitle } = useTranslation(work?.title || '')

  const creatorName = useCallback(() => {
    if (!work?.creator) return t.work?.creator || 'Creador'
    const c = work.creator
    return c.full_first_name && c.full_last_name
      ? `${c.full_first_name} ${c.full_last_name}`
      : `${c.first_name || ''} ${c.last_name || ''}`.trim()
  }, [work, t])

  if (isLoading) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #4f46e5', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite', margin: '20px auto' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p>{t.search?.searching || 'Cargando...'}</p>
      </div>
    )
  }

  if (error || !work) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: '#333' }}>🔍 {t.verify?.notFound || 'Obra no encontrada'}</h1>
        <Link href="/" style={{ color: '#4f46e5', display: 'block', marginTop: '20px' }}>← Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '10px' }}>
        <Link href="/" style={{ color: '#4f46e5', textDecoration: 'none' }}>← Volver al inicio</Link>
        <div style={{ background: '#f0f7ff', padding: '5px 15px', color: '#4f46e5' }}>
          👁️ {work.visits} {work.visits === 1 ? t.work?.visits?.singular || 'visita' : t.work?.visits?.plural || 'visitas'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, background: 'linear-gradient(135deg, #4f46e5, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isTranslatingTitle ? 'Traduciendo...' : (language === 'en' ? translatedTitle : work.title)}
        </h1>
        {work.price && <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5', background: '#f0f7ff', padding: '10px 20px' }}>${work.price}</div>}
      </div>

      {work.creator && (
        <div style={{ background: '#f9fafb', padding: '20px', marginBottom: '30px' }}>
          <p><strong>{t.work?.creator || 'Creador'}:</strong> {creatorName()}</p>
          <p><strong>Creator ID:</strong> {work.creator_id}</p>
          <p><strong>{t.work?.country || 'País'}:</strong> {work.creator.country_name}</p>
        </div>
      )}

      {work.description && (
        <div style={{ marginBottom: '30px' }}>
          <h3>{t.work?.description || 'Descripción'}</h3>
          <div style={{ background: '#f9fafb', padding: '20px', whiteSpace: 'pre-wrap', minHeight: '80px' }}>
            {isTranslatingDesc ? <span>🔄 Traduciendo...</span> : (language === 'en' ? translatedDescription : work.description)}
          </div>
        </div>
      )}

      <h3>{t.work?.hash || 'Hash de verificación'}</h3>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ background: '#1a1a1a', padding: '8px 12px', display: 'inline-block', maxWidth: '100%' }}>
          <code style={{ color: '#0f0', background: '#000', padding: '4px 8px', display: 'inline-block', fontFamily: 'monospace' }}>{work.file_hash}</code>
        </div>
      </div>

      {work.file_url && work.file_type?.startsWith('image/') && (
        <div style={{ marginBottom: '30px' }}>
          <h3>{t.work?.image || 'Imagen'}</h3>
          <img src={work.file_url} alt={work.title} style={{ maxWidth: '100%', maxHeight: '600px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        </div>
      )}

      {work.file_url && !work.file_type?.startsWith('image/') && (
        <div style={{ marginBottom: '30px' }}>
          <h3>{t.work?.file || 'Archivo'}</h3>
          <a href={work.file_url} target="_blank" style={{ display: 'inline-block', padding: '10px 20px', background: '#4f46e5', color: 'white', textDecoration: 'none' }}>📄 {t.work?.download || 'Descargar'} {work.original_filename || 'archivo'}</a>
        </div>
      )}

      {work.price && (
        <div style={{ marginTop: '40px', padding: '20px', background: '#f0f7ff', textAlign: 'center' }}>
          <h3>{t.work?.interested || '¿Interesado en esta obra?'}</h3>
          <CheckoutButton workId={work.id} workTitle={work.title} price={work.price} creatorName={creatorName()} />
          <p style={{ marginTop: '15px', color: '#666', fontSize: '0.9rem' }}>{t.work?.securePayment || 'Pago seguro con Stripe'}</p>
        </div>
      )}
    </div>
  )
}