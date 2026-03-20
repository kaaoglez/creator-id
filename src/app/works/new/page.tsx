'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateWorkHash } from '@/utils/generateWorkHash'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'

export default function NewWorkPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [workData, setWorkData] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  // Query para verificar usuario y obtener creator
  const { data: userData, isLoading: checkingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirectTo=/works/new')
        return null
      }
      
      const { data: creator } = await supabase
        .from('creators')
        .select('*')
        .eq('email', user.email)
        .single()
      
      if (!creator) {
        router.push('/register?redirectTo=/works/new')
        return null
      }
      
      return { user, creator }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const user = userData?.user
  const creator = userData?.creator

  // Mutación para crear obra
  const createWorkMutation = useMutation({
    mutationFn: async ({ title, description, price }: { title: string; description?: string; price: number }) => {
      let fileUrl = ''
      let fileType = ''
      let originalFileName = ''

      if (file) {
        setUploading(true)
        const fileExt = file.name.split('.').pop()
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `works/${uniqueFileName}`

        const { error: uploadError } = await supabase.storage
          .from('works')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('works')
          .getPublicUrl(filePath)

        fileUrl = publicUrl
        fileType = file.type
        originalFileName = file.name
      }

      const timestamp = Date.now()
      const file_hash = generateWorkHash(
        title,
        creator.creator_id,
        timestamp,
        description || ''
      )

      const { data, error } = await supabase
        .from('works')
        .insert([{
          creator_id: creator.creator_id,
          title,
          description: description || null,
          file_hash,
          file_url: fileUrl || null,
          file_type: fileType || null,
          original_filename: originalFileName || null,
          price: price, // 👈 NUEVO CAMPO
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['works', creator?.creator_id] })
      setWorkData(data)
      setSuccess(true)
    },
    onError: (error: any) => {
      alert(t.errors.uploadError + ': ' + error.message)
    },
    onSettled: () => {
      setUploading(false)
    },
  })

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title')?.toString()
    const description = formData.get('description')?.toString()
    const price = parseFloat(formData.get('price')?.toString() || '0')

    if (!title || !creator) {
      alert(t.errors.required)
      return
    }

    if (price < 0) {
      alert('El precio no puede ser negativo')
      return
    }

    createWorkMutation.mutate({ title, description, price })
  }, [creator, createWorkMutation, t.errors.required])

  const handleReset = useCallback(() => {
    setSuccess(false)
    setWorkData(null)
    setFile(null)
  }, [])

  const creatorName = useMemo(() => {
    if (!creator) return ''
    if (creator.full_first_name && creator.full_last_name) {
      return `${creator.full_first_name} ${creator.full_last_name}`
    }
    return `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || 'Creador'
  }, [creator])

  if (checkingUser) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #4f46e5',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p>{t.search.searching}...</p>
      </div>
    )
  }

  if (!user || !creator) {
    return null
  }

   if (success && workData) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{
          background: '#e8f5e8',
          border: '2px solid #4caf50',
          padding: '30px',
          textAlign: 'center',
          borderRadius: '8px'
        }}>
          <h1 style={{ color: '#2e7d32', marginBottom: '20px' }}>{t.works.success}</h1>
          
          <div style={{
            background: 'white',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'left',
            borderRadius: '4px'
          }}>
            {/* Título */}
            <p style={{ marginBottom: '10px' }}>
              <strong>{t.works.title}:</strong> {workData.title}
            </p>
            
            {/* Descripción - CORREGIDA con límite */}
            {workData.description && (
              <div style={{ marginBottom: '15px' }}>
                <strong>{t.work.description}:</strong>
                <div style={{
                  marginTop: '5px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderLeft: '4px solid #4f46e5',
                  borderRadius: '0 4px 4px 0',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  wordWrap: 'break-word',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: '#334155'
                }}>
                  {workData.description}
                </div>
              </div>
            )}
            
            {/* Precio */}
            {workData.price && (
              <p style={{ marginBottom: '10px' }}>
                <strong>Precio:</strong>{' '}
                <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#4f46e5' }}>
                  ${typeof workData.price === 'number' ? workData.price.toFixed(2) : workData.price}
                </span>
              </p>
            )}
            
            {/* Hash - CORREGIDO con wordBreak */}
            <p style={{ marginBottom: '5px' }}>
              <strong>{t.work.hash}:</strong>
            </p>
            <code style={{
              background: '#333',
              color: '#0f0',
              padding: '10px',
              display: 'block',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {workData.file_hash}
            </code>

            {/* Imagen */}
            {workData.file_url && workData.file_type?.startsWith('image/') && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                background: '#f5f5f5',
                borderRadius: '4px'
              }}>
                <p style={{ marginBottom: '10px' }}><strong>{t.work.image}:</strong></p>
                <Image
                  src={workData.file_url}
                  alt={workData.title}
                  width={400}
                  height={200}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/${creator.creator_id}`}
              style={{
                padding: '12px 24px',
                background: '#4f46e5',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 'bold',
                borderRadius: '4px',
                flex: '1 1 auto',
                minWidth: '150px'
              }}
            >
              {t.work.viewCreator}
            </Link>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                borderRadius: '4px',
                flex: '1 1 auto',
                minWidth: '150px'
              }}
            >
              {t.works.registerAnother}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '10px',
        background: 'linear-gradient(135deg, #4f46e5, #10b981)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {t.works.register}
      </h1>
      
      <p style={{ color: '#666', marginBottom: '30px' }}>
        {t.works.creator}: <strong>{creatorName}</strong> ({creator.creator_id})
      </p>

      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {t.works.title} <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            name="title"
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {t.work.description}
          </label>
          <textarea
            name="description"
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              fontSize: '1rem',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>

       {/* 👇 CAMPO DE PRECIO CON TRADUCCIÓN */}
<div style={{ marginBottom: '20px' }}>
  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
    {t.works?.price || 'Precio (USD)'} <span style={{ color: 'red' }}>*</span>
  </label>
  <input
    type="number"
    name="price"
    step="0.01"
    min="0"
    required
    style={{
      width: '100%',
      padding: '12px',
      border: '2px solid #e0e0e0',
      fontSize: '1rem',
      boxSizing: 'border-box'
    }}
  />
  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
    {t.works?.priceHelp || 'Ingresa el precio en dólares (ej: 15.99)'}
  </small>
</div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {t.works.file}
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,application/pdf,text/plain"
            style={{
              width: '100%',
              padding: '10px',
              border: '2px dashed #e0e0e0',
              backgroundColor: '#f9f9f9',
              cursor: 'pointer'
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            {t.works.allowedFormats}
          </small>
          {file && (
            <p style={{ fontSize: '0.9rem', marginTop: '5px', color: '#4f46e5' }}>
              {t.works.fileSelected
                .replace('{name}', file.name)
                .replace('{size}', (file.size / 1024).toFixed(1))}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={createWorkMutation.isPending || uploading}
          style={{
            width: '100%',
            padding: '14px',
            background: createWorkMutation.isPending || uploading ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            border: 'none',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: createWorkMutation.isPending || uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {uploading ? t.works.uploading : 
           createWorkMutation.isPending ? t.works.registering : 
           t.works.registerButton}
        </button>
      </form>
    </div>
  )
}