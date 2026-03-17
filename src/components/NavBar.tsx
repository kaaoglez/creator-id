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
      padding: '1rem 2rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        
        {/* Logo */}
        <Link href="/" style={{
          color: scrolled ? '#4f46e5' : 'white',
          textDecoration: 'none',
          fontSize: '1.8rem',
          fontWeight: 'bold',
          transition: 'color 0.3s ease',
        }}>
          Creator-ID
        </Link>

        {/* Desktop Menu */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          alignItems: 'center',
        }} className="desktop-menu">
          
          <NavLink href="/" isActive={isActive('/')} scrolled={scrolled}>
            {t.nav.home}
          </NavLink>
          
          {user && (
            <>
              <NavLink href="/search" isActive={isActive('/search')} scrolled={scrolled}>
                {t.nav.search}
              </NavLink>
              <NavLink href="/verify" isActive={isActive('/verify')} scrolled={scrolled}>
                {t.nav.verify}
              </NavLink>
              
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
          gap: '1rem',
        }}>
          
          {/* Language selector */}
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              onClick={() => changeLanguage('es')}
              style={{
                padding: '4px 8px',
                background: language === 'es' 
                  ? (scrolled ? '#4f46e5' : 'rgba(255,255,255,0.3)')
                  : (scrolled ? '#eaeaea' : 'rgba(255,255,255,0.1)'),
                color: language === 'es'
                  ? (scrolled ? 'white' : 'white')
                  : (scrolled ? '#333' : 'rgba(255,255,255,0.8)'),
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: language === 'es' ? 'bold' : 'normal'
              }}
            >
              ES
            </button>
            <button
              onClick={() => changeLanguage('en')}
              style={{
                padding: '4px 8px',
                background: language === 'en' 
                  ? (scrolled ? '#4f46e5' : 'rgba(255,255,255,0.3)')
                  : (scrolled ? '#eaeaea' : 'rgba(255,255,255,0.1)'),
                color: language === 'en'
                  ? (scrolled ? 'white' : 'white')
                  : (scrolled ? '#333' : 'rgba(255,255,255,0.8)'),
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: language === 'en' ? 'bold' : 'normal'
              }}
            >
              EN
            </button>
          </div>

          {/* Indicador de perfil incompleto */}
          {user && !hasCreatorId && (
            <Link
              href="/register"
              style={{
                padding: '4px 12px',
                background: '#fbbf24',
                color: '#1f2937',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f59e0b'}
              onMouseOut={(e) => e.currentTarget.style.background = '#fbbf24'}
            >
              ⚡ {t.nav?.completeProfile || 'Completar perfil'}
            </Link>
          )}

          {!user && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                  padding: '0.5rem 1.2rem',
                  color: scrolled ? '#1f2937' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }}
                onMouseOver={(e) => {
                  if (!scrolled) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!scrolled) {
                    e.currentTarget.style.background = userMenuOpen 
                      ? 'rgba(255,255,255,0.2)' 
                      : 'rgba(255,255,255,0.1)';
                  }
                }}
              >
                <span>👤</span>
                <span>{creatorName || 'Usuario'}</span>
                <span style={{ 
                  fontSize: '0.7rem',
                  transition: 'transform 0.2s',
                  transform: userMenuOpen ? 'rotate(180deg)' : 'none'
                }}>▼</span>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'white',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  minWidth: '200px',
                  overflow: 'hidden',
                  border: '1px solid #eaeaea',
                }}>
                  <DropdownItem href="/profile" icon="👤">
                    {t.nav.profile}
                  </DropdownItem>
                  <DropdownItem href="/messages" icon="📬" badge={unreadCount}>
                    {t.nav.messages}
                  </DropdownItem>
                  {creatorId && (
                    <DropdownItem href={`/${creatorId}`} icon="🌐">
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
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <span style={{ fontSize: '1.1rem' }}>🔒</span>
                    {t.nav.logout}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: scrolled ? '#4f46e5' : 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
            className="mobile-menu-button"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          display: 'none',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '1rem',
          marginTop: '1rem',
          background: 'white',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid #eaeaea',
        }} className="mobile-menu">
          <MobileLink href="/" onClick={() => setMenuOpen(false)}>
            {t.nav.home}
          </MobileLink>
          {!user && (
            <>
              <MobileLink href="/auth/register" onClick={() => setMenuOpen(false)}>
                {t.nav.register}
              </MobileLink>
              <MobileLink href="/auth/login" onClick={() => setMenuOpen(false)}>
                {t.nav.login}
              </MobileLink>
            </>
          )}
          {user && (
            <>
              <MobileLink href="/search" onClick={() => setMenuOpen(false)}>
                {t.nav.search}
              </MobileLink>
              <MobileLink href="/verify" onClick={() => setMenuOpen(false)}>
                {t.nav.verify}
              </MobileLink>
              {hasCreatorId && (
                <MobileLink href="/works/new" onClick={() => setMenuOpen(false)}>
                  {t.nav.registerWork}
                </MobileLink>
              )}
              
              {/* Indicador de perfil incompleto en móvil */}
              {!hasCreatorId && (
                <MobileLink href="/register" onClick={() => setMenuOpen(false)}>
                  ⚡ {t.nav?.completeProfile || 'Completar perfil'}
                </MobileLink>
              )}
              
              <div style={{ height: '1px', background: '#eaeaea', margin: '8px 0' }} />
              <MobileLink href="/profile" onClick={() => setMenuOpen(false)}>
                👤 {t.nav.profile}
              </MobileLink>
              <MobileLink href="/messages" onClick={() => setMenuOpen(false)}>
                📬 {t.nav.messages} {unreadCount > 0 && `(${unreadCount})`}
              </MobileLink>
              {creatorId && (
                <MobileLink href={`/${creatorId}`} onClick={() => setMenuOpen(false)}>
                  🌐 {t.nav.publicProfile}
                </MobileLink>
              )}
              <button
                onClick={handleLogout}
                style={{
                  padding: '12px',
                  background: '#fef2f2',
                  color: '#ef4444',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                🔒 {t.nav.logout}
              </button>
            </>
          )}
          
          {/* Language selector in mobile */}
          <div style={{ 
            display: 'flex', 
            gap: '2px', 
            borderTop: '1px solid #eaeaea',
            paddingTop: '1rem',
            marginTop: '0.5rem'
          }}>
            <button
              onClick={() => changeLanguage('es')}
              style={{
                flex: 1,
                padding: '8px',
                background: language === 'es' ? '#4f46e5' : '#eaeaea',
                color: language === 'es' ? 'white' : '#333',
                border: 'none',
                cursor: 'pointer',
                fontWeight: language === 'es' ? 'bold' : 'normal'
              }}
            >
              ES
            </button>
            <button
              onClick={() => changeLanguage('en')}
              style={{
                flex: 1,
                padding: '8px',
                background: language === 'en' ? '#4f46e5' : '#eaeaea',
                color: language === 'en' ? 'white' : '#333',
                border: 'none',
                cursor: 'pointer',
                fontWeight: language === 'en' ? 'bold' : 'normal'
              }}
            >
              EN
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
          .mobile-menu {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}

// Componentes auxiliares
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

function DropdownItem({ href, icon, children, badge }: any) {
  return (
    <Link
      href={href}
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
        color: '#1f2937',
        textDecoration: 'none',
        padding: '12px',
        transition: 'background 0.2s',
        display: 'block',
      }}
      onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </Link>
  );
}