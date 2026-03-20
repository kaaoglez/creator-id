'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import WorkCard from '@/components/WorkCard'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { t, language } = useLanguage()

  // Detectar tamaño de pantalla para responsive
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

  // Textos de ventas con fallback
  const salesText = t.profile?.sales || {
    title: "💰 Estadísticas de Ventas",
    totalSales: "Ventas totales",
    completedSales: "Completadas",
    pendingSales: "Pendientes",
    failedSales: "Fallidas",
    grossRevenue: "Ingresos brutos",
    platformFee: "Comisión (25%)",
    earnings: "Tus ganancias",
    byWork: "Ventas por obra",
    recent: "Últimas ventas",
    noSales: "Aún no tienes ventas. Cuando alguien compre tus obras, aparecerán aquí.",
    sale: "venta",
    sales: "ventas",
    buyer: "Comprador",
    date: "Fecha",
    amount: "Monto",
    status: "Estado"
  }

  // Query para obtener datos del creador
  const { data: creatorData, isLoading: loadingCreator, error: creatorError } = useQuery({
    queryKey: ['creator', user?.email],
    queryFn: async () => {
      if (!user?.email) return null
      console.log('🔍 Buscando creador con email:', user.email)
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      console.log('📦 Resultado creator:', { data, error })
      
      if (error) {
        console.error('❌ Error buscando creador:', error)
        return null
      }
      return data
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  })

  console.log('👤 creatorData:', creatorData)
  console.log('👤 loadingCreator:', loadingCreator)
  console.log('👤 creatorError:', creatorError)

  // Query para obtener obras
  const { data: works = [], isLoading: loadingWorks } = useQuery({
    queryKey: ['works', creatorData?.creator_id],
    queryFn: async () => {
      if (!creatorData?.creator_id) return []
      console.log('🔍 Buscando obras para creator_id:', creatorData.creator_id)
      
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('creator_id', creatorData.creator_id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error buscando obras:', error)
        return []
      }
      console.log('✅ Obras encontradas:', data?.length || 0)
      return data || []
    },
    enabled: !!creatorData?.creator_id,
    staleTime: 5 * 60 * 1000,
  })

  // Query para estadísticas generales
  const { data: stats = { profileVisits: 0, totalMessages: 0, unreadMessages: 0, worksStats: [] } } = useQuery({
    queryKey: ['stats', creatorData?.creator_id],
    queryFn: async () => {
      if (!creatorData?.creator_id) return null

      const [profileVisits, totalMessages, unreadMessages] = await Promise.all([
        supabase
          .from('profile_visits')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorData.creator_id)
          .then(({ count }) => count || 0),
        
        supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorData.creator_id)
          .then(({ count }) => count || 0),
        
        supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorData.creator_id)
          .eq('is_read', false)
          .then(({ count }) => count || 0),
      ])
      
      const worksStats = await Promise.all(
        works.map(async (work) => {
          const { count } = await supabase
            .from('work_visits')
            .select('*', { count: 'exact', head: true })
            .eq('work_id', work.id)
          return { ...work, visits: count || 0 }
        })
      )

      return {
        profileVisits,
        totalMessages,
        unreadMessages,
        worksStats
      }
    },
    enabled: !!creatorData?.creator_id && works.length > 0,
    staleTime: 2 * 60 * 1000,
  })

  // Query para estadísticas de ventas
  const { data: salesStats, isLoading: loadingSales } = useQuery({
    queryKey: ['sales', creatorData?.creator_id],
    queryFn: async () => {
      console.log('💰 INICIANDO QUERY DE VENTAS')
      console.log('👤 creatorData:', creatorData)
      console.log('🆔 creator_id:', creatorData?.creator_id)
      
      if (!creatorData?.creator_id) {
        console.log('❌ No hay creator_id, cancelando query')
        return null
      }

      console.log('💰 Buscando TODAS las ventas para creator:', creatorData.creator_id)

      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('creator_id', creatorData.creator_id)
        .order('created_at', { ascending: false })

      console.log('📦 Ventas encontradas:', purchases)
      console.log('❌ Error:', error)

      if (error) {
        console.error('❌ Error cargando ventas:', error)
        return null
      }

      if (!purchases || purchases.length === 0) {
        console.log('📭 No hay ventas para este creador')
        return {
          totalSales: 0,
          totalRevenue: 0,
          platformFees: 0,
          creatorEarnings: 0,
          completedSales: 0,
          pendingSales: 0,
          failedSales: 0,
          salesByWork: [],
          recentSales: []
        }
      }

      const completed = purchases.filter(p => p.status === 'completed')
      const pending = purchases.filter(p => p.status === 'pending')
      const failed = purchases.filter(p => p.status === 'failed')

      const totalSales = purchases.length
      const completedSales = completed.length
      const pendingSales = pending.length
      const failedSales = failed.length
      
      const totalRevenue = completed.reduce((sum, p) => sum + (p.amount || 0), 0)
      const platformFees = completed.reduce((sum, p) => sum + (p.amount * 0.25), 0)
      const creatorEarnings = completed.reduce((sum, p) => sum + (p.amount * 0.75), 0)

      const salesByWork = purchases.reduce((acc: any, p) => {
        const workId = p.work_id
        if (!acc[workId]) {
          acc[workId] = {
            work_id: workId,
            work_title: p.work_title || 'Obra sin título',
            total: 0,
            completed: 0,
            pending: 0,
            failed: 0,
            revenue: 0
          }
        }
        acc[workId].total += 1
        if (p.status === 'completed') {
          acc[workId].completed += 1
          acc[workId].revenue += p.amount || 0
        } else if (p.status === 'pending') {
          acc[workId].pending += 1
        } else if (p.status === 'failed') {
          acc[workId].failed += 1
        }
        return acc
      }, {})

      const recentSales = purchases.slice(0, 5).map(p => ({
        id: p.id,
        work_title: p.work_title || 'Obra sin título',
        amount: p.amount,
        buyer_email: p.buyer_email,
        status: p.status,
        created_at: p.created_at
      }))

      console.log('✅ Estadísticas calculadas:', {
        totalSales,
        completedSales,
        pendingSales,
        failedSales,
        totalRevenue,
        platformFees,
        creatorEarnings,
        salesByWork: Object.values(salesByWork),
        recentSales
      })

      return {
        totalSales,
        totalRevenue,
        platformFees,
        creatorEarnings,
        completedSales,
        pendingSales,
        failedSales,
        salesByWork: Object.values(salesByWork),
        recentSales
      }
    },
    enabled: !!creatorData?.creator_id,
    staleTime: 2 * 60 * 1000,
  })

  // Mutación para eliminar obra
  const deleteWorkMutation = useMutation({
    mutationFn: async ({ workId, fileUrl }: { workId: string; fileUrl: string | null }) => {
      if (fileUrl) {
        const filePath = fileUrl.split('/').pop()
        if (filePath) {
          await supabase.storage
            .from('works')
            .remove([filePath])
        }
      }

      const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', workId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works', creatorData?.creator_id] })
      queryClient.invalidateQueries({ queryKey: ['stats', creatorData?.creator_id] })
    },
  })

  // Mutación para eliminar cuenta
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      console.log('🚨 ===== INICIANDO ELIMINACIÓN DE CUENTA =====')
      console.log('👤 Usuario:', user)
      console.log('👤 creatorData:', creatorData)
      console.log('📦 works a eliminar:', works)
      
      if (!creatorData) {
        console.error('❌ No hay creatorData')
        throw new Error('No se encontraron datos del creador')
      }

      if (!user) {
        console.error('❌ No hay usuario autenticado')
        throw new Error('No hay usuario autenticado')
      }

      try {
        // 1. Eliminar visitas al perfil
        console.log('1️⃣ Eliminando profile_visits...')
        await supabase
          .from('profile_visits')
          .delete()
          .eq('creator_id', creatorData.creator_id)

        // 2. Eliminar obras y sus archivos
        console.log('2️⃣ Procesando obras...')
        for (const work of works) {
          console.log(`   Procesando obra: ${work.id} - ${work.title}`)
          
          // Eliminar archivo de storage si existe
          if (work.file_url) {
            const filePath = work.file_url.split('/').pop()
            if (filePath) {
              console.log(`   Eliminando archivo: ${filePath}`)
              await supabase.storage
                .from('works')
                .remove([filePath])
            }
          }
          
          // Eliminar visitas de la obra
          console.log(`   Eliminando work_visits para obra: ${work.id}`)
          await supabase
            .from('work_visits')
            .delete()
            .eq('work_id', work.id)
        }

        // 3. Eliminar mensajes de contacto
        console.log('3️⃣ Eliminando contact_messages...')
        await supabase
          .from('contact_messages')
          .delete()
          .eq('creator_id', creatorData.creator_id)

        // 4. Eliminar todas las obras
        console.log('4️⃣ Eliminando works...')
        await supabase
          .from('works')
          .delete()
          .eq('creator_id', creatorData.creator_id)

        // 5. Eliminar el registro del creador
        console.log('5️⃣ Eliminando creators...')
        await supabase
          .from('creators')
          .delete()
          .eq('creator_id', creatorData.creator_id)

        // 6. Cerrar sesión
        console.log('6️⃣ Cerrando sesión...')
        await signOut()
        
        console.log('✅ ===== ELIMINACIÓN COMPLETADA =====')
        
      } catch (error) {
        console.error('❌ Error durante la eliminación:', error)
        throw error
      }
    },
    onSuccess: () => {
      console.log('🎉 Cuenta eliminada exitosamente')
      router.push('/')
    },
    onError: (error: any) => {
      console.error('❌ Error en mutación:', error)
      alert('Error al eliminar la cuenta. Por favor contacta a soporte.')
    },
  })

  const handleDeleteWork = useCallback(async (workId: string, fileUrl: string | null) => {
    if (!confirm(t.messages?.confirmDelete || '¿Estás seguro de que quieres eliminar esta obra?')) return
    
    setDeleting(workId)
    try {
      await deleteWorkMutation.mutateAsync({ workId, fileUrl })
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(t.errors?.deleteError || 'Error al eliminar la obra')
    } finally {
      setDeleting(null)
    }
  }, [deleteWorkMutation, t])

  const handleDeleteAccount = useCallback(async () => {
    console.log('🖱️ Click en eliminar cuenta confirmado')
    setDeletingAccount(true)
    try {
      await deleteAccountMutation.mutateAsync()
    } catch (error) {
      console.error('Error al eliminar cuenta:', error)
      alert(t.errors?.deleteError || 'Error al eliminar la cuenta. Por favor contacta a soporte.')
    } finally {
      setDeletingAccount(false)
      setShowDeleteConfirm(false)
    }
  }, [deleteAccountMutation, t])

  const fullName = useMemo(() => 
    creatorData?.full_first_name && creatorData?.full_last_name
      ? `${creatorData.full_first_name} ${creatorData.full_last_name}`
      : `${creatorData?.first_name || ''} ${creatorData?.last_name || ''}`.trim()
  , [creatorData])

  const worksStats = useMemo(() => stats?.worksStats || [], [stats])

  // Estados de carga y error
  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <p>{t.search?.searching || 'Cargando...'}</p>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  if (loadingCreator) {
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
        <p>{t.search?.searching || 'Cargando perfil...'}</p>
      </div>
    )
  }

  if (creatorError) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>Error al cargar el perfil</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!creatorData) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #4f46e5, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {t.profile?.title || 'Mi Perfil'}
        </h1>
        
        <div style={{
          background: '#f0f7ff',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid #4f46e5'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>
            ⚡ {t.profile?.stats?.noCreatorId || 'Aún no tienes un Creator ID'}
          </p>
          <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
            {t.profile?.stats?.createOne || 'Para comenzar a registrar tus obras y tener un perfil público, necesitas crear tu Creator ID único.'}
          </p>
          
          <Link
            href="/register"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #4f46e5, #10b981)',
              color: 'white',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            {t.register?.button || 'Crear mi Creator ID'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "40px auto", 
      padding: isMobile ? "0 15px" : "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      {/* HEADER RESPONSIVE */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          {/* Foto al lado del título */}
          {creatorData?.avatar_url ? (
            <img
              src={creatorData.avatar_url}
              alt={fullName}
              style={{
                width: isMobile ? '50px' : '60px',
                height: isMobile ? '50px' : '60px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #4f46e5'
              }}
            />
          ) : (
            <div style={{
              width: isMobile ? '50px' : '60px',
              height: isMobile ? '50px' : '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '20px' : '24px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {creatorData?.full_first_name?.charAt(0) || '👤'}
            </div>
          )}
          <h1 style={{ 
            fontSize: isMobile ? '1.5rem' : '2rem', 
            margin: 0,
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {t.profile?.title || 'Mi Perfil'}
          </h1>
        </div>
        
        {/* BOTONES DE ACCIÓN RESPONSIVE */}
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          flexDirection: isMobile ? 'column' : 'row',
          width: isMobile ? '100%' : 'auto'
        }}>
          <Link
            href="/profile/edit"
            style={{
              padding: isMobile ? '10px' : '8px 16px',
              background: '#4f46e5',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 'bold',
              borderRadius: '4px',
              textAlign: 'center',
              flex: isMobile ? 1 : 'none'
            }}
          >
            ✏️ {t.profile?.editButton || 'Editar perfil'}
          </Link>
          <button
            onClick={signOut}
            style={{
              padding: isMobile ? '10px' : '8px 16px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '4px',
              textAlign: 'center',
              flex: isMobile ? 1 : 'none'
            }}
          >
            {t.auth?.logout || 'Cerrar sesión'}
          </button>
        </div>
      </div>

      {/* Información del creador - RESPONSIVE */}
      <div style={{
        border: '1px solid #eaeaea',
        padding: isMobile ? '15px' : '25px',
        marginBottom: '30px',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        borderRadius: '4px'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
          {t.profile?.personalInfo || 'Información personal'}
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
          gap: '15px' 
        }}>
          <div>
            <strong>{t.profile?.personalInfo || 'Nombre completo'}:</strong> {fullName}
          </div>
          <div>
            <strong>Email:</strong> {creatorData.email}
          </div>
          {creatorData.phone && (
            <div>
              <strong>Teléfono:</strong> {creatorData.phone}
            </div>
          )}
          <div>
            <strong>{t.work?.country || 'País'}:</strong> {creatorData.country_name} ({creatorData.country_code})
          </div>
          <div>
            <strong>Región:</strong> {creatorData.region}
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f0f7ff',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            🆔 {t.profile?.yourCreatorId || 'Tu Creator ID'}:
          </p>
          <code style={{
            background: '#333',
            color: '#0f0',
            padding: '8px 12px',
            fontSize: isMobile ? '1rem' : '1.2rem',
            display: 'inline-block',
            borderRadius: '4px',
            wordBreak: 'break-all'
          }}>
            {creatorData.creator_id}
          </code>
        </div>
      </div>

      {/* Dashboard de Estadísticas Generales - RESPONSIVE */}
      <div style={{
        background: 'white',
        padding: isMobile ? '15px' : '20px',
        marginBottom: '30px',
        border: '1px solid #eaeaea',
        borderRadius: '4px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>📊 {t.profile?.stats?.mostViewed || 'Estadísticas'}</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            textAlign: 'center',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: isMobile ? '1.8rem' : '2rem', fontWeight: 'bold', color: '#4f46e5' }}>
              {stats?.profileVisits || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>{t.profile?.stats?.profileVisits || 'Visitas al perfil'}</div>
          </div>
          
          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            textAlign: 'center',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: isMobile ? '1.8rem' : '2rem', fontWeight: 'bold', color: '#4f46e5' }}>
              {stats?.totalMessages || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>{t.profile?.stats?.totalMessages || 'Mensajes totales'}</div>
          </div>
          
          <div style={{
            background: (stats?.unreadMessages || 0) > 0 ? '#fff5f5' : '#f5f5f5',
            padding: '15px',
            textAlign: 'center',
            borderRadius: '4px'
          }}>
            <div style={{ 
              fontSize: isMobile ? '1.8rem' : '2rem', 
              fontWeight: 'bold', 
              color: (stats?.unreadMessages || 0) > 0 ? '#dc2626' : '#4f46e5' 
            }}>
              {stats?.unreadMessages || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>{t.profile?.stats?.unreadMessages || 'No leídos'}</div>
          </div>
        </div>

        {/* Estadísticas por obra */}
        <h4 style={{ marginBottom: '15px' }}>
          📋 {t.profile?.stats?.inventory || 'Estadísticas de Obras'}
        </h4>
        <div style={{ display: 'grid', gap: '10px' }}>
          {worksStats
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5)
            .map(work => (
              <div key={work.id} style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '8px' : '0',
                padding: '10px',
                background: '#f9f9f9',
                borderRadius: '4px'
              }}>
                <span>{work.title}</span>
                <span style={{
                  background: '#4f46e5',
                  color: 'white',
                  padding: '2px 8px',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  alignSelf: isMobile ? 'flex-start' : 'auto'
                }}>
                  {work.visits} {work.visits === 1 ? (t.work?.visits?.singular || 'visita') : (t.work?.visits?.plural || 'visitas')}
                </span>
              </div>
            ))}
        </div>
      </div>

     {/* 📊 ESTADÍSTICAS DE VENTAS - CON TODOS LOS ESTADOS */}
      {loadingSales ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>{t.search?.searching || 'Cargando...'}</div>
      ) : salesStats && salesStats.totalSales > 0 ? (
        <div style={{
          background: 'white',
          padding: isMobile ? '15px' : '20px',
          marginBottom: '30px',
          border: '1px solid #eaeaea',
          borderRadius: '4px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{salesText.title}</h3>
          
          {/* Tarjetas de resumen - RESPONSIVE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '15px',
            marginBottom: '25px'
          }}>
            <div style={{
              background: '#f0f7ff',
              padding: '15px',
              textAlign: 'center',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#4f46e5' }}>
                {salesStats.totalSales}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.totalSales}</div>
            </div>
            
            <div style={{
              background: '#f0f7ff',
              padding: '15px',
              textAlign: 'center',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#4f46e5' }}>
                {salesStats.completedSales}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.completedSales || 'Completadas'}</div>
            </div>
            
            <div style={{
              background: salesStats.pendingSales > 0 ? '#fff3cd' : '#f5f5f5',
              padding: '15px',
              textAlign: 'center',
              borderRadius: '4px'
            }}>
              <div style={{ 
                fontSize: isMobile ? '1.5rem' : '2rem', 
                fontWeight: 'bold', 
                color: salesStats.pendingSales > 0 ? '#856404' : '#4f46e5' 
              }}>
                {salesStats.pendingSales}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.pendingSales || 'Pendientes'}</div>
            </div>
            
            <div style={{
              background: salesStats.failedSales > 0 ? '#f8d7da' : '#f5f5f5',
              padding: '15px',
              textAlign: 'center',
              borderRadius: '4px'
            }}>
              <div style={{ 
                fontSize: isMobile ? '1.5rem' : '2rem', 
                fontWeight: 'bold', 
                color: salesStats.failedSales > 0 ? '#721c24' : '#4f46e5' 
              }}>
                {salesStats.failedSales}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.failedSales || 'Fallidas'}</div>
            </div>
          </div>

          {/* Ingresos (solo completadas) - RESPONSIVE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '15px',
            marginBottom: '25px'
          }}>
            <div style={{
              background: '#f0f7ff',
              padding: '15px',
              textAlign: 'center',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#4f46e5' }}>
                ${salesStats.totalRevenue.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.grossRevenue}</div>
            </div>
            
            <div style={{
              background: '#fff5f5',
              padding: '15px',
              textAlign: 'center',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#dc2626' }}>
                ${salesStats.platformFees.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.platformFee}</div>
            </div>
            
            <div style={{
              background: '#e8f5e8',
              padding: '15px',
              textAlign: 'center',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2e7d32' }}>
                ${salesStats.creatorEarnings.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.earnings}</div>
            </div>
          </div>

          {/* Ventas por obra - RESPONSIVE */}
          {salesStats.salesByWork && salesStats.salesByWork.length > 0 && (
            <>
              <h4 style={{ marginBottom: '15px' }}>{salesText.byWork}</h4>
              <div style={{ display: 'grid', gap: '10px', marginBottom: '25px' }}>
                {salesStats.salesByWork
                  .sort((a: any, b: any) => b.total - a.total)
                  .map((work: any) => (
                    <div key={work.work_id} style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      gap: isMobile ? '10px' : '0',
                      padding: '10px',
                      background: '#f9f9f9',
                      borderRadius: '4px'
                    }}>
                      <span style={{ fontWeight: 500 }}>{work.work_title}</span>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px',
                        flexWrap: 'wrap',
                        width: isMobile ? '100%' : 'auto'
                      }}>
                        {work.completed > 0 && (
                          <span style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '2px 8px',
                            fontSize: '0.8rem',
                            borderRadius: '4px'
                          }}>
                            ✅ {work.completed}
                          </span>
                        )}
                        {work.pending > 0 && (
                          <span style={{
                            background: '#fbbf24',
                            color: '#333',
                            padding: '2px 8px',
                            fontSize: '0.8rem',
                            borderRadius: '4px'
                          }}>
                            ⏳ {work.pending}
                          </span>
                        )}
                        {work.failed > 0 && (
                          <span style={{
                            background: '#ef4444',
                            color: 'white',
                            padding: '2px 8px',
                            fontSize: '0.8rem',
                            borderRadius: '4px'
                          }}>
                            ❌ {work.failed}
                          </span>
                        )}
                        <span style={{
                          background: '#4f46e5',
                          color: 'white',
                          padding: '2px 8px',
                          fontSize: '0.8rem',
                          borderRadius: '4px'
                        }}>
                          💰 ${work.revenue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Últimas ventas con estado - RESPONSIVE */}
          {salesStats.recentSales && salesStats.recentSales.length > 0 && (
            <>
              <h4 style={{ marginBottom: '15px' }}>{salesText.recent}</h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                {salesStats.recentSales.map((sale: any) => (
                  <div key={sale.id} style={{
                    padding: '10px',
                    background: '#f9f9f9',
                    borderRadius: '4px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between', 
                      marginBottom: '5px',
                      gap: isMobile ? '5px' : '0'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{sale.work_title}</span>
                      <span style={{ 
                        color: sale.status === 'completed' ? '#2e7d32' : 
                               sale.status === 'pending' ? '#856404' : '#c62828',
                        fontWeight: 'bold' 
                      }}>
                        {sale.status === 'completed' ? '✅ Completada' :
                         sale.status === 'pending' ? '⏳ Pendiente' : '❌ Fallida'}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between', 
                      fontSize: '0.8rem', 
                      color: '#666',
                      gap: isMobile ? '5px' : '0'
                    }}>
                      <span>{salesText.buyer}: {sale.buyer_email}</span>
                      <span>{salesText.amount}: ${sale.amount?.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px' }}>
                      {new Date(sale.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{
          background: 'white',
          padding: '20px',
          marginBottom: '30px',
          border: '1px solid #eaeaea',
          textAlign: 'center',
          borderRadius: '4px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>{salesText.title}</h3>
          <p style={{ color: '#666' }}>{salesText.noSales}</p>
        </div>
      )}

      {/* Acciones rápidas - RESPONSIVE */}
      <div style={{
        display: 'flex',
        gap: '15px',
        flexDirection: isMobile ? 'column' : 'row',
        marginBottom: '30px'
      }}>
        <Link
          href="/works/new"
          style={{
            flex: 1,
            padding: '15px',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            textAlign: 'center',
            textDecoration: 'none',
            fontWeight: 'bold',
            borderRadius: '4px'
          }}
        >
          ➕ {t.profile?.actions?.registerWork || 'Registrar nueva obra'}
        </Link>
        <Link
          href={`/${creatorData.creator_id}`}
          style={{
            flex: 1,
            padding: '15px',
            background: '#666',
            color: 'white',
            textAlign: 'center',
            textDecoration: 'none',
            fontWeight: 'bold',
            borderRadius: '4px'
          }}
        >
          👁️ {t.profile?.actions?.viewPublic || 'Ver perfil público'}
        </Link>
      </div>

      {/* Lista de obras - RESPONSIVE */}
      <h2 style={{ marginBottom: '20px' }}>📚 {t.profile?.myWorks || 'Mis obras registradas'}</h2>

      {works.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#f9f9f9',
          marginBottom: '30px',
          borderRadius: '4px'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            {t.profile?.noWorks || 'Aún no has registrado ninguna obra'}
          </p>
          <Link
            href="/works/new"
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #4f46e5, #10b981)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 'bold',
              borderRadius: '4px'
            }}
          >
            {t.profile?.registerFirst || 'Registrar mi primera obra'}
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {works.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              showActions={true}
              onDelete={(workId) => handleDeleteWork(workId, work.file_url)}
            />
          ))}
        </div>
      )}

      {/* Sección de peligro - RESPONSIVE */}
      <div style={{
        marginTop: '40px',
        padding: isMobile ? '15px' : '20px',
        background: '#fff5f5',
        border: '1px solid #ffcdd2',
        borderRadius: '4px'
      }}>
        <h3 style={{ color: '#c62828', marginBottom: '10px' }}>⚠️ {t.profile?.dangerZone || 'Zona de peligro'}</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          {t.profile?.deleteWarning || 'Eliminar tu cuenta es irreversible. Se borrarán todos tus datos, incluyendo obras, estadísticas y mensajes.'}
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => {
              console.log('Mostrar confirmación de eliminación')
              setShowDeleteConfirm(true)
            }}
            style={{
              padding: '12px 24px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '4px',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            {t.profile?.deleteButton || 'Eliminar mi cuenta permanentemente'}
          </button>
        ) : (
          <div style={{
            background: 'white',
            padding: isMobile ? '15px' : '20px',
            border: '1px solid #ffcdd2',
            borderRadius: '4px'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '15px', color: '#c62828' }}>
              {t.profile?.confirmDelete || '¿Estás completamente seguro? Esta acción no se puede deshacer.'}
            </p>
            
            {/* LISTA DE ELEMENTOS A ELIMINAR */}
            <p style={{ marginBottom: '20px', color: '#666' }}>
              {t.profile?.deleteItems || 'Se eliminarán:'}
              <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
                {t.profile?.deleteList?.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                )) || (
                  <>
                    <li>Tu perfil de creador</li>
                    <li>Todas tus obras registradas</li>
                    <li>Las imágenes de tus obras</li>
                    <li>Las visitas a tu perfil y obras</li>
                    <li>Los mensajes de contacto</li>
                    <li>Tu cuenta de usuario</li>
                  </>
                )}
              </ul>
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                style={{
                  padding: '10px 20px',
                  background: deletingAccount ? '#ccc' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: deletingAccount ? 'not-allowed' : 'pointer',
                  borderRadius: '4px',
                  flex: isMobile ? 1 : 'none'
                }}
              >
                {deletingAccount ? 'Eliminando...' : (t.profile?.confirmYes || 'Sí, eliminar mi cuenta')}
              </button>
              <button
                onClick={() => {
                  console.log('Cancelar eliminación')
                  setShowDeleteConfirm(false)
                }}
                disabled={deletingAccount}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#666',
                  border: '1px solid #ccc',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  flex: isMobile ? 1 : 'none'
                }}
              >
                {t.profile?.cancel || 'Cancelar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estilos responsive globales */}
      <style>{`
        @media (max-width: 768px) {
          .profile-container {
            padding: 0 10px;
          }
          h1 {
            font-size: 1.5rem;
          }
          h2 {
            font-size: 1.3rem;
          }
          h3 {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  )
}