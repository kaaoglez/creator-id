"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/components/providers/AuthProvider'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  async function handleSearch(e: any) {
    e.preventDefault();
    setSearchError("");

    if (!searchQuery) return;

    const { data, error } = await supabase
      .from("creators")
      .select("creator_id")
      .eq("creator_id", searchQuery)
      .single();

    if (error || !data) {
      setSearchError(t.search.noResults);
      return;
    }

    router.push(`/${data.creator_id}`);
  }

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5, #10b981)",
          color: "white",
          textAlign: "center",
          padding: "80px 20px",
          margin: "20px",
        }}
      >
        <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>{t.home.title}</h1>
        <p style={{ fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto" }}>
          {t.home.subtitle}
        </p>

        <div style={{ marginTop: "30px" }}>
          <Link href="/auth/register">
            <button
              style={{
                padding: "15px 30px",
                fontSize: "16px",
                backgroundColor: "#fff",
                color: "#4f46e5",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                transition: "all 0.2s",
                marginRight: "15px"
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {t.auth.signUp}
            </button>
          </Link>
          
          <Link href="/auth/login">
            <button
              style={{
                padding: "15px 30px",
                fontSize: "16px",
                backgroundColor: "transparent",
                color: "white",
                border: "2px solid white",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.color = "#4f46e5";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "white";
              }}
            >
              {t.auth.signIn}
            </button>
          </Link>
        </div>
      </div>

      {/* Buscador - solo para usuarios autenticados */}
      {user && (
        <div style={{ marginTop: "50px", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "15px" }}>{t.home.searchTitle}</h2>
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.home.searchPlaceholder}
              style={{
                padding: "12px",
                border: "1px solid #ccc",
                width: "250px",
                fontSize: "16px",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "12px 25px",
                backgroundColor: "#4f46e5",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
              }}
            >
              {t.search.button}
            </button>
          </form>
          {searchError && <p style={{ color: "red", marginTop: "10px" }}>{searchError}</p>}
        </div>
      )}

      {/* Mensaje para no autenticados */}
      {!user && (
        <div style={{ 
          marginTop: "50px", 
          textAlign: "center",
          padding: "40px",
          background: "#f5f5f5",
        }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "15px", color: "#333" }}>
            {t.home.searchTitle}
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "20px" }}>
            {t.auth.signIn} {t.auth.orRegisterWith} {t.auth.signUp} {t.nav.search.toLowerCase()} {t.nav.verify.toLowerCase()}
          </p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <Link href="/auth/login">
              <button
                style={{
                  padding: "12px 25px",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {t.auth.signIn}
              </button>
            </Link>
            <Link href="/auth/register">
              <button
                style={{
                  padding: "12px 25px",
                  backgroundColor: "white",
                  color: "#4f46e5",
                  border: "2px solid #4f46e5",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {t.auth.signUp}
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Cómo funciona */}
      <section style={{ marginTop: "70px", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>{t.home.howItWorks}</h2>
        <ol
          style={{
            fontSize: "16px",
            color: "#555",
            lineHeight: "2",
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "left",
          }}
        >
          {t.home.steps.map((step: string, index: number) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>

      {/* Beneficios */}
      <section style={{ marginTop: "60px", textAlign: "center", paddingBottom: "40px" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>{t.home.whyTitle}</h2>
        <ul
          style={{
            fontSize: "16px",
            color: "#555",
            lineHeight: "1.8",
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "left",
          }}
        >
          {t.home.benefits.map((benefit: string, index: number) => (
            <li key={index}>{benefit}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}