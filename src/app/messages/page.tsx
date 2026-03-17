'use client'

import { useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  // ✅ TODOS LOS HOOKS VAN AL PRINCIPIO, ANTES DE CUALQUIER RETURN

  // Query para obtener el creator_id
  const { data: creator, isLoading: loadingCreator } = useQuery({
    queryKey: ['creator', user?.email],
    queryFn: async () => {
      if (!user?.email) return null
      const { data, error } = await supabase
        .from('creators')
        .select('creator_id')
        .eq('email', user.email)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  })

  // Query para obtener mensajes
  const { data: messages = [], isLoading: loadingMessages, error } = useQuery({
    queryKey: ['messages', creator?.creator_id],
    queryFn: async () => {
      if (!creator?.creator_id) return []
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('creator_id', creator.creator_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!creator?.creator_id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Mutación para marcar como leído
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) throw error
      return messageId
    },
    onSuccess: (messageId) => {
      queryClient.setQueryData(['messages', creator?.creator_id], (old: any[]) =>
        old.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      )
    },
  })

  // Mutación para eliminar mensaje
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
      return messageId
    },
    onSuccess: (messageId) => {
      queryClient.setQueryData(['messages', creator?.creator_id], (old: any[]) =>
        old.filter(msg => msg.id !== messageId)
      )
    },
  })

  // ✅ MEMOIZACIONES - También van antes de cualquier return
  const unreadCount = useMemo(() => 
    messages.filter(m => !m.is_read).length
  , [messages])

  const hasMessages = useMemo(() => messages.length > 0, [messages])

  const handleMarkAsRead = useCallback((messageId: number) => {
    markAsReadMutation.mutate(messageId)
  }, [markAsReadMutation])

  const handleDeleteMessage = useCallback((messageId: number) => {
    if (!confirm(t.messages?.confirmDelete || '¿Eliminar este mensaje?')) return
    deleteMessageMutation.mutate(messageId)
  }, [deleteMessageMutation, t.messages?.confirmDelete])

  // ✅ AHORA SÍ, LOS CONDICIONALES Y RETURNS
  if (!loading && !user) {
    router.push('/auth/login')
    return null
  }

  if (loading || loadingCreator || loadingMessages) {
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
        <p>{t.search?.searching || 'Cargando...'}</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
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
          📬 {t.messages?.title || 'Mensajes'}
        </h1>
        {unreadCount > 0 && (
          <span style={{
            background: '#ef4444',
            color: 'white',
            padding: '4px 12px',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}>
            {unreadCount} {unreadCount === 1 ? (t.messages?.new || 'nuevo') : (t.messages?.newPlural || 'nuevos')}
          </span>
        )}
      </div>

      {error && (
        <div style={{
          padding: '15px',
          background: '#ffebee',
          color: '#c62828',
          marginBottom: '20px'
        }}>
          {error instanceof Error ? error.message : t.messages?.error || 'Error al cargar los mensajes'}
        </div>
      )}

      {!hasMessages ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f9f9f9'
        }}>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '10px' }}>
            {t.messages?.noMessages || 'No tienes mensajes aún'}
          </p>
          <p style={{ color: '#888' }}>
            {t.messages?.noMessagesDesc || 'Cuando alguien te contacte desde tu perfil público, los mensajes aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {messages.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteMessage}
              isProcessing={
                markAsReadMutation.isPending || 
                deleteMessageMutation.isPending
              }
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Componente memoizado para cada mensaje
const MessageCard = ({ 
  message, 
  onMarkAsRead, 
  onDelete, 
  isProcessing,
  t 
}: any) => {
  const isPending = isProcessing

  return (
    <div
      style={{
        border: `1px solid ${message.is_read ? '#eaeaea' : '#4f46e5'}`,
        padding: '20px',
        background: message.is_read ? 'white' : '#f0f7ff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        opacity: isPending ? 0.7 : 1,
        transition: 'all 0.2s'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '15px'
      }}>
        <div>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            {message.sender_name}
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            {message.sender_email}
          </p>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>
          {new Date(message.created_at).toLocaleString()}
        </p>
      </div>

      <div style={{
        padding: '15px',
        background: 'white',
        marginBottom: '15px',
        border: '1px solid #eee'
      }}>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
          {message.message}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        {!message.is_read && (
          <button
            onClick={() => onMarkAsRead(message.id)}
            disabled={isPending}
            style={{
              padding: '8px 16px',
              background: isPending ? '#ccc' : '#4f46e5',
              color: 'white',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: isPending ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => !isPending && (e.currentTarget.style.background = '#4338ca')}
            onMouseOut={(e) => !isPending && (e.currentTarget.style.background = '#4f46e5')}
          >
            ✓ {t.messages?.markAsRead || 'Marcar como leído'}
          </button>
        )}
        <button
          onClick={() => onDelete(message.id)}
          disabled={isPending}
          style={{
            padding: '8px 16px',
            background: isPending ? '#ccc' : '#ef4444',
            color: 'white',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => !isPending && (e.currentTarget.style.background = '#dc2626')}
          onMouseOut={(e) => !isPending && (e.currentTarget.style.background = '#ef4444')}
        >
          🗑️ {t.messages?.delete || 'Eliminar'}
        </button>
      </div>
    </div>
  )
}