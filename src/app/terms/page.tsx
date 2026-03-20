'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function TermsPage() {
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
        📜 Términos de Uso
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
        <h2>1. Aceptación de los Términos</h2>
        <p>Al acceder y utilizar Creator-ID, aceptas cumplir con estos Términos de Uso. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestra plataforma.</p>

        <h2>2. Registro y Cuenta</h2>
        <p>Para utilizar nuestros servicios, debes registrarte proporcionando información veraz y actualizada. Eres responsable de mantener la confidencialidad de tu cuenta y de todas las actividades que ocurran bajo ella.</p>

        <h2>3. Creator ID</h2>
        <p>Al registrarte, recibirás un Creator ID único. Este ID es personal e intransferible. No puedes utilizar un ID que pertenezca a otra persona ni crear múltiples cuentas fraudulentas.</p>

        <h2>4. Contenido y Obras</h2>
        <p>Eres el único responsable del contenido que publicas, incluyendo obras, descripciones e imágenes. Al publicar, garantizas que tienes los derechos necesarios sobre la obra. Creator-ID no reclama propiedad sobre tus obras.</p>

        <h2>5. Ventas y Royalty</h2>
        <p>Al vender una obra a través de nuestra plataforma, aceptas una comisión del 25% sobre el precio de venta. El 75% restante será para ti. Los pagos se procesarán a través de nuestros sistemas de pago integrados.</p>

        <h2>6. Conducta Prohibida</h2>
        <p>No está permitido publicar contenido ilegal, ofensivo, discriminatorio, o que infrinja derechos de propiedad intelectual. Tampoco se permite el acoso a otros usuarios o el uso de la plataforma para actividades fraudulentas.</p>

        <h2>7. Propiedad Intelectual</h2>
        <p>Creator-ID respeta los derechos de propiedad intelectual. Si crees que tu trabajo ha sido utilizado sin autorización, contáctanos para resolver la situación.</p>

        <h2>8. Modificaciones del Servicio</h2>
        <p>Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier momento, con o sin previo aviso. No seremos responsables ante ti o terceros por cualquier modificación o suspensión del servicio.</p>

        <h2>9. Cancelación y Eliminación de Cuenta</h2>
        <p>Puedes eliminar tu cuenta en cualquier momento desde tu perfil. Esta acción es irreversible y eliminará todas tus obras y datos asociados. Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos.</p>

        <h2>10. Limitación de Responsabilidad</h2>
        <p>Creator-ID no se hace responsable por pérdidas indirectas, daños emergentes o lucro cesante derivados del uso de nuestra plataforma. Nuestra responsabilidad máxima se limita al monto pagado por comisiones en los últimos 12 meses.</p>

        <h2>11. Cambios en los Términos</h2>
        <p>Podemos actualizar estos términos ocasionalmente. Te notificaremos de cambios significativos a través de la plataforma o por correo electrónico. El uso continuado del servicio después de los cambios constituye tu aceptación.</p>

        <h2>12. Contacto</h2>
        <p>Para preguntas sobre estos términos, contáctanos a través de nuestra página de contacto.</p>
      </div>
    </div>
  )
}