'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import Pagination from '@/components/Pagination'

export default function StatsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const [creatorData, setCreatorData] = useState<any>(null)
  const [stats, setStats] = useState({
    profileVisits: 0,
    totalWorks: 0,
    worksWithPrice: 0,
    totalMessages: 0,
    unreadMessages: 0,
    totalSales: 0,
    totalRevenue: 0,
    creatorEarnings: 0,
    worksStats: [] as any[],
    monthlyVisits: [] as any[],
    topWorks: [] as any[]
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [topWorksPage, setTopWorksPage] = useState(1)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const itemsPerPage = 10
  const topWorksPerPage = 5

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (user?.email) {
      loadCreatorData()
    }
  }, [user, loading])

  const loadCreatorData = async () => {
    try {
      const { data: creator } = await supabase
        .from('creators')
        .select('*')
        .eq('email', user?.email)
        .single()

      if (!creator) {
        router.push('/register')
        return
      }

      setCreatorData(creator)
      await loadStats(creator.creator_id)
    } catch (error) {
      console.error('Error loading creator data:', error)
    }
  }

  const loadStats = async (creatorId: string) => {
    setLoadingStats(true)
    try {
      const { count: profileVisits } = await supabase
        .from('profile_visits')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)

      const { data: works } = await supabase
        .from('works')
        .select('*')
        .eq('creator_id', creatorId)

      const totalWorks = works?.length || 0
      const worksWithPrice = works?.filter(w => w.price && w.price > 0).length || 0

      const { count: totalMessages } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)

      const { count: unreadMessages } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('is_read', false)

      const { data: purchases } = await supabase
        .from('purchases')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('status', 'completed')

      const totalSales = purchases?.length || 0
      const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      const creatorEarnings = totalRevenue * 0.75

      const worksStats = await Promise.all(
        (works || []).map(async (work) => {
          const { count: visits } = await supabase
            .from('work_visits')
            .select('*', { count: 'exact', head: true })
            .eq('work_id', work.id)

          const sales = purchases?.filter(p => p.work_id === work.id) || []
          const revenue = sales.reduce((sum, s) => sum + (s.amount || 0), 0)

          return {
            ...work,
            visits: visits || 0,
            sales: sales.length,
            revenue
          }
        })
      )

      const topWorks = [...worksStats].sort((a, b) => b.visits - a.visits)
      const monthlyVisits = await loadMonthlyVisits(creatorId)

      setStats({
        profileVisits: profileVisits || 0,
        totalWorks,
        worksWithPrice,
        totalMessages: totalMessages || 0,
        unreadMessages: unreadMessages || 0,
        totalSales,
        totalRevenue,
        creatorEarnings,
        worksStats,
        monthlyVisits,
        topWorks
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadMonthlyVisits = async (creatorId: string) => {
    const months = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const { count } = await supabase
        .from('profile_visits')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())

      months.push({
        month: date.toLocaleDateString('es-ES', { month: 'short' }),
        visits: count || 0
      })
    }
    
    return months
  }

  const totalPages = Math.ceil(stats.worksStats.length / itemsPerPage)
  const paginatedWorks = stats.worksStats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalTopWorksPages = Math.ceil(stats.topWorks.length / topWorksPerPage)
  const paginatedTopWorks = stats.topWorks.slice(
    (topWorksPage - 1) * topWorksPerPage,
    topWorksPage * topWorksPerPage
  )

  const handleTopWorksPageChange = (page: number) => {
    setTopWorksPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading || loadingStats) {
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
        <p>{t.stats?.loading || 'Cargando estadísticas...'}</p>
      </div>
    )
  }

  if (!creatorData) {
    return null
  }

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "40px auto", 
      padding: isMobile ? "0 15px" : "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: isMobile ? "1.8rem" : "2rem", 
            margin: 0,
            background: "linear-gradient(135deg, #4f46e5, #10b981)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            📊 {t.stats?.title || 'Estadísticas'}
          </h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            {creatorData.full_first_name} {creatorData.full_last_name} • ID: {creatorData.creator_id}
          </p>
        </div>
        
        <Link
          href="/profile"
          style={{
            padding: '8px 16px',
            background: '#666',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          ← {t.stats?.backToProfile || 'Volver al perfil'}
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard
          title={t.stats?.profileVisits || 'Visitas al perfil'}
          value={stats.profileVisits}
          icon="👁️"
          color="#4f46e5"
          isMobile={isMobile}
        />
        <StatCard
          title={t.stats?.registeredWorks || 'Obras registradas'}
          value={stats.totalWorks}
          subValue={`${stats.worksWithPrice} ${t.stats?.withPrice || 'con precio'}`}
          icon="🎨"
          color="#10b981"
          isMobile={isMobile}
        />
        <StatCard
          title={t.stats?.messages || 'Mensajes'}
          value={stats.totalMessages}
          subValue={`${stats.unreadMessages} ${t.stats?.unread || 'no leídos'}`}
          icon="📬"
          color="#f59e0b"
          isMobile={isMobile}
        />
        <StatCard
          title={t.stats?.sales || 'Ventas'}
          value={stats.totalSales}
          icon="💰"
          color="#ef4444"
          isMobile={isMobile}
        />
      </div>

      {/* Tarjetas de ingresos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <RevenueCard
          title={t.stats?.grossRevenue || 'Ingresos brutos'}
          amount={stats.totalRevenue}
          icon="💵"
          color="#4f46e5"
          isMobile={isMobile}
        />
        <RevenueCard
          title={t.stats?.commission || 'Comisión (25%)'}
          amount={stats.totalRevenue * 0.25}
          icon="🏦"
          color="#dc2626"
          isMobile={isMobile}
        />
        <RevenueCard
          title={t.stats?.earnings || 'Tus ganancias (75%)'}
          amount={stats.creatorEarnings}
          icon="💰"
          color="#10b981"
          isMobile={isMobile}
        />
      </div>

      {/* Gráfico de visitas mensuales */}
      <div style={{
        background: 'white',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginBottom: '20px', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>📈 {t.stats?.monthlyVisits || 'Visitas mensuales'}</h2>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          height: '200px',
          marginTop: '20px'
        }}>
          {stats.monthlyVisits.map((month, index) => {
            const maxVisits = Math.max(...stats.monthlyVisits.map(m => m.visits), 1)
            const height = (month.visits / maxVisits) * 180
            
            return (
              <div key={index} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  width: '100%',
                  height: `${height}px`,
                  background: '#4f46e5',
                  borderRadius: '4px',
                  transition: 'height 0.3s',
                  minHeight: month.visits > 0 ? '4px' : '0'
                }} />
                <span style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', color: '#666' }}>
                  {month.month}
                </span>
                <span style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 'bold' }}>
                  {month.visits}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top obras más visitadas */}
      {stats.topWorks.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #eaeaea',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>🏆 {t.stats?.topWorks || 'Obras más visitadas'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paginatedTopWorks.map((work, index) => {
              const globalIndex = (topWorksPage - 1) * topWorksPerPage + index + 1
              return (
                <div key={work.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      background: '#4f46e5',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '0.8rem' : '0.9rem'
                    }}>
                      {globalIndex}
                    </span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: isMobile ? '0.9rem' : '1rem' }}>{work.title}</div>
                      {work.price && (
                        <div style={{ fontSize: '0.75rem', color: '#4f46e5' }}>${work.price}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#4f46e5', fontSize: isMobile ? '0.9rem' : '1rem' }}>{work.visits} {t.stats?.visits || 'visitas'}</div>
                    {work.sales > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{work.sales} {t.stats?.sales || 'ventas'}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {totalTopWorksPages > 1 && (
            <Pagination
              currentPage={topWorksPage}
              totalPages={totalTopWorksPages}
              onPageChange={handleTopWorksPageChange}
              isMobile={isMobile}
            />
          )}
        </div>
      )}

      {/* Tabla de todas las obras */}
      <div style={{
        background: 'white',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h2 style={{ marginBottom: '20px', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>📋 {t.stats?.worksDetail || 'Detalle por obra'}</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eaeaea' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t.stats?.work || 'Obra'}</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{t.stats?.visits || 'Visitas'}</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{t.stats?.sales || 'Ventas'}</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>{t.stats?.revenue || 'Ingresos'}</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{t.stats?.actions || 'Acciones'}</th>
                </tr>
            </thead>
            <tbody>
              {paginatedWorks.map((work) => (
                <tr key={work.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: isMobile ? '0.85rem' : '1rem' }}>{work.title}</div>
                      {work.price && (
                        <div style={{ fontSize: '0.7rem', color: '#4f46e5' }}>${work.price}</div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>{work.visits}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {work.sales > 0 ? (
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>{work.sales}</span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {work.revenue > 0 ? (
                      <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>${work.revenue.toFixed(2)}</span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <Link
                      href={`/work/${work.id}`}
                      style={{
                        padding: '4px 12px',
                        background: '#4f46e5',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: isMobile ? '0.7rem' : '0.8rem'
                      }}
                    >
                      {t.stats?.view || 'Ver'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isMobile={isMobile}
          />
        )}

        {stats.worksStats.length > itemsPerPage && (
          <p style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.8rem',
            marginTop: '15px'
          }}>
            Mostrando {paginatedWorks.length} de {stats.worksStats.length} {t.stats?.works || 'obras'}
          </p>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          table {
            font-size: 0.75rem;
          }
          th, td {
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  )
}

// Componentes auxiliares
function StatCard({ title, value, subValue, icon, color, isMobile }: any) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #eaeaea',
      borderRadius: '8px',
      padding: isMobile ? '15px' : '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ color: '#666', marginTop: '4px', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>{title}</div>
      {subValue && (
        <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: '#999', marginTop: '8px' }}>{subValue}</div>
      )}
    </div>
  )
}

function RevenueCard({ title, amount, icon, color, isMobile }: any) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #eaeaea',
      borderRadius: '8px',
      padding: isMobile ? '15px' : '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color }}>
        ${amount.toFixed(2)}
      </div>
      <div style={{ color: '#666', marginTop: '4px', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>{title}</div>
    </div>
  )
}