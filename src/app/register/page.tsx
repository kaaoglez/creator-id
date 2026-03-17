'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { supabase } from "@/lib/supabase";
import { generateCreatorID } from "@/utils/generateCreatorID";
import Link from "next/link";
import { useLanguage } from '@/contexts/LanguageContext'
import { useQuery } from '@tanstack/react-query'

export default function Register() {
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [creatorId, setCreatorId] = useState("");
  const router = useRouter();
  const supabaseClient = createClient();
  const { t } = useLanguage()

  // Query para verificar usuario
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/auth/login?redirectTo=/register');
        return null;
      }
      return user;
    },
    staleTime: 5 * 60 * 1000,
  })

  // Query para obtener países
  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("name, country_code")
        .order("name");
      
      if (error) return [];
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hora (los países cambian poco)
  })

  // Query para verificar si ya existe Creator ID
  const { data: existingCreator } = useQuery({
    queryKey: ['existingCreator', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase
        .from("creators")
        .select("*")
        .eq("email", user.email)
        .single();
      return data;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  })

  // Formatear nombre completo (memoizado)
  const formatFullName = useCallback((value: string | FormDataEntryValue | null) => {
    if (!value) return "";
    return value.toString()
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, [])

  const handleSubmit = useCallback(async (e: any) => {
    e.preventDefault();
    setFormLoading(true);

    // ✅ Verificación de usuario
    if (!user) {
      alert(t.errors?.unauthorized || "Debes iniciar sesión primero");
      setFormLoading(false);
      router.push('/auth/login?redirectTo=/register');
      return;
    }

    const form = new FormData(e.target);
    const full_first_name = formatFullName(form.get("full_first_name"));
    const full_last_name = formatFullName(form.get("full_last_name"));
    const country_code = form.get("country_code")?.toString();

    if (!full_first_name || !full_last_name || !country_code) {
      alert(t.errors?.required || "Por favor completa todos los campos.");
      setFormLoading(false);
      return;
    }

    try {
      const { data: countryData, error: countryError } = await supabase
        .from("countries")
        .select("name, alpha3, region")
        .eq("country_code", country_code)
        .single();

      if (countryError || !countryData) {
        alert(t.errors?.countryNotFound || "Error: país no encontrado");
        setFormLoading(false);
        return;
      }

      const newCreatorId = generateCreatorID(country_code);

      // ✅ Insertar usando las nuevas columnas
      const { error } = await supabase.from("creators").insert([
        {
          full_first_name,
          full_last_name,
          first_name: full_first_name.split(' ')[0],
          last_name: full_last_name.split(' ')[0],
          email: user.email,
          country_code,
          country_name: countryData.name,
          alpha3: countryData.alpha3,
          region: countryData.region,
          creator_id: newCreatorId,
        },
      ]);

      if (error) {
        console.log(error);
        alert(t.errors?.creatorExists || "Error creando Creator ID. Puede que ya tengas uno.");
      } else {
        setCreatorId(newCreatorId);
        setSuccess(true);
      }
    } catch (error) {
      console.error(error);
      alert(t.errors?.genericError || "Error inesperado");
    } finally {
      setFormLoading(false);
    }
  }, [user, formatFullName, t, router])

  // Memoizar textos
  const texts = useMemo(() => ({
    title: t.register?.title || "Crear tu Creator ID",
    subtitle: t.register?.subtitle || "Completa tus datos para generar tu identificador único de creador.",
    firstName: t.register?.firstName || "Nombre completo",
    firstNamePlaceholder: t.register?.firstNamePlaceholder || "Ej: Juan Carlos",
    firstNameHelp: t.register?.firstNameHelp || "Puedes ingresar uno o varios nombres",
    lastName: t.register?.lastName || "Apellido completo",
    lastNamePlaceholder: t.register?.lastNamePlaceholder || "Ej: Pérez García",
    lastNameHelp: t.register?.lastNameHelp || "Puedes ingresar uno o varios apellidos",
    selectCountry: t.register?.selectCountry || "Selecciona tu país",
    button: formLoading ? (t.search?.searching || "Creando Creator ID...") : (t.register?.button || "Crear Creator ID"),
    footer: t.register?.footer || "Tu Creator ID será único y público. Lo usarás para registrar tus obras.",
    country: t.work?.country || "País"
  }), [t, formLoading])

  if (loadingUser || loadingCountries) {
    return (
      <div style={{ 
        maxWidth: "600px", 
        margin: "40px auto", 
        textAlign: "center",
        fontFamily: "sans-serif",
        padding: "40px"
      }}>
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
    );
  }

  if (existingCreator) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <div style={{
          background: "#e8f5e8",
          border: "2px solid #4caf50",
          padding: "30px",
          textAlign: "center"
        }}>
          <h1 style={{ color: "#2e7d32", marginBottom: "20px" }}>✅ {t.register?.alreadyHave || "Ya tienes un Creator ID"}</h1>
          
          <div style={{
            background: "white",
            padding: "20px",
            marginBottom: "20px"
          }}>
            <p><strong>{t.profile?.yourCreatorId || "Tu Creator ID"}:</strong></p>
            <code style={{
              background: "#333",
              color: "#0f0",
              padding: "10px 20px",
              fontSize: "1.5rem",
              display: "inline-block",
              marginBottom: "15px"
            }}>
              {existingCreator.creator_id}
            </code>
            <p><strong>{t.profile?.personalInfo || "Nombre completo"}:</strong> {existingCreator.full_first_name || existingCreator.first_name} {existingCreator.full_last_name || existingCreator.last_name}</p>
            <p><strong>{t.work?.country || "País"}:</strong> {existingCreator.country_name}</p>
          </div>

          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <Link
              href={`/${existingCreator.creator_id}`}
              style={{
                padding: "12px 24px",
                background: "#4f46e5",
                color: "white",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              {t.nav?.publicProfile || "Ver mi perfil público"}
            </Link>
            <Link
              href="/works/new"
              style={{
                padding: "12px 24px",
                background: "#10b981",
                color: "white",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              {t.nav?.registerWork || "Registrar obra"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <div style={{
          background: "#e8f5e8",
          border: "2px solid #4caf50",
          padding: "30px",
          textAlign: "center"
        }}>
          <h1 style={{ color: "#2e7d32", marginBottom: "20px" }}>🎉 {t.register?.success || "¡Creator ID creado exitosamente!"}</h1>
          
          <div style={{
            background: "white",
            padding: "20px",
            marginBottom: "20px"
          }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "10px" }}>{t.register?.yourId || "Tu identificador único"}:</p>
            <code style={{
              background: "#333",
              color: "#0f0",
              padding: "15px 30px",
              fontSize: "2rem",
              fontWeight: "bold",
              display: "inline-block",
              marginBottom: "20px"
            }}>
              {creatorId}
            </code>
            <p>{t.register?.saveId || "Guarda este ID, lo necesitarás para registrar tus obras."}</p>
          </div>

          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href={`/${creatorId}`}
              style={{
                padding: "12px 24px",
                background: "#4f46e5",
                color: "white",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              {t.nav?.publicProfile || "Ver mi perfil público"}
            </Link>
            <Link
              href="/works/new"
              style={{
                padding: "12px 24px",
                background: "#10b981",
                color: "white",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              {t.profile?.registerFirst || "Registrar mi primera obra"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1 style={{ 
        fontSize: "2rem", 
        marginBottom: "10px",
        background: "linear-gradient(135deg, #4f46e5, #10b981)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "inline-block"
      }}>
        {texts.title}
      </h1>
      
      <p style={{ color: "#666", marginBottom: "30px" }}>
        {texts.subtitle}
        {user && <span> {t.auth?.email || "Email"}: <strong>{user.email}</strong></span>}
      </p>

      <form onSubmit={handleSubmit} style={{
        background: "white",
        padding: "30px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            {texts.firstName} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            name="full_first_name"
            placeholder={texts.firstNamePlaceholder}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e0e0e0",
              fontSize: "1rem",
              transition: "border-color 0.2s",
              boxSizing: "border-box"
            }}
            onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
            onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
          />
          <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
            {texts.firstNameHelp}
          </small>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            {texts.lastName} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            name="full_last_name"
            placeholder={texts.lastNamePlaceholder}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e0e0e0",
              fontSize: "1rem",
              transition: "border-color 0.2s",
              boxSizing: "border-box"
            }}
            onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
            onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
          />
          <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
            {texts.lastNameHelp}
          </small>
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            {texts.country} <span style={{ color: "red" }}>*</span>
          </label>
          <select
            name="country_code"
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e0e0e0",
              fontSize: "1rem",
              backgroundColor: "white",
              cursor: "pointer",
              boxSizing: "border-box"
            }}
          >
            <option value="">{texts.selectCountry}</option>
            {countries.map((c) => (
              <option key={c.country_code} value={c.country_code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={formLoading}
          style={{
            width: "100%",
            padding: "14px",
            background: formLoading ? "#ccc" : "linear-gradient(135deg, #4f46e5, #10b981)",
            color: "white",
            border: "none",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: formLoading ? "not-allowed" : "pointer",
            transition: "transform 0.2s",
            transform: formLoading ? "none" : "scale(1)"
          }}
          onMouseOver={(e) => !formLoading && (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseOut={(e) => !formLoading && (e.currentTarget.style.transform = "scale(1)")}
        >
          {texts.button}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px", color: "#666", fontSize: "0.9rem" }}>
        {texts.footer}
      </p>
    </div>
  );
}