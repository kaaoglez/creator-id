'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const { t } = useLanguage()
  const pathname = usePathname()
  
  // Determinar si es una página de perfil o edición (más estrechas)
  const isProfilePage = pathname?.includes('/profile') || 
                        pathname?.includes('/messages') || 
                        pathname?.match(/^\/[^\/]+$/) && !['/', '/search', '/register', '/verify'].includes(pathname || '')
  
  // Estilos adaptables según el tipo de página
  const containerStyle = {
    maxWidth: isProfilePage ? "800px" : "1200px",
    margin: "0 auto",
    padding: isProfilePage ? "0 20px" : "0"
  }

  return (
    <footer style={{
      borderTop: "1px solid #e0e0e0",
      padding: isProfilePage ? "30px 20px 20px" : "40px 20px 20px",
      background: '#fafafa',
      width: "100%",
      marginTop: isProfilePage ? "20px" : "40px"
    }}>
      <div style={containerStyle}>
        {/* Versión simplificada para páginas de perfil */}
        {isProfilePage ? (
          // FOOTER SIMPLIFICADO PARA PÁGINAS ESTRECHAS
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Columna 1: Logo */}
              <div>
                <h3 style={{
                  fontSize: '1.2rem',
                  marginBottom: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #10b981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>
                  Creator-ID
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a href="#" style={{ color: '#4f46e5', fontSize: '1rem', textDecoration: 'none' }}>🐦</a>
                  <a href="#" style={{ color: '#4f46e5', fontSize: '1rem', textDecoration: 'none' }}>📷</a>
                  <a href="#" style={{ color: '#4f46e5', fontSize: '1rem', textDecoration: 'none' }}>💼</a>
                </div>
              </div>

              {/* Columna 2: Enlaces rápidos simplificados */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#333' }}>
                  {t.profile?.footer?.quickLinks || 'Enlaces'}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '6px' }}>
                    <Link href="/search" style={{ color: '#666', textDecoration: 'none', fontSize: '0.85rem' }}>🔍 Buscar</Link>
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    <Link href="/register" style={{ color: '#666', textDecoration: 'none', fontSize: '0.85rem' }}>📝 Registrarse</Link>
                  </li>
                </ul>
              </div>

              {/* Columna 3: Soporte simplificado */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#333' }}>
                  {t.profile?.footer?.support || 'Ayuda'}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '6px' }}>
                    <Link href="/faq" style={{ color: '#666', textDecoration: 'none', fontSize: '0.85rem' }}>❓ FAQ</Link>
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    <Link href="/contact" style={{ color: '#666', textDecoration: 'none', fontSize: '0.85rem' }}>📧 Contacto</Link>
                  </li>
                </ul>
              </div>

              {/* Columna 4: Royalty */}
              <div>
                <div style={{
                  background: '#f5f5f5',
                  padding: '10px',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>
                    <strong style={{ color: '#4f46e5' }}>75% Royalty</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Copyright simplificado */}
            <div style={{
              borderTop: '1px solid #e0e0e0',
              paddingTop: '15px',
              textAlign: 'center',
              color: '#999',
              fontSize: '0.8rem'
            }}>
              <p>© {new Date().getFullYear()} Creator-ID</p>
            </div>
          </div>
        ) : (
          // FOOTER COMPLETO PARA PÁGINAS PRINCIPALES (Home, Search, etc.)
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '30px',
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
                  marginBottom: '15px',
                  fontSize: '0.9rem'
                }}>
                  {t.profile?.footer?.description || 'Crea tu identidad única como creador y comparte tu perfil público fácilmente.'}
                </p>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <a href="#" style={{ color: '#4f46e5', fontSize: '1.2rem', textDecoration: 'none' }}>🐦</a>
                  <a href="#" style={{ color: '#4f46e5', fontSize: '1.2rem', textDecoration: 'none' }}>📷</a>
                  <a href="#" style={{ color: '#4f46e5', fontSize: '1.2rem', textDecoration: 'none' }}>💼</a>
                  <a href="#" style={{ color: '#4f46e5', fontSize: '1.2rem', textDecoration: 'none' }}>📘</a>
                </div>
              </div>

              {/* Columna 2: Enlaces rápidos */}
              <div>
                <h4 style={{
                  fontSize: '1rem',
                  marginBottom: '15px',
                  color: '#333',
                  fontWeight: '600'
                }}>
                  {t.profile?.footer?.quickLinks || 'Enlaces Rápidos'}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '10px' }}>
                    <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.home || 'Inicio'}</Link>
                  </li>
                  <li style={{ marginBottom: '10px' }}>
                    <Link href="/search" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.search || 'Buscar Creadores'}</Link>
                  </li>
                  <li style={{ marginBottom: '10px' }}>
                    <Link href="/register" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.createId || 'Crear Creator ID'}</Link>
                  </li>
                  <li style={{ marginBottom: '10px' }}>
                    <Link href="/works/new" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.registerWork || 'Registrar Obra'}</Link>
                  </li>
                </ul>
              </div>

              {/* Columna 3: Soporte */}
              <div>
                <h4 style={{
                  fontSize: '1rem',
                  marginBottom: '15px',
                  color: '#333',
                  fontWeight: '600'
                }}>
                  {t.profile?.footer?.support || 'Soporte'}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '10px' }}>
                    <Link href="/faq" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.faq || 'Preguntas Frecuentes'}</Link>
                  </li>
                  <li style={{ marginBottom: '10px' }}>
                    <Link href="/contact" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.contact || 'Contacto'}</Link>
                  </li>
                  <li style={{ marginBottom: '10px' }}>
                    <Link href="/terms" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.terms || 'Términos de Uso'}</Link>
                  </li>
                  <li style={{ marginBottom: '10px' }}>
                    <Link href="/privacy" style={{ color: '#666', textDecoration: 'none' }}>{t.profile?.footer?.privacy || 'Política de Privacidad'}</Link>
                  </li>
                </ul>
              </div>

              {/* Columna 4: Royalty */}
              <div>
                <h4 style={{
                  fontSize: '1rem',
                  marginBottom: '15px',
                  color: '#333',
                  fontWeight: '600'
                }}>
                  {t.profile?.footer?.community || 'Comunidad'}
                </h4>
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

            {/* Copyright completo */}
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
          </div>
        )}
      </div>
    </footer>
  )
}