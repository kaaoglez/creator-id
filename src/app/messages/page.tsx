'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import Pagination from '@/components/Pagination'

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const itemsPerPage = 5 // 5 mensajes por página
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  // Detectar tamaño de pantalla para responsive
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

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
      // Resetear a página 1 si no hay mensajes en la página actual
      if (paginatedMessages.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      }
    },
  })

  // Resetear página cuando cambian los mensajes
  useEffect(() => {
    setCurrentPage(1)
  }, [messages.length])

  // Memoizaciones
  const unreadCount = useMemo(() => 
    messages.filter(m => !m.is_read).length
  , [messages])

  const hasMessages = useMemo(() => messages.length > 0, [messages])

  // Paginación
  const totalPages = Math.ceil(messages.length / itemsPerPage)
  const paginatedMessages = useMemo(() => 
    messages.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ), [messages, currentPage]
  )

  const handleMarkAsRead = useCallback((messageId: number) => {
    markAsReadMutation.mutate(messageId)
  }, [markAsReadMutation])

  const handleDeleteMessage = useCallback((messageId: number) => {
    if (!confirm(t.messages?.confirmDelete || '¿Eliminar este mensaje?')) return
    deleteMessageMutation.mutate(messageId)
  }, [deleteMessageMutation, t.messages?.confirmDelete])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    <div style={{ 
      maxWidth: "1200px", 
      margin: "40px auto", 
      padding: isMobile ? "0 15px" : "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '15px' : '0',
        marginBottom: '30px'
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.8rem' : '2rem', 
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
            padding: isMobile ? '6px 12px' : '4px 12px',
            fontSize: isMobile ? '1rem' : '0.9rem',
            fontWeight: 'bold',
            borderRadius: '0',
            alignSelf: isMobile ? 'flex-start' : 'auto'
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
          marginBottom: '20px',
          borderRadius: '0'
        }}>
          {error instanceof Error ? error.message : t.messages?.error || 'Error al cargar los mensajes'}
        </div>
      )}

      {!hasMessages ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '40px 20px' : '60px 20px',
          background: '#f9f9f9',
          borderRadius: '0'
        }}>
          <p style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', color: '#666', marginBottom: '10px' }}>
            {t.messages?.noMessages || 'No tienes mensajes aún'}
          </p>
          <p style={{ color: '#888' }}>
            {t.messages?.noMessagesDesc || 'Cuando alguien te contacte desde tu perfil público, los mensajes aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '20px' }}>
            {paginatedMessages.map((msg) => (
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
                isMobile={isMobile}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isMobile={isMobile}
            />
          )}

          {/* Info de mensajes */}
          <p style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.9rem',
            marginTop: '20px'
          }}>
            Mostrando {paginatedMessages.length} de {messages.length} mensajes
          </p>
        </>
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
  t,
  isMobile 
}: any) => {
  const isPending = isProcessing

  return (
    <div
      style={{
        border: `1px solid ${message.is_read ? '#eaeaea' : '#4f46e5'}`,
        padding: isMobile ? '15px' : '20px',
        background: message.is_read ? 'white' : '#f0f7ff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        opacity: isPending ? 0.7 : 1,
        transition: 'all 0.2s',
        borderRadius: '0'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '10px' : '0',
        marginBottom: '15px'
      }}>
        <div>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: isMobile ? '1.1rem' : '1rem' }}>
            {message.sender_name}
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: isMobile ? '0.9rem' : '0.85rem' }}>
            {message.sender_email}
          </p>
        </div>
        <p style={{ 
          margin: 0, 
          fontSize: isMobile ? '0.85rem' : '0.8rem', 
          color: '#888',
          alignSelf: isMobile ? 'flex-start' : 'center'
        }}>
          {new Date(message.created_at).toLocaleString()}
        </p>
      </div>

      <div style={{
        padding: isMobile ? '12px' : '15px',
        background: 'white',
        marginBottom: '15px',
        border: '1px solid #eee',
        borderRadius: '0'
      }}>
        <p style={{ 
          margin: 0, 
          whiteSpace: 'pre-wrap', 
          lineHeight: '1.5',
          fontSize: isMobile ? '0.95rem' : '1rem'
        }}>
          {message.message}
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: isMobile ? 'stretch' : 'flex-end',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {!message.is_read && (
          <button
            onClick={() => onMarkAsRead(message.id)}
            disabled={isPending}
            style={{
              padding: isMobile ? '12px' : '8px 16px',
              background: isPending ? '#ccc' : '#4f46e5',
              color: 'white',
              border: 'none',
              fontSize: isMobile ? '1rem' : '0.9rem',
              fontWeight: 'bold',
              cursor: isPending ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              borderRadius: '0',
              width: isMobile ? '100%' : 'auto'
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
            padding: isMobile ? '12px' : '8px 16px',
            background: isPending ? '#ccc' : '#ef4444',
            color: 'white',
            border: 'none',
            fontSize: isMobile ? '1rem' : '0.9rem',
            fontWeight: 'bold',
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            borderRadius: '0',
            width: isMobile ? '100%' : 'auto'
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