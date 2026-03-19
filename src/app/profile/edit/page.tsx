'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'

export default function EditProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { t } = useLanguage()

  const [formData, setFormData] = useState({
    full_first_name: '',
    full_last_name: '',
    email: '',
    phone: '',
    region: '',
    bio: '',
    avatar_url: ''
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Cargar datos actuales del creador
  const { data: creator, isLoading } = useQuery({
    queryKey: ['creator', user?.email],
    queryFn: async () => {
      if (!user?.email) return null
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.email,
  })

  // Actualizar form cuando se carga el creador
  useEffect(() => {
    if (creator) {
      setFormData({
        full_first_name: creator.full_first_name || '',
        full_last_name: creator.full_last_name || '',
        email: creator.email || user?.email || '',
        phone: creator.phone || '',
        region: creator.region || '',
        bio: creator.bio || '',
        avatar_url: creator.avatar_url || ''
      })
      
      if (creator.avatar_url) {
        setAvatarPreview(creator.avatar_url)
      }
    }
  }, [creator, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor selecciona una imagen válida' })
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no puede ser mayor a 2MB' })
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Función para subir avatar al bucket 'works'
  const uploadAvatar = async (file: File, creatorId: string): Promise<string> => {
    const bucketName = 'works'
    const fileExt = file.name.split('.').pop()
    const fileName = `avatars/${creatorId}-${Date.now()}.${fileExt}`

    console.log('Subiendo avatar a:', bucketName, fileName)

    // Subir el archivo
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Error subiendo avatar:', uploadError)
      throw new Error(uploadError.message)
    }

    // Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    console.log('Avatar subido, URL:', publicUrl)
    return publicUrl
  }

  // Mutación para guardar cambios
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!creator?.creator_id) throw new Error('No creator ID found')
      if (!user) throw new Error('No user found')

      setSaving(true)
      setMessage(null)
      
      let avatarUrl = formData.avatar_url

      // Subir nuevo avatar si se seleccionó uno
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(avatarFile, creator.creator_id)
        } catch (error: any) {
          console.error('Error en upload:', error)
          throw new Error(`Error al subir el avatar: ${error.message}`)
        }
      }

      // Actualizar email en auth si cambió
      if (formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        
        if (emailError) {
          if (emailError.message.includes('already registered')) {
            throw new Error('Este email ya está registrado')
          }
          throw new Error(`Error al actualizar email: ${emailError.message}`)
        }
      }

      // Actualizar datos en tabla creators - SOLO los campos que existen
      const { error: updateError } = await supabase
        .from('creators')
        .update({
          full_first_name: formData.full_first_name,
          full_last_name: formData.full_last_name,
          email: formData.email,
          phone: formData.phone,
          region: formData.region,
          bio: formData.bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('creator_id', creator.creator_id)

      if (updateError) {
        console.error('Error actualizando:', updateError)
        throw new Error(`Error al actualizar perfil: ${updateError.message}`)
      }

      return { avatarUrl }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', user?.email] })
      
      setMessage({ 
        type: 'success', 
        text: 'Perfil actualizado correctamente' 
      })
      
      setAvatarFile(null)
      
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    },
    onError: (error: any) => {
      console.error('Error en mutación:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al actualizar el perfil' 
      })
    },
    onSettled: () => {
      setSaving(false)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    updateProfileMutation.mutate()
  }

  if (loading || isLoading) {
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
        <p>Cargando...</p>
      </div>
    )
  }

  if (!user || !creator) {
    router.push('/auth/login')
    return null
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          margin: 0,
          background: 'linear-gradient(135deg, #4f46e5, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Editar Perfil
        </h1>
        <Link
          href="/profile"
          style={{
            padding: '8px 16px',
            background: '#666',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          ← Volver al perfil
        </Link>
      </div>

      {/* Mensaje de éxito/error */}
      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          background: message.type === 'success' ? '#e8f5e8' : '#fff5f5',
          border: `1px solid ${message.type === 'success' ? '#2e7d32' : '#dc2626'}`,
          color: message.type === 'success' ? '#2e7d32' : '#dc2626',
          borderRadius: '4px'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Sección de Avatar */}
        <div style={{
          border: '1px solid #eaeaea',
          padding: '25px',
          marginBottom: '20px',
          background: 'white',
          borderRadius: '4px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Foto de perfil</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
            {/* Preview del avatar */}
            <div style={{ textAlign: 'center' }}>
              {avatarPreview ? (
  <Image
    src={avatarPreview}
    alt="Avatar preview"
    width={120}
    height={120}
    style={{
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #4f46e5'
    }}
  />
) : (
  <div style={{
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f46e5, #10b981)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    color: 'white',
    fontWeight: 'bold'
  }}>
    {formData.full_first_name?.charAt(0) || '👤'}
  </div>
)}
            </div>

            {/* Input para subir avatar */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="avatar"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: '#4f46e5',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }}
              >
                {avatarPreview ? 'Cambiar foto' : 'Subir foto'}
              </label>
              <input
                type="file"
                id="avatar"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
                Formatos: JPG, PNG, GIF, WebP. Máximo 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Información personal */}
        <div style={{
          border: '1px solid #eaeaea',
          padding: '25px',
          marginBottom: '20px',
          background: 'white',
          borderRadius: '4px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Información personal</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {/* Nombre público */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nombre
              </label>
              <input
                type="text"
                name="full_first_name"
                value={formData.full_first_name}
                onChange={handleChange}
                placeholder="Tu nombre"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Apellido
              </label>
              <input
                type="text"
                name="full_last_name"
                value={formData.full_last_name}
                onChange={handleChange}
                placeholder="Tu apellido"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                Si cambias el email, recibirás un correo de confirmación
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+34 600 000 000"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Región */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Región / Ciudad
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleChange}
                placeholder="Ej: Madrid, Barcelona..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{
          border: '1px solid #eaeaea',
          padding: '25px',
          marginBottom: '20px',
          background: 'white',
          borderRadius: '4px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Biografía</h2>
          
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={5}
            placeholder="Cuéntanos sobre ti, tu arte, tu experiencia..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Botones de acción */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'flex-end'
        }}>
          <Link
            href="/profile"
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#666',
              border: '1px solid #ddd',
              textDecoration: 'none',
              fontWeight: 'bold',
              borderRadius: '4px'
            }}
          >
            Cancelar
          </Link>
          
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: saving ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}