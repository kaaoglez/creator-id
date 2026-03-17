'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ContactModal from '@/components/ContactModal'
import { useLanguage } from '@/contexts/LanguageContext'
import WorkCard from '@/components/WorkCard'

export default function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
    })
  }, [params])

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
            fontWeight: "bold"
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
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <h1 style={{ 
        fontSize: "2.5rem", 
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
        padding: "25px",
        marginBottom: "30px",
        background: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <p><strong>🆔 Creator ID:</strong> {creator.creator_id}</p>
          <p><strong>🌍 {t.work?.country || "País"}:</strong> {creator.country_name} ({creator.country_code})</p>
          <p><strong>📅 {t.profile?.stats?.firstWork || "Miembro desde"}:</strong> {new Date(creator.created_at).toLocaleDateString()}</p>
        </div>
        
        <button
          onClick={() => setIsContactModalOpen(true)}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📧</span>
          {t.profile?.actions?.registerWork || "Contactar creador"}
        </button>
      </div>

      {/* Lista de obras */}
      <h2 style={{ marginBottom: "20px", fontSize: "1.8rem" }}>
        📚 {t.work?.creator || "Obras de"} {fullName}
      </h2>

      {works.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "40px",
          background: "#f9f9f9",
          color: "#666"
        }}>
          <p style={{ fontSize: "1.2rem" }}>
            {t.profile?.noWorks || "Este creador aún no ha registrado obras."}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {works.map((work) => (
            <WorkCard key={work.id} work={work} t={t} />
          ))}
        </div>
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