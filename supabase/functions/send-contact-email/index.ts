import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const handler = async (req: Request): Promise<Response> => {
  // Objeto para acumular logs de depuración
  const debug: string[] = []
  
  try {
    debug.push('1. Función iniciada')
    debug.push('2. Método: ' + req.method)

    // Verificar API key
    if (!RESEND_API_KEY) {
      debug.push('3. ERROR: API Key no encontrada')
      return new Response(
        JSON.stringify({ error: 'API Key no configurada', debug }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    debug.push('3. API Key OK')

    // Solo aceptar POST
    if (req.method !== 'POST') {
      debug.push('4. Método incorrecto: ' + req.method)
      return new Response(
        JSON.stringify({ error: 'Método no permitido', debug }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Leer body
    debug.push('5. Leyendo body...')
    let body
    try {
      body = await req.json()
      debug.push('6. Body recibido: ' + JSON.stringify(body))
    } catch (e) {
      debug.push('6. ERROR al parsear JSON: ' + e.message)
      return new Response(
        JSON.stringify({ error: 'JSON inválido', debug }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { to, fromName, fromEmail, message, creatorName } = body

    // Validar campos
    if (!to || !fromName || !fromEmail || !message || !creatorName) {
      debug.push('7. Faltan campos requeridos')
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos', debug }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    debug.push('7. Campos validados OK')

    // Enviar email usando Resend
    debug.push('8. Preparando envío a Resend...')
    
    const emailData = {
      from: 'Creator ID <onboarding@resend.dev>',
      to: [to],
      subject: `Nuevo mensaje de ${fromName} sobre tu perfil en Creator ID`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Nuevo mensaje de contacto</h2>
          <p><strong>De:</strong> ${fromName} (${fromEmail})</p>
          <p><strong>Mensaje:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 0.9rem;">
            Puedes responder directamente a ${fromEmail}
          </p>
        </div>
      `
    }
    debug.push('9. Email data: ' + JSON.stringify(emailData).substring(0, 200) + '...')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData)
    })

    const data = await res.json()
    debug.push('10. Respuesta de Resend - Status: ' + res.status)
    debug.push('11. Respuesta de Resend - Data: ' + JSON.stringify(data))

    if (!res.ok) {
      debug.push('12. ERROR de Resend: ' + (data.message || 'Error desconocido'))
      return new Response(
        JSON.stringify({ error: data.message || 'Error al enviar email', debug }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    debug.push('13. Email enviado correctamente')
    return new Response(
      JSON.stringify({ success: true, debug }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    debug.push('14. ERROR en catch: ' + error.message)
    return new Response(
      JSON.stringify({ error: error.message, debug }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

serve(handler)