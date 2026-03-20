'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function PrivacyPage() {
  const { t } = useLanguage()

  return (
    <div style={{ 
      maxWidth: "800px", 
      margin: "40px auto", 
      padding: "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      <h1 style={{ 
        fontSize: "2.5rem", 
        marginBottom: "20px",
        background: "linear-gradient(135deg, #4f46e5, #10b981)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "inline-block"
      }}>
        🔒 Política de Privacidad
      </h1>
      
      <p style={{ color: '#666', marginBottom: '40px' }}>
        Última actualización: 20 de marzo de 2026
      </p>

      <div style={{
        background: 'white',
        padding: '30px',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        lineHeight: '1.6',
        color: '#333'
      }}>
        <h2>1. Información que Recopilamos</h2>
        <p><strong>Información de registro:</strong> Nombre, email, país, región, teléfono (opcional) y Creator ID generado automáticamente.</p>
        <p><strong>Información de obras:</strong> Títulos, descripciones, archivos subidos y precios establecidos.</p>
        <p><strong>Información de uso:</strong> Visitas a perfiles y obras, mensajes enviados, transacciones realizadas.</p>
        <p><strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, dispositivo y datos de uso anonimizados.</p>

        <h2>2. Cómo Usamos tu Información</h2>
        <p>✅ Para proporcionar y mantener nuestros servicios.</p>
        <p>✅ Para gestionar tu cuenta y obras registradas.</p>
        <p>✅ Para procesar transacciones y pagos.</p>
        <p>✅ Para mejorar y personalizar tu experiencia.</p>
        <p>✅ Para comunicarnos contigo sobre actualizaciones importantes.</p>
        <p>✅ Para prevenir fraudes y garantizar la seguridad de la plataforma.</p>

        <h2>3. Compartir Información</h2>
        <p>No vendemos tu información personal a terceros. Podemos compartir información en los siguientes casos:</p>
        <p>• Con tu consentimiento explícito.</p>
        <p>• Para cumplir con obligaciones legales.</p>
        <p>• Con proveedores de servicios que nos ayudan a operar (como Stripe para pagos).</p>
        <p>• Para proteger los derechos y seguridad de Creator-ID y sus usuarios.</p>

        <h2>4. Datos Públicos</h2>
        <p>Tu nombre, Creator ID, país, obras registradas y perfil público son visibles para cualquier visitante de la plataforma. Tu email y teléfono solo son visibles para ti y se comparten solo cuando contactas a otros usuarios.</p>

        <h2>5. Seguridad de los Datos</h2>
        <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información. Tus contraseñas se almacenan de forma cifrada y utilizamos conexiones HTTPS para todas las comunicaciones.</p>

        <h2>6. Almacenamiento de Datos</h2>
        <p>Tus datos se almacenan en servidores seguros de Supabase. Conservamos tu información mientras tu cuenta esté activa. Al eliminar tu cuenta, todos tus datos personales y obras se eliminan permanentemente.</p>

        <h2>7. Tus Derechos</h2>
        <p>✔️ Acceder a tus datos personales.</p>
        <p>✔️ Corregir información inexacta.</p>
        <p>✔️ Eliminar tu cuenta y datos asociados.</p>
        <p>✔️ Oponerte al procesamiento de tus datos.</p>
        <p>✔️ Exportar tus datos en formato estructurado.</p>

        <h2>8. Cookies y Tecnologías Similares</h2>
        <p>Utilizamos cookies para autenticación, recordar preferencias y analizar el uso de la plataforma. Puedes configurar tu navegador para rechazar cookies, pero esto puede afectar la funcionalidad del servicio.</p>

        <h2>9. Enlaces a Terceros</h2>
        <p>Nuestra plataforma puede contener enlaces a sitios externos. No somos responsables de las prácticas de privacidad de esos sitios.</p>

        <h2>10. Menores de Edad</h2>
        <p>Creator-ID no está dirigido a menores de 18 años. No recopilamos conscientemente información de menores. Si eres padre/madre y crees que tu hijo nos ha proporcionado datos, contáctanos.</p>

        <h2>11. Cambios a esta Política</h2>
        <p>Actualizaremos esta política ocasionalmente. Te notificaremos cambios significativos a través de la plataforma o por correo electrónico. La fecha de la última actualización se muestra al inicio.</p>

        <h2>12. Contacto</h2>
        <p>Para preguntas sobre privacidad, contáctanos a través de nuestra página de contacto o escribe a: <strong>privacy@creator-id.com</strong></p>
      </div>
    </div>
  )
}