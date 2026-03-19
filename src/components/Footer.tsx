'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer style={{
      borderTop: "1px solid #e0e0e0",
      padding: "0px 20px ",
      background: '#fafafa',
      width: "100%"
    }}>
      {/* Contenedor que centra el contenido a 1200px */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",        // Esto centra horizontalmente
        padding: "0 20px"         // Padding lateral para móviles
      }}>
        {/* Grid del footer */}
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
      </div>
    </footer>
  )
}