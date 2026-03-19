'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { debounce } from 'lodash'

// Mapa de países (mismo que en search)
const countryMap: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  ES: "Spain",
  AR: "Argentina",
  CO: "Colombia",
  PE: "Peru",
  CL: "Chile",
};

export default function HomePage() {
  const { t, language } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({ creators: 0, works: 0, countries: 0 })
  const [recentWorks, setRecentWorks] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Obtener estadísticas generales
        const { count: creators } = await supabase
          .from('creators')
          .select('*', { count: 'exact', head: true })
        
        const { count: works } = await supabase
          .from('works')
          .select('*', { count: 'exact', head: true })
        
        const { data: countries } = await supabase
          .from('creators')
          .select('country_code')

        const uniqueCountries = new Set(countries?.map(c => c.country_code)).size

        // Obtener obras recientes con datos del creador
        const { data: works_data } = await supabase
          .from('works')
          .select(`
            *,
            creators (
              full_first_name,
              full_last_name,
              avatar_url,
              country_code
            )
          `)
          .order('created_at', { ascending: false })
          .limit(6)

        setStats({
          creators: creators || 0,
          works: works || 0,
          countries: uniqueCountries || 0
        })

        setRecentWorks(works_data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  // Auto-slide del carrusel
  useEffect(() => {
    if (recentWorks.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % recentWorks.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [recentWorks.length])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    }
  }, [searchTerm, router])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % recentWorks.length)
  }, [recentWorks.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + recentWorks.length) % recentWorks.length)
  }, [recentWorks.length])

  // Mapear works con nombres de países
  const mappedWorks = useMemo(() => 
    recentWorks.map((work) => ({
      ...work,
      creator: {
        ...work.creators,
        country_name: countryMap[work.creators?.country_code] || work.creators?.country_code,
        display_name: work.creators?.full_first_name && work.creators?.full_last_name 
          ? `${work.creators.full_first_name} ${work.creators.full_last_name}`
          : `${work.creators?.full_first_name || ''} ${work.creators?.full_last_name || ''}`.trim()
      }
    })),
    [recentWorks]
  )

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "40px auto", 
      padding: "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      {/* Hero Section con buscador integrado */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5, #10b981)",
        padding: "60px 40px",
        marginBottom: "40px",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ 
          fontSize: "clamp(2.5rem, 8vw, 4rem)", 
          marginBottom: "20px",
          color: "white",
          fontWeight: "800",
          textShadow: "2px 2px 4px rgba(0,0,0,0.2)"
        }}>
          {t.home?.title || 'Creator-ID'}
        </h1>
        
        <p style={{
          fontSize: "clamp(1.1rem, 4vw, 1.3rem)",
          marginBottom: "40px",
          color: "rgba(255,255,255,0.95)",
          maxWidth: "600px",
          margin: "0 auto 40px"
        }}>
          {t.home?.subtitle || 'Create your unique identity as a creator and share your public profile easily.'}
        </p>

        {/* Buscador - mismo estilo que en search page */}
        <form onSubmit={handleSearch} style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.home?.searchPlaceholder || 'Buscar por nombre, ID o email...'}
              style={{
                flex: 1,
                padding: "15px",
                fontSize: "1rem",
                border: "none",
                outline: "none",
                minWidth: "250px",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "15px 30px",
                background: "white",
                color: "#4f46e5",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f0f0f0";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "white";
              }}
            >
              🔍 {t.search?.button || 'Buscar'}
            </button>
          </div>
        </form>

        {/* Stats */}
        {!isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            flexWrap: 'wrap',
            marginTop: '40px'
          }}>
            <StatCard number={stats.creators} label="Creadores" />
            <StatCard number={stats.works} label="Obras" />
            <StatCard number={stats.countries} label="Países" />
          </div>
        )}
      </div>

      {/* Carrusel de Obras Recientes */}
      {!isLoading && mappedWorks.length > 0 && (
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ 
            fontSize: "2rem", 
            marginBottom: "30px",
            background: "linear-gradient(135deg, #4f46e5, #10b981)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "inline-block"
          }}>
            🎨 Obras Recientes
          </h2>

          <div style={{ position: 'relative' }}>
            {/* Carrusel */}
            <div ref={carouselRef} style={{
              width: '100%',
              overflow: 'hidden',
              borderRadius: '4px',
              background: 'white',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                transition: 'transform 0.5s ease',
                transform: `translateX(-${currentSlide * 100}%)`,
                width: '100%'
              }}>
                {mappedWorks.map((work) => (
                  <div key={work.id} style={{
                    flex: '0 0 100%',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '300px 1fr',
                      gap: '30px',
                      padding: '30px',
                      background: 'white'
                    }}>
                      {/* Imagen de la obra */}
                      <div style={{
                        height: '300px',
                        background: '#f5f5f5',
                        position: 'relative',
                        border: '1px solid #e0e0e0'
                      }}>
                        {work.file_url ? (
                          <img
                            src={work.file_url}
                            alt={work.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
                            color: 'white',
                            fontSize: '3rem'
                          }}>
                            🎨
                          </div>
                        )}
                      </div>

                      {/* Información de la obra - ALINEADA CON LA IMAGEN */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '300px' /* Misma altura que la imagen */
                      }}>
                        {/* Título pegado arriba */}
                        <h3 style={{
                          fontSize: '1.8rem',
                          margin: '0 0 15px 0', /* Sin margen superior */
                          color: '#333',
                          lineHeight: '1.2'
                        }}>
                          {work.title}
                        </h3>
                        
                        {/* Descripción con altura fija para mantener proporciones */}
                        <div style={{
                          flex: '1',
                          marginBottom: '15px',
                          padding: '12px',
                          background: '#f8fafc',
                          borderLeft: '4px solid #4f46e5',
                          borderRadius: '0 4px 4px 0',
                          overflowY: 'auto',
                          minHeight: '80px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px',
                            color: '#4f46e5',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <span>📝</span> DESCRIPCIÓN
                          </div>
                          <p style={{
                            color: '#334155',
                            lineHeight: '1.5',
                            fontSize: '0.9rem',
                            margin: 0,
                            fontStyle: work.description ? 'normal' : 'italic'
                          }}>
                            {work.description || 'Sin descripción disponible'}
                          </p>
                        </div>

                        {/* ID del CREADOR */}
                        <div style={{
                          marginBottom: '15px',
                          padding: '10px 12px',
                          background: '#f0f7ff',
                          border: '1px solid #4f46e5'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333', fontSize: '0.9rem' }}>
                            🆔 Creator ID:
                          </div>
                          <code style={{
                            background: '#333',
                            color: '#0f0',
                            padding: '6px 10px',
                            fontSize: '1rem',
                            display: 'inline-block'
                          }}>
                            {work.creator_id}
                          </code>
                        </div>

                        {/* Botón al fondo */}
                         <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginTop: 'auto'
                        }}>
                        <Link
                          href={`/${work.creator_id}`}
                          style={{
                              display: 'inline-block',
                              padding: '8px 20px',
                              background: 'linear-gradient(135deg, #4f46e5, #10b981)',
                              color: 'white',
                              textDecoration: 'none',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s',
                              textAlign: 'center',
                              borderRadius: '4px'
                            }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          Ver perfil del creador →
                        </Link>
                      </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de navegación */}
            {mappedWorks.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '50%',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    zIndex: 10,
                    color: '#4f46e5'
                  }}
                >
                  ←
                </button>
                <button
                  onClick={nextSlide}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '50%',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    zIndex: 10,
                    color: '#4f46e5'
                  }}
                >
                  →
                </button>
              </>
            )}

            {/* Indicadores */}
            {mappedWorks.length > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '20px'
              }}>
                {mappedWorks.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: currentSlide === index ? '#4f46e5' : '#ddd',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.3s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Cómo funciona - Estilo tarjetas como en search */}
      <section style={{ marginBottom: "60px" }}>
        <h2 style={{ 
          fontSize: "2rem", 
          marginBottom: "30px",
          background: "linear-gradient(135deg, #4f46e5, #10b981)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: "inline-block"
        }}>
          📋 {t.home?.howItWorks || '¿Cómo funciona?'}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {[1, 2, 3].map((step) => (
            <div key={step} style={{
              padding: "30px",
              background: "white",
              border: "1px solid #e0e0e0",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              textAlign: "center"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
              e.currentTarget.style.borderColor = "#4f46e5";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}>
              <div style={{
                width: "60px",
                height: "60px",
                background: "linear-gradient(135deg, #4f46e5, #10b981)",
                color: "white",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                margin: "0 auto 20px"
              }}>
                {step}
              </div>
              <h3 style={{ marginBottom: "15px", color: "#333" }}>
                {t.home?.steps?.[step-1]?.split('.')[0] || `Paso ${step}`}
              </h3>
              <p style={{ color: "#666", lineHeight: "1.6" }}>
                {t.home?.steps?.[step-1]?.split('.')[1] || 'Descripción del paso'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Beneficios - Estilo tarjetas como en search */}
      <section style={{ marginBottom: "60px" }}>
        <h2 style={{ 
          fontSize: "2rem", 
          marginBottom: "30px",
          background: "linear-gradient(135deg, #4f46e5, #10b981)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: "inline-block"
        }}>
          ✨ {t.home?.whyTitle || '¿Por qué Creator-ID?'}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <BenefitCard
            icon="🎨"
            title="Identidad Única"
            description="ID único garantizado para cada creador. Tu sello de autenticidad en el mundo digital."
          />
          
          <BenefitCard
            icon="🌍"
            title="Alcance Global"
            description="Perfiles públicos con país y email. Conecta con audiencias de todo el mundo."
          />
          
          <BenefitCard
            icon="🔍"
            title="Fácil de Encontrar"
            description="Comparte y busca fácilmente. Tu trabajo al alcance de quien lo busca."
          />
          
          {/* Beneficio especial con gradiente */}
          <div style={{
            padding: "30px",
            background: "linear-gradient(135deg, #4f46e5, #10b981)",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            textAlign: "center",
            color: "white"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";
          }}>
            <div style={{
              fontSize: "3rem",
              marginBottom: "20px"
            }}>
              👑
            </div>
            <h3 style={{ marginBottom: "15px", color: "white" }}>Royalty para Creadores</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", lineHeight: "1.6" }}>
              Gana un 75% de regalías por cada venta de tus obras. Tu creatividad, tu recompensa.
            </p>
            <div style={{
              marginTop: "20px",
              background: "rgba(255,255,255,0.2)",
              padding: "10px",
              fontSize: "1.5rem",
              fontWeight: "bold"
            }}>
              75% Royalty
            </div>
          </div>
          
          <BenefitCard
            icon="📊"
            title="Estadísticas en Tiempo Real"
            description="Visualiza tus visitas, ventas y mensajes. Toda la información que necesitas."
          />
          
          <BenefitCard
            icon="🚀"
            title="En Constante Evolución"
            description="Nuevas funcionalidades cada mes. Creciendo contigo y para ti."
          />
        </div>
      </section>

      {/* Call to Action */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5, #10b981)",
        padding: "60px 40px",
        marginBottom: "40px",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          fontSize: "2rem",
          marginBottom: "20px",
          color: "white"
        }}>
          ¿Listo para empezar a ganar?
        </h2>
        <p style={{
          fontSize: "1.2rem",
          marginBottom: "30px",
          color: "rgba(255,255,255,0.95)",
          maxWidth: "600px",
          margin: "0 auto 30px"
        }}>
          Únete a nuestra comunidad de creadores, obtén tu Creator ID único y comienza a ganar el 75% de regalías por tus obras.
        </p>
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/register"
            style={{
              padding: "15px 40px",
              background: "white",
              color: "#4f46e5",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              transition: "all 0.2s",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f0f0f0";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Crear mi Creator ID
          </Link>
          <Link
            href="/search"
            style={{
              padding: "15px 40px",
              background: "transparent",
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              border: "2px solid white",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = "#4f46e5";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "white";
            }}
          >
            Explorar Creadores
          </Link>
        </div>
      </div>

           {/* Footer */}
      <footer style={{
        marginTop: "60px",
        borderTop: "1px solid #e0e0e0",
        paddingTop: "40px"
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '40px',
          marginBottom: '30px'
        }}>
          {/* Columna 1: Logo y descripción */}
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              marginBottom: '15px',
              background: 'linear-gradient(135deg, #4f46e5, #10b981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              Creator-ID
            </h3>
            <p style={{
              color: '#666',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              {t.profile?.footer?.description || 'Crea tu identidad única como creador y comparte tu perfil público fácilmente.'}
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <a href="#" style={{ color: '#4f46e5', fontSize: '1.2rem' }}>🐦</a>
              <a href="#" style={{ color: '#4f46e5', fontSize: '1.2rem' }}>📷</a>
              <a href="#" style={{ color: '#4f46e5', fontSize: '1.2rem' }}>💼</a>
              <a href="#" style={{ color: '#4f46e5', fontSize: '1.2rem' }}>📘</a>
            </div>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div>
            <h4 style={{
              fontSize: '1.1rem',
              marginBottom: '20px',
              color: '#333',
              fontWeight: '600'
            }}>
              {t.profile?.footer?.quickLinks || 'Enlaces Rápidos'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.home || 'Inicio'}</Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/search" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.search || 'Buscar Creadores'}</Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/register" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.createId || 'Crear Creator ID'}</Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/works/new" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.registerWork || 'Registrar Obra'}</Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Soporte */}
          <div>
            <h4 style={{
              fontSize: '1.1rem',
              marginBottom: '20px',
              color: '#333',
              fontWeight: '600'
            }}>
              {t.profile?.footer?.support || 'Soporte'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/faq" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.faq || 'Preguntas Frecuentes'}</Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/contact" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.contact || 'Contacto'}</Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/terms" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.terms || 'Términos de Uso'}</Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/privacy" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.privacy || 'Política de Privacidad'}</Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Estadísticas */}
          <div>
            <h4 style={{
              fontSize: '1.1rem',
              marginBottom: '20px',
              color: '#333',
              fontWeight: '600'
            }}>
              {t.profile?.footer?.community || 'Comunidad'}
            </h4>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>{t.profile?.footer?.creators || 'Creadores'}</span>
                <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>{stats.creators}+</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>{t.profile?.footer?.works || 'Obras'}</span>
                <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>{stats.works}+</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>{t.profile?.footer?.countries || 'Países'}</span>
                <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>{stats.countries}</span>
              </div>
            </div>
            <div style={{
              background: '#f5f5f5',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                <strong style={{ color: '#4f46e5' }}>75% {t.profile?.footer?.royalty || 'Royalty'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          borderTop: '1px solid #e0e0e0',
          paddingTop: '20px',
          textAlign: 'center',
          color: '#999',
          fontSize: '0.9rem'
        }}>
          <p>© {new Date().getFullYear()} Creator-ID. {t.profile?.footer?.rights || 'Todos los derechos reservados.'}</p>
          <p style={{ marginTop: '5px', fontSize: '0.8rem' }}>
            {t.profile?.footer?.madeWith || 'Hecho con ❤️ para la comunidad de creadores'}
          </p>
        </div>
      </footer>
    </div>
  );
}

// Componentes auxiliares con el mismo estilo de search
const StatCard = ({ number, label }: { number: number; label: string }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ 
      fontSize: '2.5rem', 
      fontWeight: 'bold',
      color: 'white',
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    }}>
      {number}+
    </div>
    <div style={{ 
      color: 'rgba(255,255,255,0.9)',
      fontSize: '1.1rem'
    }}>
      {label}
    </div>
  </div>
);

const BenefitCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <div style={{
    padding: "30px",
    background: "white",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    textAlign: "center"
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
    e.currentTarget.style.borderColor = "#4f46e5";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";
    e.currentTarget.style.borderColor = "#e0e0e0";
  }}>
    <div style={{
      fontSize: "3rem",
      marginBottom: "20px"
    }}>
      {icon}
    </div>
    <h3 style={{ marginBottom: "15px", color: "#333" }}>{title}</h3>
    <p style={{ color: "#666", lineHeight: "1.6" }}>{description}</p>
  </div>
);