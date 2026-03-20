'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ContactModal from '@/components/ContactModal'
import { useLanguage } from '@/contexts/LanguageContext'
import WorkCardUnified from '@/components/WorkCardUnified'
import Pagination from '@/components/Pagination'

export default function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const itemsPerPage = 6 // 6 obras por página (2 filas de 3)
  const { t } = useLanguage()

  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
    })
  }, [params])

  // Detectar tamaño de pantalla para responsive
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

  // Query para obtener datos del creador
  const { data: creator, isLoading: loadingCreator, error: creatorError } = useQuery({
    queryKey: ['creator', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("creator_id", id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })

  // Query para obtener obras del creador
  const { data: works = [], isLoading: loadingWorks } = useQuery({
    queryKey: ['works', id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase
        .from("works")
        .select("*")
        .eq("creator_id", id)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Resetear página cuando cambian las obras
  useEffect(() => {
    setCurrentPage(1)
  }, [works.length])

  // Registrar visita (efecto separado, no bloqueante)
  useEffect(() => {
    if (creator) {
      supabase
        .from('profile_visits')
        .insert([{ 
          creator_id: creator.creator_id,
          visitor_ip: 'anon'
        }])
        .then()
    }
  }, [creator])

  // Paginación
  const totalPages = Math.ceil(works.length / itemsPerPage)
  const paginatedWorks = works.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loadingCreator || loadingWorks) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
        <div style={{
          border: "3px solid #f3f3f3",
          borderTop: "3px solid #4f46e5",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          animation: "spin 1s linear infinite",
          margin: "20px auto"
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p>{t.search?.searching || "Cargando..."}</p>
      </div>
    )
  }

  if (creatorError || !creator) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", color: "#333", marginBottom: "20px" }}>🔍 {t.search?.noResults || "Creador no encontrado"}</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          {t.search?.noResults || "No existe un creador con el ID"}: <strong>{id}</strong>
        </p>
        <Link 
          href="/" 
          style={{
            padding: "10px 20px",
            background: "#4f46e5",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
            borderRadius: "4px"
          }}
        >
          {t.nav?.home || "Volver al inicio"}
        </Link>
      </div>
    )
  }

  // Nombre completo para mostrar
  const fullName = creator.full_first_name && creator.full_last_name
    ? `${creator.full_first_name} ${creator.full_last_name}`
    : `${creator.full_first_name || ''} ${creator.full_last_name || ''}`.trim();

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "40px auto", 
      padding: isMobile ? "0 15px" : "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      <h1 style={{ 
        fontSize: isMobile ? "2rem" : "2.5rem", 
        marginBottom: "20px",
        background: "linear-gradient(135deg, #4f46e5, #10b981)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        {fullName}
      </h1>

      {/* Información del creador */}
      <div style={{
        border: "1px solid #eaeaea",
        padding: isMobile ? "20px" : "25px",
        marginBottom: "30px",
        background: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '20px',
        borderRadius: '8px'
      }}>
        <div>
          <p style={{ marginBottom: '8px' }}><strong>🆔 Creator ID:</strong> {creator.creator_id}</p>
          <p style={{ marginBottom: '8px' }}><strong>🌍 {t.work?.country || "País"}:</strong> {creator.country_name} ({creator.country_code})</p>
          <p style={{ marginBottom: '8px' }}><strong>📅 {t.profile?.stats?.firstWork || "Miembro desde"}:</strong> {new Date(creator.created_at).toLocaleDateString()}</p>
        </div>
        
        <button
          onClick={() => setIsContactModalOpen(true)}
          style={{
            padding: isMobile ? '12px 20px' : '12px 24px',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            border: 'none',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '4px',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          <span>📧</span>
          {t.profile?.actions?.contact || "Contactar creador"}
        </button>
      </div>

      {/* Lista de obras */}
      <h2 style={{ marginBottom: "20px", fontSize: isMobile ? "1.5rem" : "1.8rem" }}>
        📚 {t.work?.creator || "Obras de"} {fullName}
      </h2>

      {works.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "#f9f9f9",
          color: "#666",
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: isMobile ? "1.1rem" : "1.2rem" }}>
            {t.profile?.noWorks || "Este creador aún no ha registrado obras."}
          </p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {paginatedWorks.map((work) => (
              <WorkCardUnified
                key={work.id}
                work={work}
                showActions={false}
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

          {/* Info de obras */}
          <p style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.9rem',
            marginTop: '20px'
          }}>
            Mostrando {paginatedWorks.length} de {works.length} obras
          </p>
        </>
      )}

      <ContactModal
        creatorId={creator.creator_id}
        creatorName={fullName}
        creatorEmail={creator.email}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  )
}