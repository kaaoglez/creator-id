'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import WorkCard from '@/components/WorkCard'
import { useLanguage } from '@/contexts/LanguageContext'
import Pagination from '@/components/Pagination'

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { t, language } = useLanguage()

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

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
    noSales: "Aún no tienes ventas.",
    sale: "venta",
    sales: "ventas",
    buyer: "Comprador",
    date: "Fecha",
    amount: "Monto",
    status: "Estado"
  }

  const { data: creatorData, isLoading: loadingCreator, error: creatorError } = useQuery({
    queryKey: ['creator', user?.email],
    queryFn: async () => {
      if (!user?.email) return null
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      if (error) return null
      return data
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  })

  const { data: works = [], isLoading: loadingWorks } = useQuery({
    queryKey: ['works', creatorData?.creator_id],
    queryFn: async () => {
      if (!creatorData?.creator_id) return []
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('creator_id', creatorData.creator_id)
        .order('created_at', { ascending: false })
      if (error) return []
      return data || []
    },
    enabled: !!creatorData?.creator_id,
    staleTime: 5 * 60 * 1000,
  })

  const { data: stats = { profileVisits: 0, totalMessages: 0, unreadMessages: 0, worksStats: [] } } = useQuery({
    queryKey: ['stats', creatorData?.creator_id],
    queryFn: async () => {
      if (!creatorData?.creator_id) return null
      const [profileVisits, totalMessages, unreadMessages] = await Promise.all([
        supabase.from('profile_visits').select('*', { count: 'exact', head: true }).eq('creator_id', creatorData.creator_id).then(({ count }) => count || 0),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('creator_id', creatorData.creator_id).then(({ count }) => count || 0),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('creator_id', creatorData.creator_id).eq('is_read', false).then(({ count }) => count || 0),
      ])
      const worksStats = await Promise.all(works.map(async (work) => {
        const { count } = await supabase.from('work_visits').select('*', { count: 'exact', head: true }).eq('work_id', work.id)
        return { ...work, visits: count || 0 }
      }))
      return { profileVisits, totalMessages, unreadMessages, worksStats }
    },
    enabled: !!creatorData?.creator_id && works.length > 0,
    staleTime: 2 * 60 * 1000,
  })

  const { data: salesStats, isLoading: loadingSales } = useQuery({
    queryKey: ['sales', creatorData?.creator_id],
    queryFn: async () => {
      if (!creatorData?.creator_id) return null
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('creator_id', creatorData.creator_id)
        .order('created_at', { ascending: false })
      if (error) return null
      if (!purchases || purchases.length === 0) {
        return { totalSales: 0, totalRevenue: 0, platformFees: 0, creatorEarnings: 0, completedSales: 0, pendingSales: 0, failedSales: 0, salesByWork: [], recentSales: [] }
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
          acc[workId] = { work_id: workId, work_title: p.work_title || 'Obra sin título', total: 0, completed: 0, pending: 0, failed: 0, revenue: 0 }
        }
        acc[workId].total += 1
        if (p.status === 'completed') { acc[workId].completed += 1; acc[workId].revenue += p.amount || 0 }
        else if (p.status === 'pending') acc[workId].pending += 1
        else if (p.status === 'failed') acc[workId].failed += 1
        return acc
      }, {})
      const recentSales = purchases.slice(0, 5).map(p => ({ id: p.id, work_title: p.work_title || 'Obra sin título', amount: p.amount, buyer_email: p.buyer_email, status: p.status, created_at: p.created_at }))
      return { totalSales, totalRevenue, platformFees, creatorEarnings, completedSales, pendingSales, failedSales, salesByWork: Object.values(salesByWork), recentSales }
    },
    enabled: !!creatorData?.creator_id,
    staleTime: 2 * 60 * 1000,
  })

  const deleteWorkMutation = useMutation({
    mutationFn: async ({ workId, fileUrl }: { workId: string; fileUrl: string | null }) => {
      if (fileUrl) {
        const filePath = fileUrl.split('/').pop()
        if (filePath) await supabase.storage.from('works').remove([filePath])
      }
      const { error } = await supabase.from('works').delete().eq('id', workId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works', creatorData?.creator_id] })
      queryClient.invalidateQueries({ queryKey: ['stats', creatorData?.creator_id] })
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!creatorData) throw new Error('No creator data')
      await supabase.from('profile_visits').delete().eq('creator_id', creatorData.creator_id)
      for (const work of works) {
        if (work.file_url) {
          const filePath = work.file_url.split('/').pop()
          if (filePath) await supabase.storage.from('works').remove([filePath])
        }
        await supabase.from('work_visits').delete().eq('work_id', work.id)
      }
      await supabase.from('contact_messages').delete().eq('creator_id', creatorData.creator_id)
      await supabase.from('works').delete().eq('creator_id', creatorData.creator_id)
      await supabase.from('creators').delete().eq('creator_id', creatorData.creator_id)
      await signOut()
    },
    onSuccess: () => router.push('/'),
  })

  const handleDeleteWork = useCallback(async (workId: string, fileUrl: string | null) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta obra?')) return
    setDeleting(workId)
    try {
      await deleteWorkMutation.mutateAsync({ workId, fileUrl })
    } catch (error) {
      alert('Error al eliminar la obra')
    } finally {
      setDeleting(null)
    }
  }, [deleteWorkMutation])

  const handleDeleteAccount = useCallback(async () => {
    setDeletingAccount(true)
    try {
      await deleteAccountMutation.mutateAsync()
    } catch (error) {
      alert('Error al eliminar la cuenta')
    } finally {
      setDeletingAccount(false)
      setShowDeleteConfirm(false)
    }
  }, [deleteAccountMutation])

  const fullName = useMemo(() => 
    creatorData?.full_first_name && creatorData?.full_last_name
      ? `${creatorData.full_first_name} ${creatorData.full_last_name}`
      : `${creatorData?.first_name || ''} ${creatorData?.last_name || ''}`.trim()
  , [creatorData])

  const worksStats = useMemo(() => stats?.worksStats || [], [stats])

  const totalPages = Math.ceil(works.length / itemsPerPage)
  const paginatedWorks = works.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) return <div>Cargando...</div>
  if (!user) { router.push('/auth/login'); return null }
  if (loadingCreator) return <div>Cargando perfil...</div>
  if (creatorError) return <div>Error al cargar el perfil</div>
  if (!creatorData) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <h1>Mi Perfil</h1>
        <div style={{ background: '#f0f7ff', padding: '30px' }}>
          <p>⚡ Aún no tienes un Creator ID</p>
          <Link href="/register">Crear mi Creator ID</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "40px auto", padding: isMobile ? "0 15px" : "0 20px" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {creatorData?.avatar_url ? (
            <img src={creatorData.avatar_url} alt={fullName} style={{ width: isMobile ? '50px' : '60px', height: isMobile ? '50px' : '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4f46e5' }} />
          ) : (
            <div style={{ width: isMobile ? '50px' : '60px', height: isMobile ? '50px' : '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '20px' : '24px', color: 'white' }}>
              {creatorData?.full_first_name?.charAt(0) || '👤'}
            </div>
          )}
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', margin: 0, background: 'linear-gradient(135deg, #4f46e5, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mi Perfil</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : 'auto' }}>
          <Link href="/profile/edit" style={{ padding: isMobile ? '10px' : '8px 16px', background: '#4f46e5', color: 'white', textDecoration: 'none', fontWeight: 'bold', borderRadius: '4px', textAlign: 'center', flex: isMobile ? 1 : 'none' }}>✏️ Editar perfil</Link>
          <button onClick={signOut} style={{ padding: isMobile ? '10px' : '8px 16px', background: '#ff4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', textAlign: 'center', flex: isMobile ? 1 : 'none' }}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{ border: '1px solid #eaeaea', padding: isMobile ? '15px' : '25px', marginBottom: '30px', background: 'white' }}>
        <h2>Información personal</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '15px' }}>
          <div><strong>Nombre completo:</strong> {fullName}</div>
          <div><strong>Email:</strong> {creatorData.email}</div>
          {creatorData.phone && <div><strong>Teléfono:</strong> {creatorData.phone}</div>}
          <div><strong>País:</strong> {creatorData.country_name} ({creatorData.country_code})</div>
          <div><strong>Región:</strong> {creatorData.region}</div>
        </div>
        <div style={{ marginTop: '20px', padding: '15px', background: '#f0f7ff' }}>
          <p><strong>🆔 Tu Creator ID:</strong></p>
          <code style={{ background: '#333', color: '#0f0', padding: '8px 12px', display: 'inline-block' }}>{creatorData.creator_id}</code>
        </div>
      </div>

      <div style={{ background: 'white', padding: '20px', marginBottom: '30px', border: '1px solid #eaeaea' }}>
        <h3>📊 Estadísticas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
          <div style={{ background: '#f5f5f5', padding: '15px', textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>{stats?.profileVisits || 0}</div><div>Visitas al perfil</div></div>
          <div style={{ background: '#f5f5f5', padding: '15px', textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>{stats?.totalMessages || 0}</div><div>Mensajes totales</div></div>
          <div style={{ background: (stats?.unreadMessages || 0) > 0 ? '#fff5f5' : '#f5f5f5', padding: '15px', textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 'bold', color: (stats?.unreadMessages || 0) > 0 ? '#dc2626' : '#4f46e5' }}>{stats?.unreadMessages || 0}</div><div>No leídos</div></div>
        </div>
        <h4>📋 Estadísticas de Obras</h4>
        <div style={{ display: 'grid', gap: '10px' }}>
          {worksStats.sort((a, b) => b.visits - a.visits).slice(0, 5).map(work => (
            <div key={work.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f9f9f9' }}>
              <span>{work.title}</span>
              <span style={{ background: '#4f46e5', color: 'white', padding: '2px 8px' }}>{work.visits} {work.visits === 1 ? 'visita' : 'visitas'}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', flexDirection: isMobile ? 'column' : 'row', marginBottom: '30px' }}>
        <Link href="/works/new" style={{ flex: 1, padding: '15px', background: 'linear-gradient(135deg, #4f46e5, #10b981)', color: 'white', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>➕ Registrar nueva obra</Link>
        <Link href={`/${creatorData.creator_id}`} style={{ flex: 1, padding: '15px', background: '#666', color: 'white', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>👁️ Ver perfil público</Link>
      </div>

      <h2>📚 Mis obras registradas</h2>
      {works.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9' }}>
          <p>Aún no has registrado ninguna obra</p>
          <Link href="/works/new">Registrar mi primera obra</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            {paginatedWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                showActions={true}
                onDelete={(workId) => handleDeleteWork(workId, work.file_url)}
                t={t}
              />
            ))}
          </div>
          {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} isMobile={isMobile} />}
          <p style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>Mostrando {paginatedWorks.length} de {works.length} obras</p>
        </>
      )}

      <div style={{ marginTop: '40px', padding: '20px', background: '#fff5f5', border: '1px solid #ffcdd2' }}>
        <h3 style={{ color: '#c62828' }}>⚠️ Zona de peligro</h3>
        <p>Eliminar tu cuenta es irreversible. Se borrarán todos tus datos.</p>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '12px 24px', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}>Eliminar mi cuenta permanentemente</button>
        ) : (
          <div style={{ background: 'white', padding: '20px' }}>
            <p>¿Estás completamente seguro? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDeleteAccount} disabled={deletingAccount} style={{ padding: '10px 20px', background: deletingAccount ? '#ccc' : '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}>{deletingAccount ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '10px 20px', background: 'white', color: '#666', border: '1px solid #ccc', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}