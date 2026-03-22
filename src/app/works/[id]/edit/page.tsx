'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [work, setWork] = useState<any>(null)
  const [loadingWork, setLoadingWork] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: ''
  })
  const [newFile, setNewFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (id) {
      loadWork()
    }
  }, [id])

  const loadWork = async () => {
    setLoadingWork(true)
    try {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const { data: creator } = await supabase
        .from('creators')
        .select('creator_id')
        .eq('email', user?.email)
        .single()

      if (creator?.creator_id !== data.creator_id) {
        router.push('/profile')
        return
      }

      setWork(data)
      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: data.price?.toString() || ''
      })
    } catch (error) {
      console.error('Error loading work:', error)
      router.push('/profile')
    } finally {
      setLoadingWork(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('Archivo seleccionado:', file.name, file.type, file.size)
      setNewFile(file)
      setMessage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔵 Submit ejecutado')
    setSaving(true)
    setMessage(null)

    try {
      console.log('Título:', formData.title)
      console.log('Precio:', formData.price)
      console.log('Nuevo archivo:', newFile?.name)

      // Validar título
      if (!formData.title.trim()) {
        setMessage({ type: 'error', text: 'El título es obligatorio' })
        setSaving(false)
        return
      }

      const price = formData.price ? parseFloat(formData.price) : null

      // Preparar datos para actualizar
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        price: price
      }

      // Subir nuevo archivo si se seleccionó
      if (newFile) {
        console.log('Subiendo archivo...')
        const fileExt = newFile.name.split('.').pop()
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `works/${uniqueFileName}`

        const { error: uploadError } = await supabase.storage
          .from('works')
          .upload(filePath, newFile)

        if (uploadError) {
          console.error('Error upload:', uploadError)
          throw new Error(`Error al subir archivo: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('works')
          .getPublicUrl(filePath)

        updateData.file_url = publicUrl
        updateData.file_type = newFile.type
        updateData.original_filename = newFile.name

        // Eliminar archivo anterior
        if (work.file_url) {
          const oldFilePath = work.file_url.split('/').pop()
          if (oldFilePath) {
            await supabase.storage.from('works').remove([oldFilePath])
          }
        }
        console.log('Archivo subido:', publicUrl)
      }

      console.log('Actualizando obra...', updateData)

      const { error: updateError } = await supabase
        .from('works')
        .update(updateData)
        .eq('id', id)

      if (updateError) {
        console.error('Error update:', updateError)
        throw new Error(updateError.message)
      }

      console.log('Actualización exitosa')
      setMessage({ type: 'success', text: '✅ Obra actualizada correctamente' })
      
      setTimeout(() => {
        router.push(`/work/${id}`)
      }, 1500)
    } catch (error: any) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingWork) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #4f46e5',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <p>Cargando...</p>
      </div>
    )
  }

  if (!work) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Obra no encontrada</p>
        <Link href="/profile">Volver al perfil</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>✏️ Editar obra</h1>
        <Link href={`/work/${id}`} style={{ padding: '8px 16px', background: '#666', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Cancelar
        </Link>
      </div>

      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          background: message.type === 'success' ? '#e8f5e8' : '#ffebee',
          color: message.type === 'success' ? '#2e7d32' : '#c62828',
          borderRadius: '4px'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '30px',
        border: '1px solid #eaeaea',
        borderRadius: '8px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Título *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Precio (USD)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Hash de verificación</label>
          <code style={{
            display: 'block',
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: '4px',
            wordBreak: 'break-all'
          }}>
            {work.file_hash}
          </code>
        </div>

       <div style={{ marginBottom: '20px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
    Archivo actual
  </label>
  
  {/* Imagen centrada */}
  {work.file_url && work.file_type?.startsWith('image/') ? (
    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
      <img 
        src={work.file_url} 
        alt={work.title} 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '200px', 
          objectFit: 'contain',
          border: '1px solid #eaeaea',
          borderRadius: '8px',
          display: 'block',
          margin: '0 auto'
        }} 
      />
    </div>
  ) : work.file_url ? (
    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
      <a href={work.file_url} target="_blank" style={{ color: '#4f46e5' }}>
        📄 Ver archivo actual
      </a>
    </div>
  ) : (
    <div style={{ textAlign: 'center', marginBottom: '15px', color: '#666' }}>
      No hay archivo adjunto
    </div>
  )}
  
  {/* Botón de selección centrado */}
  <div style={{ textAlign: 'center' }}>
    <input
      type="file"
      id="file-upload"
      onChange={handleFileChange}
      accept="image/*,application/pdf,text/plain"
      style={{ display: 'none' }}
    />
    <label 
      htmlFor="file-upload"
      style={{ 
        display: 'inline-block', 
        padding: '10px 20px', 
        background: '#4f46e5', 
        color: 'white', 
        cursor: 'pointer', 
        borderRadius: '0',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'background 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = '#4338ca'}
      onMouseOut={(e) => e.currentTarget.style.background = '#4f46e5'}
    >
      📁 Seleccionar nuevo archivo
    </label>
  </div>
  
  {newFile && (
    <p style={{ 
      marginTop: '12px', 
      fontSize: '0.8rem', 
      color: '#4f46e5',
      textAlign: 'center'
    }}>
      ✅ Nuevo archivo: {newFile.name} ({(newFile.size / 1024).toFixed(1)} KB)
    </p>
  )}
  
  <p style={{ 
    fontSize: '0.7rem', 
    color: '#999', 
    marginTop: '12px',
    textAlign: 'center'
  }}>
    Formatos: JPG, PNG, GIF, WebP, PDF, TXT. Máximo 10MB.
  </p>
</div>
        

        <button
  type="submit"  // 👈 DEBE SER "submit"
  disabled={saving}
  style={{
    width: '100%',
    padding: '12px',
    background: saving ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
    color: 'white',
    border: 'none',
    borderRadius: '0',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: saving ? 'not-allowed' : 'pointer'
  }}
>
  {saving ? 'Guardando...' : 'Guardar cambios'}
</button>
      </form>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}