'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useLanguage } from '@/contexts/LanguageContext'
import { debounce } from 'lodash'
import Pagination from '@/components/Pagination'

// Mapa de países (constante fuera del componente para evitar recreación)
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"name" | "id" | "email">("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const itemsPerPage = 10; // 10 resultados por página
  const router = useRouter();
  const { t } = useLanguage();

  // Detectar tamaño de pantalla para responsive
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Función de búsqueda memoizada
  const searchCreators = useCallback(async () => {
    if (!query.trim()) return [];

    let queryBuilder = supabase
      .from("creators")
      .select("creator_id, full_first_name, full_last_name, email, country_code, created_at")
      .limit(20);

    if (searchMode === "name") {
      queryBuilder = queryBuilder
        .or(`full_first_name.ilike.%${query}%,full_last_name.ilike.%${query}%`);
    } else if (searchMode === "id") {
      queryBuilder = queryBuilder
        .ilike("creator_id", `%${query}%`);
    } else {
      queryBuilder = queryBuilder
        .ilike("email", `%${query}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return data || [];
  }, [query, searchMode]);

  // Query con React Query
  const { data: results = [], isLoading, error, refetch } = useQuery({
    queryKey: ['search', query, searchMode],
    queryFn: searchCreators,
    enabled: query.trim().length > 0, // Solo ejecutar si hay query
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  // Debounce para evitar búsquedas en cada tecla
  const debouncedSearch = useMemo(
    () => debounce(() => refetch(), 300),
    [refetch]
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      debouncedSearch();
    }
  }, [query, debouncedSearch]);

  // Mapear resultados con nombres de países
  const mappedResults = useMemo(() => 
    results.map((r) => ({
      ...r,
      country_name: countryMap[r.country_code] || r.country_code,
      display_name: r.full_first_name && r.full_last_name 
        ? `${r.full_first_name} ${r.full_last_name}`
        : `${r.full_first_name || ''} ${r.full_last_name || ''}`.trim()
    })),
    [results]
  );

  // Paginación
  const totalPages = Math.ceil(mappedResults.length / itemsPerPage);
  const paginatedResults = mappedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResultClick = useCallback((creatorId: string) => {
    router.push(`/${creatorId}`);
  }, [router]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "40px auto", 
      padding: isMobile ? "0 15px" : "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      <h1 style={{ 
        fontSize: isMobile ? "2rem" : "2.5rem", 
        marginBottom: "30px",
        background: "linear-gradient(135deg, #4f46e5, #10b981)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "inline-block"
      }}>
        🔍 {t.search.title}
      </h1>

      {/* Selector de modo de búsqueda */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "20px",
        background: "#f5f5f5",
        padding: "10px",
        flexWrap: "wrap"
      }}>
        <ModeButton
          mode="name"
          currentMode={searchMode}
          onClick={setSearchMode}
          label={t.search.byName}
          icon="👤"
          isMobile={isMobile}
        />
        <ModeButton
          mode="id"
          currentMode={searchMode}
          onClick={setSearchMode}
          label={t.search.byId}
          icon="🆔"
          isMobile={isMobile}
        />
        <ModeButton
          mode="email"
          currentMode={searchMode}
          onClick={setSearchMode}
          label={t.search.byEmail}
          icon="📧"
          isMobile={isMobile}
        />
      </div>

      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearch} style={{ marginBottom: "30px" }}>
        <div style={{
          display: "flex",
          gap: "10px",
          flexDirection: isMobile ? "column" : "row"
        }}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) {
                debouncedSearch();
              }
            }}
            placeholder={
              searchMode === "name" ? t.search.placeholder.name :
              searchMode === "id" ? t.search.placeholder.id :
              t.search.placeholder.email
            }
            style={{
              flex: 1,
              padding: isMobile ? "12px" : "15px",
              fontSize: "1rem",
              border: "2px solid #e0e0e0",
              outline: "none",
              borderRadius: isMobile ? "4px" : "4px 0 0 4px",
              width: "100%"
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: isMobile ? "12px" : "15px 30px",
              background: isLoading ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
              color: "white",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s',
              borderRadius: isMobile ? "4px" : "0 4px 4px 0",
              width: isMobile ? "100%" : "auto"
            }}
          >
            {isLoading ? t.search.searching : t.search.button}
          </button>
        </div>
      </form>

      {/* Mensaje de error */}
      {error && (
        <div style={{
          padding: "15px",
          background: "#ffebee",
          color: "#c62828",
          marginBottom: "20px",
          textAlign: "center",
          borderRadius: "4px"
        }}>
          {error instanceof Error ? error.message : t.search.error}
        </div>
      )}

      {/* Resultados */}
      {!isLoading && mappedResults.length > 0 && (
        <div>
          <h2 style={{ marginBottom: "20px" }}>
            {t.search.results} ({mappedResults.length})
          </h2>
          
          <div style={{ display: "grid", gap: "15px" }}>
            {paginatedResults.map((r) => (
              <ResultCard
                key={r.creator_id}
                result={r}
                onClick={handleResultClick}
                t={t}
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

          {/* Info de resultados */}
          <p style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.9rem',
            marginTop: '20px'
          }}>
            Mostrando {paginatedResults.length} de {mappedResults.length} resultados
          </p>
        </div>
      )}

      {/* Mensaje de no resultados */}
      {!isLoading && query.trim() && mappedResults.length === 0 && !error && (
        <div style={{
          padding: "40px",
          textAlign: "center",
          color: "#666",
          background: "#f9f9f9",
          borderRadius: "8px"
        }}>
          {t.search.noResults}
        </div>
      )}
    </div>
  );
}

// Componente botón de modo memoizado
const ModeButton = ({ mode, currentMode, onClick, label, icon, isMobile }: any) => {
  const isActive = mode === currentMode;
  
  return (
    <button
      onClick={() => onClick(mode)}
      style={{
        flex: 1,
        padding: isMobile ? "10px" : "12px",
        background: isActive ? "linear-gradient(135deg, #4f46e5, #10b981)" : "white",
        color: isActive ? "white" : "#333",
        border: "none",
        cursor: "pointer",
        fontWeight: isActive ? "bold" : "normal",
        minWidth: isMobile ? "80px" : "100px",
        transition: 'all 0.2s',
        borderRadius: "4px"
      }}
    >
      {icon} {label}
    </button>
  );
};

// Componente tarjeta de resultado memoizado
const ResultCard = ({ result, onClick, t, isMobile }: any) => {
  return (
    <div
      onClick={() => onClick(result.creator_id)}
      style={{
        padding: isMobile ? "15px" : "20px",
        background: "white",
        border: "1px solid #e0e0e0",
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        borderRadius: "8px"
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
      }}
    >
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "15px" : "0"
      }}>
        <div style={{ width: isMobile ? "100%" : "auto" }}>
          <h3 style={{ 
            margin: "0 0 8px 0", 
            color: "#333",
            fontSize: isMobile ? "1.2rem" : "1.3rem"
          }}>
            {result.display_name}
          </h3>
          
          <div style={{ 
            display: "flex", 
            gap: isMobile ? "10px" : "15px", 
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row"
          }}>
            <p style={{ margin: "5px 0", color: "#666", fontSize: isMobile ? "0.9rem" : "1rem" }}>
              <strong>🆔 ID:</strong>{" "}
              <code style={{ 
                background: "#f0f0f0", 
                padding: "2px 6px", 
                color: "#4f46e5",
                borderRadius: "4px"
              }}>
                {result.creator_id}
              </code>
            </p>
            
            <p style={{ margin: "5px 0", color: "#666", fontSize: isMobile ? "0.9rem" : "1rem" }}>
              <strong>📧 {t.search.byEmail}:</strong> {result.email}
            </p>
            
            <p style={{ margin: "5px 0", color: "#666", fontSize: isMobile ? "0.9rem" : "1rem" }}>
              <strong>🌍 {t.work.country}:</strong> {result.country_name}
            </p>
          </div>
        </div>
        
        <span style={{
          color: "#4f46e5",
          fontWeight: "bold",
          fontSize: isMobile ? "0.9rem" : "1rem",
          alignSelf: isMobile ? "flex-start" : "center"
        }}>
          {t.search.viewProfile} →
        </span>
      </div>
    </div>
  );
};