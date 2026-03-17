'use client'

import { useState, useCallback, useMemo } from 'react'
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
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  console.log('📝 t.profile:', t.profile)
  console.log('📝 t.profile?.sales:', t.profile?.sales)

  // Textos de ventas con fallback
  const salesText = t.profile?.sales 

  // Query para obtener datos del creador
  const { data: creatorData, isLoading: loadingCreator, error: creatorError } = useQuery({
    queryKey: ['creator', user?.email],
    queryFn: async () => {
      if (!user?.email) return null
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      if (error) {
        console.error('❌ Error buscando creador:', error)
        return null
      }
      return data
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  })

  // Query para obtener obras
  const { data: works = [], isLoading: loadingWorks } = useQuery({
    queryKey: ['works', creatorData?.creator_id],
    queryFn: async () => {
      if (!creatorData?.creator_id) return []
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('creator_id', creatorData.creator_id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error buscando obras:', error)
        return []
      }
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
    if (!creatorData?.creator_id) return null

    console.log('💰 Buscando ventas para creator:', creatorData.creator_id)

    // Obtener todas las compras completadas del creador
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('creator_id', creatorData.creator_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error cargando ventas:', error)
      return null
    }

    console.log('📦 Ventas encontradas:', purchases?.length || 0)

    // Si no hay ventas, devolver estructura vacía
    if (!purchases || purchases.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        platformFees: 0,
        creatorEarnings: 0,
        salesByWork: [],
        monthlySales: [],
        recentSales: []
      }
    }

    // Calcular estadísticas (con valores por defecto)
    const totalSales = purchases.length
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0)
    
    // Usar platform_fee si existe, si no calcularlo
    const platformFees = purchases.reduce((sum, p) => 
      sum + (p.platform_fee || (p.amount * 0.25) || 0), 0)
    
    const creatorEarnings = purchases.reduce((sum, p) => 
      sum + (p.creator_earnings || (p.amount * 0.75) || 0), 0)

    // Ventas por obra (agrupando por work_id)
    const salesByWorkMap = new Map()
    
    purchases.forEach(p => {
      const workId = p.work_id
      if (!salesByWorkMap.has(workId)) {
        salesByWorkMap.set(workId, {
          work_id: workId,
          work_title: p.work_title || 'Obra sin título',
          count: 0,
          revenue: 0
        })
      }
      const work = salesByWorkMap.get(workId)
      work.count += 1
      work.revenue += p.amount || 0
    })
    
    const salesByWork = Array.from(salesByWorkMap.values())

    // Ventas por mes (últimos 6 meses)
    const last6Months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toLocaleDateString('es', { month: 'short', year: 'numeric' })
      
      const monthPurchases = purchases.filter(p => {
        const pDate = new Date(p.created_at)
        return pDate.getMonth() === date.getMonth() && 
               pDate.getFullYear() === date.getFullYear()
      })

      last6Months.push({
        month: monthStr,
        sales: monthPurchases.length,
        revenue: monthPurchases.reduce((sum, p) => sum + (p.amount || 0), 0)
      })
    }

    // Últimas 5 ventas
    const recentSales = purchases.slice(0, 5).map(p => ({
      id: p.id,
      work_title: p.work_title || 'Obra sin título',
      amount: p.amount,
      buyer_email: p.buyer_email,
      created_at: p.created_at
    }))

    return {
      totalSales,
      totalRevenue,
      platformFees,
      creatorEarnings,
      salesByWork,
      monthlySales: last6Months,
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
      if (creatorData) {
        await supabase
          .from('profile_visits')
          .delete()
          .eq('creator_id', creatorData.creator_id)
        
        for (const work of works) {
          if (work.file_url) {
            const filePath = work.file_url.split('/').pop()
            if (filePath) {
              await supabase.storage
                .from('works')
                .remove([filePath])
            }
          }
          await supabase
            .from('work_visits')
            .delete()
            .eq('work_id', work.id)
        }
        
        await supabase
          .from('contact_messages')
          .delete()
          .eq('creator_id', creatorData.creator_id)
        
        await supabase
          .from('works')
          .delete()
          .eq('creator_id', creatorData.creator_id)
        
        await supabase
          .from('creators')
          .delete()
          .eq('email', user?.email)
      }
      
      await signOut()
    },
    onSuccess: () => {
      router.push('/')
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
          👤 {t.profile?.title || 'Mi Perfil'}
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
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
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
          👤 {t.profile?.title || 'Mi Perfil'}
        </h1>
        <button
          onClick={signOut}
          style={{
            padding: '8px 16px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {t.auth?.logout || 'Cerrar sesión'}
        </button>
      </div>

      {/* Información del creador */}
      <div style={{
        border: '1px solid #eaeaea',
        padding: '25px',
        marginBottom: '30px',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
          {t.profile?.personalInfo || 'Información personal'}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div>
            <strong>{t.profile?.personalInfo || 'Nombre completo'}:</strong> {fullName}
          </div>
          <div>
            <strong>Email:</strong> {creatorData.email}
          </div>
          <div>
            <strong>{t.work?.country || 'País'}:</strong> {creatorData.country_name} ({creatorData.country_code})
          </div>
          <div>
            <strong>{t.profile?.stats?.firstWork || 'Región'}:</strong> {creatorData.region}
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f0f7ff'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            🆔 {t.profile?.yourCreatorId || 'Tu Creator ID'}:
          </p>
          <code style={{
            background: '#333',
            color: '#0f0',
            padding: '10px',
            fontSize: '1.2rem',
            display: 'inline-block'
          }}>
            {creatorData.creator_id}
          </code>
        </div>
      </div>

      {/* Dashboard de Estadísticas Generales */}
      <div style={{
        background: 'white',
        padding: '20px',
        marginBottom: '30px',
        border: '1px solid #eaeaea'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>📊 {t.profile?.stats?.mostViewed || 'Estadísticas'}</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>
              {stats?.profileVisits || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>{t.profile?.stats?.profileVisits || 'Visitas al perfil'}</div>
          </div>
          
          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>
              {stats?.totalMessages || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>{t.profile?.stats?.totalMessages || 'Mensajes totales'}</div>
          </div>
          
          <div style={{
            background: (stats?.unreadMessages || 0) > 0 ? '#fff5f5' : '#f5f5f5',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: (stats?.unreadMessages || 0) > 0 ? '#dc2626' : '#4f46e5' 
            }}>
              {stats?.unreadMessages || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>{t.profile?.stats?.unreadMessages || 'No leídos'}</div>
          </div>
        </div>

        {/* Estadísticas por obra */}
        <h4 style={{ marginBottom: '15px' }}>{t.profile?.stats?.mostViewed || 'Obras más vistas'}</h4>
        <div style={{ display: 'grid', gap: '10px' }}>
          {worksStats
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5)
            .map(work => (
              <div key={work.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                background: '#f9f9f9'
              }}>
                <span>{work.title}</span>
                <span style={{
                  background: '#4f46e5',
                  color: 'white',
                  padding: '2px 8px',
                  fontSize: '0.8rem'
                }}>
                  {work.visits} {work.visits === 1 ? (t.work?.visits?.singular || 'visita') : (t.work?.visits?.plural || 'visitas')}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* 📊 ESTADÍSTICAS DE VENTAS */}
{loadingSales ? (
  <div style={{ textAlign: 'center', padding: '20px' }}>{t.search?.searching || 'Cargando...'}</div>
) : salesStats && salesStats.totalSales > 0 ? (
  <div style={{
    background: 'white',
    padding: '20px',
    marginBottom: '30px',
    border: '1px solid #eaeaea'
  }}>
    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{salesText.title}</h3>
    
    {/* Tarjetas de resumen */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '15px',
      marginBottom: '25px'
    }}>
      <div style={{
        background: '#f0f7ff',
        padding: '15px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>
          {salesStats.totalSales}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.totalSales}</div>
      </div>
      
      <div style={{
        background: '#f0f7ff',
        padding: '15px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>
          ${salesStats.totalRevenue.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.grossRevenue}</div>
      </div>
      
      <div style={{
        background: '#fff5f5',
        padding: '15px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
          ${salesStats.platformFees.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.platformFee}</div>
      </div>
      
      <div style={{
        background: '#e8f5e8',
        padding: '15px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>
          ${salesStats.creatorEarnings.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>{salesText.earnings}</div>
      </div>
    </div>

    {/* Ventas por obra */}
    {salesStats.salesByWork && salesStats.salesByWork.length > 0 && (
      <>
        <h4 style={{ marginBottom: '15px' }}>{salesText.byWork}</h4>
        <div style={{ display: 'grid', gap: '10px', marginBottom: '25px' }}>
          {salesStats.salesByWork
            .sort((a: any, b: any) => b.revenue - a.revenue)
            .map((work: any) => (
              <div key={work.work_id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                background: '#f9f9f9'
              }}>
                <span style={{ fontWeight: 500 }}>{work.work_title}</span>
                <div>
                  <span style={{
                    background: '#4f46e5',
                    color: 'white',
                    padding: '2px 8px',
                    fontSize: '0.8rem',
                    marginRight: '8px'
                  }}>
                    {work.count} {work.count === 1 ? salesText.sale : salesText.sales}
                  </span>
                  <span style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '2px 8px',
                    fontSize: '0.8rem'
                  }}>
                    ${work.revenue.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </>
    )}

    {/* Ventas mensuales */}
    {salesStats.monthlySales && salesStats.monthlySales.length > 0 && (
      <>
        <h4 style={{ marginBottom: '15px' }}>{salesText.byMonth}</h4>
        <div style={{ display: 'grid', gap: '10px', marginBottom: '25px' }}>
          {salesStats.monthlySales.map((month: any) => (
            <div key={month.month} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              background: '#f9f9f9'
            }}>
              <span style={{ fontWeight: 'bold' }}>{month.month}</span>
              <div>
                <span style={{
                  background: '#4f46e5',
                  color: 'white',
                  padding: '2px 8px',
                  fontSize: '0.8rem',
                  marginRight: '8px'
                }}>
                  {month.sales} {month.sales === 1 ? salesText.sale : salesText.sales}
                </span>
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '2px 8px',
                  fontSize: '0.8rem'
                }}>
                  ${month.revenue.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    {/* Últimas ventas */}
    {salesStats.recentSales && salesStats.recentSales.length > 0 && (
      <>
        <h4 style={{ marginBottom: '15px' }}>{salesText.recent}</h4>
        <div style={{ display: 'grid', gap: '10px' }}>
          {salesStats.recentSales.map((sale: any) => (
            <div key={sale.id} style={{
              padding: '10px',
              background: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold' }}>{sale.work_title}</span>
                <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>${sale.amount?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                <span>{salesText.buyer}: {sale.buyer_email}</span>
                <span>{new Date(sale.created_at).toLocaleDateString()}</span>
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
    textAlign: 'center'
  }}>
    <h3 style={{ marginTop: 0, marginBottom: '10px' }}>{salesText.title}</h3>
    <p style={{ color: '#666' }}>{salesText.noSales}</p>
  </div>
)}

      {/* Acciones rápidas */}
      <div style={{
        display: 'flex',
        gap: '15px',
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
            fontWeight: 'bold'
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
            fontWeight: 'bold'
          }}
        >
          👁️ {t.profile?.actions?.viewPublic || 'Ver perfil público'}
        </Link>
      </div>

      {/* Lista de obras */}
      <h2 style={{ marginBottom: '20px' }}>📚 {t.profile?.myWorks || 'Mis obras registradas'}</h2>

      {works.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#f9f9f9',
          marginBottom: '30px'
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
              fontWeight: 'bold'
            }}
          >
            {t.profile?.registerFirst || 'Registrar mi primera obra'}
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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

      {/* Sección de peligro */}
      <div style={{
        marginTop: '20px',
        padding: '20px',
        background: '#fff5f5',
        border: '1px solid #ffcdd2'
      }}>
        <h3 style={{ color: '#c62828', marginBottom: '10px' }}>⚠️ {t.profile?.dangerZone || 'Zona de peligro'}</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          {t.profile?.deleteWarning || 'Eliminar tu cuenta es irreversible. Se borrarán todos tus datos, incluyendo obras, estadísticas y mensajes.'}
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '12px 24px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {t.profile?.deleteButton || 'Eliminar mi cuenta permanentemente'}
          </button>
        ) : (
          <div style={{
            background: 'white',
            padding: '20px',
            border: '1px solid #ffcdd2'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '15px', color: '#c62828' }}>
              {t.profile?.confirmDelete || '¿Estás completamente seguro? Esta acción no se puede deshacer.'}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
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
                  cursor: deletingAccount ? 'not-allowed' : 'pointer'
                }}
              >
                {deletingAccount ? (t.search?.searching || 'Eliminando...') : (t.profile?.confirmYes || 'Sí, eliminar mi cuenta')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#666',
                  border: '1px solid #ccc',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                {t.profile?.cancel || 'Cancelar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}