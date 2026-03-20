'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import WorkCard from '@/components/WorkCard'

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
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({ creators: 0, works: 0, countries: 0 })
  const [recentWorks, setRecentWorks] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const router = useRouter()
  const supabase = createClient()
  const carouselRef = useRef<HTMLDivElement>(null)

  // Detectar tamaño de pantalla para responsive
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

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
          .limit(9)

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

  // Auto-slide del carrusel - SIMPLE Y EFECTIVO
useEffect(() => {
  if (recentWorks.length === 0) return
  
  const interval = setInterval(() => {
    const totalSlides = Math.ceil(recentWorks.length / (isMobile ? 1 : 3));
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  }, 5000)
  
  return () => clearInterval(interval)
}, [recentWorks.length, isMobile])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    }
  }, [searchTerm, router])

  const nextSlide = useCallback(() => {
    const totalSlides = Math.ceil(recentWorks.length / (isMobile ? 1 : 3));
    if (currentSlide === totalSlides - 1) {
      setCurrentSlide(0);
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  }, [recentWorks.length, isMobile, currentSlide])

  const prevSlide = useCallback(() => {
    const totalSlides = Math.ceil(recentWorks.length / (isMobile ? 1 : 3));
    if (currentSlide === 0) {
      setCurrentSlide(totalSlides - 1);
    } else {
      setCurrentSlide(prev => prev - 1);
    }
  }, [recentWorks.length, isMobile, currentSlide])

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
      padding: isMobile ? "0 15px" : "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      {/* Hero Section con buscador integrado */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5, #10b981)",
        padding: isMobile ? "40px 20px" : "60px 40px",
        marginBottom: "40px",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        borderRadius: "0"
      }}>
        <h1 style={{ 
          fontSize: isMobile ? "2rem" : "clamp(2.5rem, 8vw, 4rem)", 
          marginBottom: "20px",
          color: "white",
          fontWeight: "800",
          textShadow: "2px 2px 4px rgba(0,0,0,0.2)"
        }}>
          {t.home?.title || 'Creator-ID'}
        </h1>
        
        <p style={{
          fontSize: isMobile ? "1rem" : "clamp(1.1rem, 4vw, 1.3rem)",
          marginBottom: "40px",
          color: "rgba(255,255,255,0.95)",
          maxWidth: "600px",
          margin: "0 auto 40px",
          padding: isMobile ? "0 10px" : "0"
        }}>
          {t.home?.subtitle || 'Create your unique identity as a creator and share your public profile easily.'}
        </p>

        {/* Buscador */}
        <form onSubmit={handleSearch} style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{
            display: "flex",
            gap: "10px",
            flexDirection: isMobile ? "column" : "row"
          }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.home?.searchPlaceholder || 'Buscar por nombre, ID o email...'}
              style={{
                flex: 1,
                padding: isMobile ? "12px" : "15px",
                fontSize: "1rem",
                border: "none",
                outline: "none",
                borderRadius: isMobile ? "4px" : "4px 0 0 4px",
                width: "100%"
              }}
            />
            <button
              type="submit"
              style={{
                padding: isMobile ? "12px" : "15px 30px",
                background: "white",
                color: "#4f46e5",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                transition: 'all 0.2s',
                borderRadius: isMobile ? "4px" : "0 4px 4px 0",
                width: isMobile ? "100%" : "auto"
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
            gap: isMobile ? '20px' : '40px',
            flexWrap: 'wrap',
            marginTop: '40px'
          }}>
            <StatCard number={stats.creators} label="Creadores" isMobile={isMobile} />
            <StatCard number={stats.works} label="Obras" isMobile={isMobile} />
            <StatCard number={stats.countries} label="Países" isMobile={isMobile} />
          </div>
        )}
      </div>

               {/* Carrusel de Obras Recientes - VERSIÓN SIMPLE QUE FUNCIONA */}
      {!isLoading && mappedWorks.length > 0 && (
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ 
            fontSize: isMobile ? "1.5rem" : "2rem", 
            marginBottom: "20px",
            background: "linear-gradient(135deg, #4f46e5, #10b981)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "inline-block"
          }}>
            🎨 Obras Recientes
          </h2>

          <div style={{ position: 'relative' }}>
            {/* Contenedor del carrusel */}
            <div ref={carouselRef} style={{
              width: '100%',
              overflow: 'hidden',
              borderRadius: '8px',
              background: 'white',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                transition: 'transform 0.5s ease-in-out',
                transform: `translateX(-${currentSlide * 100}%)`,
                width: '100%'
              }}>
                {/* Slides con grupos de obras */}
                {Array.from({ length: Math.ceil(mappedWorks.length / (isMobile ? 1 : 3)) }).map((_, groupIndex) => (
                  <div key={groupIndex} style={{
                    flex: '0 0 100%',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: isMobile ? '15px' : '20px'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                      gap: isMobile ? '15px' : '20px'
                    }}>
                      {mappedWorks
                        .slice(groupIndex * (isMobile ? 1 : 3), (groupIndex + 1) * (isMobile ? 1 : 3))
                        .map((work) => (
                          <TarjetaObra 
                            key={work.id} 
                            work={work} 
                            isMobile={isMobile} 
                            router={router} 
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de navegación */}
            {Math.ceil(mappedWorks.length / (isMobile ? 1 : 3)) > 1 && (
              <>
                <button
                  onClick={() => {
                    const totalSlides = Math.ceil(mappedWorks.length / (isMobile ? 1 : 3));
                    setCurrentSlide(currentSlide === 0 ? totalSlides - 1 : currentSlide - 1);
                  }}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: isMobile ? '32px' : '40px',
                    height: isMobile ? '32px' : '40px',
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '50%',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    fontSize: isMobile ? '1rem' : '1.2rem',
                    zIndex: 10,
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    const totalSlides = Math.ceil(mappedWorks.length / (isMobile ? 1 : 3));
                    setCurrentSlide(currentSlide === totalSlides - 1 ? 0 : currentSlide + 1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: isMobile ? '32px' : '40px',
                    height: isMobile ? '32px' : '40px',
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '50%',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    fontSize: isMobile ? '1rem' : '1.2rem',
                    zIndex: 10,
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  →
                </button>
              </>
            )}

            {/* Indicadores */}
            {Math.ceil(mappedWorks.length / (isMobile ? 1 : 3)) > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '20px'
              }}>
                {Array.from({ length: Math.ceil(mappedWorks.length / (isMobile ? 1 : 3)) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    style={{
                      width: isMobile ? '8px' : '10px',
                      height: isMobile ? '8px' : '10px',
                      borderRadius: '50%',
                      background: currentSlide === index ? '#4f46e5' : '#ddd',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.3s',
                      padding: 0
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sección de Shop Room - Resumen */}
      {!isLoading && mappedWorks.length > 0 && (
        <section style={{ marginBottom: "60px" }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <h2 style={{ 
              fontSize: isMobile ? "1.5rem" : "2rem", 
              margin: 0,
              background: "linear-gradient(135deg, #4f46e5, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block"
            }}>
              🛍️ Obras Destacadas
            </h2>
            <Link
              href="/shop"
              style={{
                padding: '8px 20px',
                background: '#4f46e5',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 'bold',
                borderRadius: '4px'
              }}
            >
              Ver todas las obras →
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {mappedWorks.slice(0, 6).map((work) => (
              <WorkCard
                key={work.id}
                work={{
                  ...work,
                  creator: work.creator
                }}
                showActions={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cómo funciona */}
      <section style={{ marginBottom: "60px" }}>
        <h2 style={{ 
          fontSize: isMobile ? "1.5rem" : "2rem", 
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
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          {[1, 2, 3].map((step) => (
            <div key={step} style={{
              padding: isMobile ? '20px' : '30px',
              background: "white",
              border: "1px solid #e0e0e0",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              textAlign: "center",
              borderRadius: "0"
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
                width: isMobile ? '50px' : '60px',
                height: isMobile ? '50px' : '60px',
                background: "linear-gradient(135deg, #4f46e5, #10b981)",
                color: "white",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? '1.3rem' : '1.5rem',
                fontWeight: "bold",
                margin: "0 auto 20px"
              }}>
                {step}
              </div>
              <h3 style={{ marginBottom: "15px", color: "#333", fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
                {t.home?.steps?.[step-1]?.split('.')[0] || `Paso ${step}`}
              </h3>
              <p style={{ color: "#666", lineHeight: "1.6", fontSize: isMobile ? '0.9rem' : '1rem' }}>
                {t.home?.steps?.[step-1]?.split('.')[1] || 'Descripción del paso'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section style={{ marginBottom: "60px" }}>
        <h2 style={{ 
          fontSize: isMobile ? "1.5rem" : "2rem", 
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
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <BenefitCard
            icon="🎨"
            title="Identidad Única"
            description="ID único garantizado para cada creador. Tu sello de autenticidad en el mundo digital."
            isMobile={isMobile}
          />
          
          <BenefitCard
            icon="🌍"
            title="Alcance Global"
            description="Perfiles públicos con país y email. Conecta con audiencias de todo el mundo."
            isMobile={isMobile}
          />
          
          <BenefitCard
            icon="🔍"
            title="Fácil de Encontrar"
            description="Comparte y busca fácilmente. Tu trabajo al alcance de quien lo busca."
            isMobile={isMobile}
          />
          
          {/* Beneficio especial con gradiente */}
          <div style={{
            padding: isMobile ? '20px' : '30px',
            background: "linear-gradient(135deg, #4f46e5, #10b981)",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            textAlign: "center",
            color: "white",
            borderRadius: "0"
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
              fontSize: isMobile ? '2.5rem' : '3rem',
              marginBottom: "20px"
            }}>
              👑
            </div>
            <h3 style={{ marginBottom: "15px", color: "white", fontSize: isMobile ? '1.2rem' : '1.3rem' }}>Royalty para Creadores</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", lineHeight: "1.6", fontSize: isMobile ? '0.9rem' : '1rem' }}>
              Gana un 75% de regalías por cada venta de tus obras. Tu creatividad, tu recompensa.
            </p>
            <div style={{
              marginTop: "20px",
              background: "rgba(255,255,255,0.2)",
              padding: "10px",
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: "bold",
              borderRadius: "0"
            }}>
              75% Royalty
            </div>
          </div>
          
          <BenefitCard
            icon="📊"
            title="Estadísticas en Tiempo Real"
            description="Visualiza tus visitas, ventas y mensajes. Toda la información que necesitas."
            isMobile={isMobile}
          />
          
          <BenefitCard
            icon="🚀"
            title="En Constante Evolución"
            description="Nuevas funcionalidades cada mes. Creciendo contigo y para ti."
            isMobile={isMobile}
          />
        </div>
      </section>

      {/* Call to Action */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5, #10b981)",
        padding: isMobile ? "40px 20px" : "60px 40px",
        marginBottom: "40px",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        borderRadius: "0"
      }}>
        <h2 style={{
          fontSize: isMobile ? "1.5rem" : "2rem",
          marginBottom: "20px",
          color: "white"
        }}>
          ¿Listo para empezar a ganar?
        </h2>
        <p style={{
          fontSize: isMobile ? "1rem" : "1.2rem",
          marginBottom: "30px",
          color: "rgba(255,255,255,0.95)",
          maxWidth: "600px",
          margin: "0 auto 30px",
          padding: isMobile ? "0 10px" : "0"
        }}>
          Únete a nuestra comunidad de creadores, obtén tu Creator ID único y comienza a ganar el 75% de regalías por tus obras.
        </p>
        <div style={{
          display: 'flex',
          gap: '20px',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/register"
            style={{
              padding: isMobile ? "12px 24px" : "15px 40px",
              background: "white",
              color: "#4f46e5",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: isMobile ? "1rem" : "1.1rem",
              transition: "all 0.2s",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              borderRadius: "0",
              textAlign: "center"
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
              padding: isMobile ? "12px 24px" : "15px 40px",
              background: "transparent",
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: isMobile ? "1rem" : "1.1rem",
              border: "2px solid white",
              transition: "all 0.2s",
              borderRadius: "0",
              textAlign: "center"
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

      <style>{`
        @media (max-width: 768px) {
          body {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

// Componente TarjetaObra para reutilizar
function TarjetaObra({ work, isMobile, router }: any) {
  return (
    <div style={{
      background: '#f9f9f9',
      borderRadius: '0',
      overflow: 'hidden',
      border: '1px solid #eaeaea',
      transition: 'transform 0.2s',
      cursor: 'pointer'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    onClick={() => router.push(`/${work.creator_id}`)}>
      
      {/* Imagen de la obra */}
      <div style={{
        height: isMobile ? '150px' : '180px',
        background: '#f0f0f0',
        position: 'relative',
        overflow: 'hidden'
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
            fontSize: '2rem'
          }}>
            🎨
          </div>
        )}
      </div>

      {/* Información de la obra */}
      <div style={{ padding: '12px' }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          margin: '0 0 8px 0',
          color: '#333',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {work.title}
        </h3>
        
        <p style={{
          fontSize: '0.8rem',
          color: '#666',
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.2rem'
        }}>
          {work.description 
            ? (work.description.length > 70 
              ? work.description.substring(0, 70) + '...' 
              : work.description)
            : 'Sin descripción'}
        </p>

        {/* Creator ID simplificado */}
        <div style={{
          background: '#f0f7ff',
          padding: '6px 8px',
          borderRadius: '0',
          fontSize: '0.75rem',
          marginBottom: '8px'
        }}>
          <code style={{
            background: '#333',
            color: '#0f0',
            padding: '2px 4px',
            fontSize: '0.7rem'
          }}>
            {work.creator_id}
          </code>
        </div>

        {/* Creador */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderTop: '1px solid #eaeaea',
          paddingTop: '8px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: work.creator?.avatar_url ? 'none' : 'linear-gradient(135deg, #4f46e5, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.8rem',
            overflow: 'hidden'
          }}>
            {work.creator?.avatar_url ? (
              <img
                src={work.creator.avatar_url}
                alt={work.creator.display_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              work.creator?.display_name?.charAt(0) || '👤'
            )}
          </div>
          <span style={{
            fontSize: '0.8rem',
            color: '#666',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {work.creator?.display_name?.split(' ')[0] || 'Creador'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
const StatCard = ({ number, label, isMobile }: { number: number; label: string; isMobile: boolean }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ 
      fontSize: isMobile ? '1.8rem' : '2.5rem', 
      fontWeight: 'bold',
      color: 'white',
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    }}>
      {number}+
    </div>
    <div style={{ 
      color: 'rgba(255,255,255,0.9)',
      fontSize: isMobile ? '0.9rem' : '1.1rem'
    }}>
      {label}
    </div>
  </div>
);

const BenefitCard = ({ icon, title, description, isMobile }: { icon: string; title: string; description: string; isMobile: boolean }) => (
  <div style={{
    padding: isMobile ? '20px' : '30px',
    background: "white",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    textAlign: "center",
    borderRadius: "0"
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
      fontSize: isMobile ? '2.5rem' : '3rem',
      marginBottom: "20px"
    }}>
      {icon}
    </div>
    <h3 style={{ marginBottom: "15px", color: "#333", fontSize: isMobile ? '1.2rem' : '1.3rem' }}>{title}</h3>
    <p style={{ color: "#666", lineHeight: "1.6", fontSize: isMobile ? '0.9rem' : '1rem' }}>{description}</p>
  </div>
);