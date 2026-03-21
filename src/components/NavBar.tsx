'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { useLanguage } from '@/contexts/LanguageContext'

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [hasCreatorId, setHasCreatorId] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { user } = useAuth();
  const { t, language, changeLanguage } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (user?.email) {
      checkCreatorStatus();
    } else {
      setCreatorName("");
      setCreatorId("");
      setHasCreatorId(false);
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function checkCreatorStatus() {
    const { data } = await supabase
      .from("creators")
      .select("full_first_name, full_last_name, creator_id")
      .eq("email", user?.email)
      .maybeSingle();
    
    if (data) {
      const fullName = data.full_first_name && data.full_last_name
        ? `${data.full_first_name} ${data.full_last_name}`
        : 'Usuario';
      setCreatorName(fullName);
      setCreatorId(data.creator_id);
      setHasCreatorId(true);
      
      const { count } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', data.creator_id)
        .eq('is_read', false);
      
      setUnreadCount(count || 0);
    } else {
      setHasCreatorId(false);
      setUnreadCount(0);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    setMenuOpen(false);
    window.location.href = "/";
  }

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      transition: 'all 0.3s ease',
      background: scrolled 
        ? 'rgba(255, 255, 255, 0.95)'
        : 'linear-gradient(135deg, #4f46e5, #10b981)',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
      padding: '0.8rem 1rem', // Reducido padding en móviles
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        
        {/* Logo - más pequeño en móviles */}
        <Link href="/" style={{
          color: scrolled ? '#4f46e5' : 'white',
          textDecoration: 'none',
          fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', // Responsive
          fontWeight: 'bold',
          transition: 'color 0.3s ease',
        }}>
          Creator-ID
        </Link>

        {/* Desktop Menu - Enlaces públicos siempre visibles */}
<div style={{ 
  display: 'flex', 
  gap: '0.5rem', 
  alignItems: 'center',
}} className="desktop-menu">
  
  {/* Enlaces públicos - siempre visibles */}
  <NavLink href="/" isActive={isActive('/')} scrolled={scrolled}>
    {t.nav.home}
  </NavLink>
  
  <NavLink href="/shop" isActive={isActive('/shop')} scrolled={scrolled}>
    🛍️ {t.nav.shop || 'Tienda'}
  </NavLink>
  
  <NavLink href="/search" isActive={isActive('/search')} scrolled={scrolled}>
    {t.nav.search}
  </NavLink>
  
  <NavLink href="/verify" isActive={isActive('/verify')} scrolled={scrolled}>
    {t.nav.verify}
  </NavLink>
  
  {/* Enlaces que requieren usuario */}
  {user && (
    <>
      {hasCreatorId && (
        <NavLink href="/works/new" isActive={isActive('/works/new')} scrolled={scrolled}>
          {t.nav.registerWork}
        </NavLink>
      )}
    </>
  )}
</div>

        {/* Right section */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', // Reducido gap en móviles
        }}>
          
          {/* Language selector - más compacto en móviles */}
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              onClick={() => changeLanguage('es')}
              style={{
                padding: '4px 6px', // Reducido padding
                background: language === 'es' 
                  ? (scrolled ? '#4f46e5' : 'rgba(255,255,255,0.3)')
                  : (scrolled ? '#eaeaea' : 'rgba(255,255,255,0.1)'),
                color: language === 'es'
                  ? (scrolled ? 'white' : 'white')
                  : (scrolled ? '#333' : 'rgba(255,255,255,0.8)'),
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem', // Más pequeño
                fontWeight: language === 'es' ? 'bold' : 'normal'
              }}
            >
              ES
            </button>
            <button
              onClick={() => changeLanguage('en')}
              style={{
                padding: '4px 6px',
                background: language === 'en' 
                  ? (scrolled ? '#4f46e5' : 'rgba(255,255,255,0.3)')
                  : (scrolled ? '#eaeaea' : 'rgba(255,255,255,0.1)'),
                color: language === 'en'
                  ? (scrolled ? 'white' : 'white')
                  : (scrolled ? '#333' : 'rgba(255,255,255,0.8)'),
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: language === 'en' ? 'bold' : 'normal'
              }}
            >
              EN
            </button>
          </div>

          {/* Indicador de perfil incompleto - versión móvil más compacta */}
          {user && !hasCreatorId && (
            <Link
              href="/register"
              style={{
                padding: '4px 8px',
                background: '#fbbf24',
                color: '#1f2937',
                textDecoration: 'none',
                fontSize: '0.7rem', // Más pequeño
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              ⚡
            </Link>
          )}

          {!user && (
            <div style={{ display: 'none', gap: '0.5rem' }} className="desktop-menu">
              <NavLink href="/auth/register" isActive={isActive('/auth/register')} scrolled={scrolled}>
                {t.nav.register}
              </NavLink>
              <NavLink href="/auth/login" isActive={isActive('/auth/login')} scrolled={scrolled}>
                {t.nav.login}
              </NavLink>
            </div>
          )}

          {user && (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  background: userMenuOpen 
                    ? (scrolled ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255,255,255,0.2)')
                    : (scrolled ? 'transparent' : 'rgba(255,255,255,0.1)'),
                  border: scrolled ? '1px solid #eaeaea' : '1px solid rgba(255,255,255,0.2)',
                  padding: '0.4rem 0.8rem', // Reducido padding
                  color: scrolled ? '#1f2937' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                  fontWeight: 500,
                  fontSize: '0.85rem', // Más pequeño
                }}
              >
                <span style={{ fontSize: '1rem' }}>👤</span>
                <span className="username">{creatorName?.split(' ')[0] || 'User'}</span>
                <span style={{ 
                  fontSize: '0.6rem',
                  transition: 'transform 0.2s',
                  transform: userMenuOpen ? 'rotate(180deg)' : 'none'
                }}>▼</span>
              </button>

              {/* Menú desplegable - mismo ancho en móvil */}
              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'white',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  minWidth: '180px',
                  overflow: 'hidden',
                  border: '1px solid #eaeaea',
                  zIndex: 1000
                }}>
                  <DropdownItem 
                    href="/profile" 
                    icon="👤"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {t.nav.profile}
                  </DropdownItem>
                  <DropdownItem 
                    href="/messages" 
                    icon="📬" 
                    badge={unreadCount}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {t.nav.messages}
                  </DropdownItem>
                  {creatorId && (
                    <DropdownItem 
                      href={`/${creatorId}`} 
                      icon="🌐"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t.nav.publicProfile}
                    </DropdownItem>
                  )}
                  <div style={{ height: '1px', background: '#eaeaea', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <span style={{ fontSize: '1rem' }}>🔒</span>
                    {t.nav.logout}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button - siempre visible en móviles */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'block',
              background: 'none',
              border: 'none',
              color: scrolled ? '#4f46e5' : 'white',
              fontSize: '1.8rem',
              cursor: 'pointer',
              padding: '0.3rem',
              lineHeight: '1'
            }}
            className="mobile-menu-button"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

       {/* Mobile menu */}
{menuOpen && (
  <div style={{
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    bottom: 0,
    background: 'white',
    padding: '20px',
    overflowY: 'auto',
    zIndex: 999,
    animation: 'slideIn 0.3s ease'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Enlaces públicos - siempre visibles */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          padding: '8px 0',
          color: '#666',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Principal
        </div>
        <MobileLink href="/" onClick={() => setMenuOpen(false)}>
          🏠 Inicio
        </MobileLink>
        <MobileLink href="/shop" onClick={() => setMenuOpen(false)}>
          🛍️ Tienda
        </MobileLink>
        <MobileLink href="/faq" onClick={() => setMenuOpen(false)}>
          ❓ Ayuda / FAQ
        </MobileLink>
      </div>

      {/* Enlaces de exploración */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          padding: '8px 0',
          color: '#666',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Explorar
        </div>
        <MobileLink href="/search" onClick={() => setMenuOpen(false)}>
          🔍 Buscar
        </MobileLink>
        <MobileLink href="/verify" onClick={() => setMenuOpen(false)}>
          ✅ Verificar
        </MobileLink>
      </div>

            {/* Enlaces de usuario (no autenticado) */}
            {!user && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  padding: '8px 0',
                  color: '#666',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Acceso
                </div>
                <MobileLink href="/auth/register" onClick={() => setMenuOpen(false)}>
                  📝 Registrarse
                </MobileLink>
                <MobileLink href="/auth/login" onClick={() => setMenuOpen(false)}>
                  🔑 Iniciar sesión
                </MobileLink>
              </div>
            )}

            {/* Enlaces de creador */}
            {user && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    padding: '8px 0',
                    color: '#666',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Mi cuenta
                  </div>
                  
                  {/* Info del usuario */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#f3f4f6',
                    marginBottom: '8px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{creatorName || 'Usuario'}</div>
                    {creatorId && <div style={{ fontSize: '0.7rem', color: '#666' }}>ID: {creatorId}</div>}
                  </div>

                  {/* Enlaces del perfil */}
                  <MobileLink href="/profile" onClick={() => setMenuOpen(false)}>
                    👤 Mi Perfil
                  </MobileLink>
                  <MobileLink href="/profile/edit" onClick={() => setMenuOpen(false)}>
                    ✏️ Editar Perfil
                  </MobileLink>
                  <MobileLink href="/messages" onClick={() => setMenuOpen(false)}>
                    📬 Mensajes {unreadCount > 0 && `(${unreadCount})`}
                  </MobileLink>
                  
                  {/* Enlaces de obras */}
                  {hasCreatorId && (
                    <MobileLink href="/works/new" onClick={() => setMenuOpen(false)}>
                      ➕ Registrar obra
                    </MobileLink>
                  )}
                  
                  {/* Perfil público */}
                  {creatorId && (
                    <MobileLink href={`/${creatorId}`} onClick={() => setMenuOpen(false)}>
                      🌐 Perfil público
                    </MobileLink>
                  )}
                  
                  {/* Botón cerrar sesión */}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '12px 16px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      borderRadius: '8px',
                      marginTop: '8px'
                    }}
                  >
                    🔒 Cerrar sesión
                  </button>
                </div>

                {/* Indicador de perfil incompleto */}
                {!hasCreatorId && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#92400e' }}>⚠️ Perfil incompleto</div>
                    <div style={{ fontSize: '0.8rem', color: '#b45309' }}>Completa tu registro para publicar obras</div>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'inline-block',
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: '#f59e0b',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}
                    >
                      Completar perfil
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Selector de idioma */}
            <div style={{
              borderTop: '1px solid #eaeaea',
              paddingTop: '16px',
              marginTop: '8px'
            }}>
              <div style={{
                padding: '8px 0',
                color: '#666',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Idioma
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    changeLanguage('es');
                    setMenuOpen(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: language === 'es' ? '#4f46e5' : '#f3f4f6',
                    color: language === 'es' ? 'white' : '#333',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: language === 'es' ? 'bold' : 'normal',
                    borderRadius: '8px'
                  }}
                >
                  🇪🇸 Español
                </button>
                <button
                  onClick={() => {
                    changeLanguage('en');
                    setMenuOpen(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: language === 'en' ? '#4f46e5' : '#f3f4f6',
                    color: language === 'en' ? 'white' : '#333',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: language === 'en' ? 'bold' : 'normal',
                    borderRadius: '8px'
                  }}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 769px) {
          .desktop-menu {
            display: flex !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
          .username {
            display: inline;
          }
        }
        @media (max-width: 768px) {
          .username {
            display: none;
          }
          nav {
            padding: 0.5rem !important;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </nav>
  );
}

// Componentes auxiliares (sin cambios)
function NavLink({ href, children, isActive, scrolled }: any) {
  return (
    <Link
      href={href}
      style={{
        color: isActive 
          ? (scrolled ? '#4f46e5' : 'white')
          : (scrolled ? '#4f46e5' : 'rgba(255,255,255,0.9)'),
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.2s',
        background: isActive && !scrolled ? 'rgba(255,255,255,0.1)' : 'none',
      }}
      onMouseOver={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = scrolled 
            ? 'rgba(79, 70, 229, 0.05)' 
            : 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = scrolled ? '#4f46e5' : 'white';
        }
      }}
      onMouseOut={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.color = scrolled ? '#4f46e5' : 'rgba(255,255,255,0.9)';
        }
      }}
    >
      {children}
    </Link>
  );
}

function DropdownItem({ href, icon, children, badge, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        color: '#1f2937',
        textDecoration: 'none',
        fontSize: '0.95rem',
        transition: 'background 0.2s',
      }}
      onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
      onMouseOut={(e) => e.currentTarget.style.background = 'white'}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {badge > 0 && (
        <span style={{
          background: '#ef4444',
          color: 'white',
          fontSize: '0.7rem',
          padding: '2px 6px',
          fontWeight: 600,
        }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function MobileLink({ href, onClick, children }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#1f2937',
        textDecoration: 'none',
        padding: '12px 16px',
        transition: 'background 0.2s',
        borderRadius: '8px',
        fontSize: '1rem'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </Link>
  );
}