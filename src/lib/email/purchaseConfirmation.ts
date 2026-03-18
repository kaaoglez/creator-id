import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface PurchaseEmailProps {
  to: string
  buyerName: string
  workTitle: string
  downloadUrl: string
  amount: number
}

export async function sendPurchaseConfirmation({
  to,
  buyerName,
  workTitle,
  downloadUrl,
  amount
}: PurchaseEmailProps) {
  console.log('📧 Iniciando envío de email...')
  console.log('📧 Para:', to)
  console.log('📧 Comprador:', buyerName)
  console.log('📧 Obra:', workTitle)
  console.log('📧 URL descarga:', downloadUrl)
  console.log('📧 Monto:', amount)
  console.log('📧 API Key existe:', !!process.env.RESEND_API_KEY)

  try {
    const { data, error } = await resend.emails.send({
      from: 'Creator ID <onboarding@resend.dev>',
      to: [to],
      subject: `✅ ¡Gracias por tu compra! - ${workTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4f46e5, #10b981); color: white; padding: 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ ¡Compra exitosa!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${buyerName}</strong>,</p>
              <p>Gracias por tu compra en <strong>Creator ID</strong>. Aquí están los detalles de tu transacción:</p>
              
              <div style="background: white; padding: 20px; margin: 20px 0;">
                <p><strong>Obra:</strong> ${workTitle}</p>
                <p><strong>Monto:</strong> $${amount.toFixed(2)} USD</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <p>Puedes descargar tu obra usando el siguiente enlace:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${downloadUrl}" class="button" download>
                  ⬇️ Descargar obra
                </a>
              </div>

              <p style="color: #666; font-size: 0.9rem;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <span style="word-break: break-all;">${downloadUrl}</span>
              </p>

              <p style="color: #666; font-size: 0.9rem;">
                Este enlace es de un solo uso. Si tienes problemas con la descarga, responde a este email.
              </p>
            </div>
            <div class="footer">
              <p>Creator ID - Identidad digital para creadores</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('❌ Error enviando email:', error)
      return { success: false, error }
    }

    console.log('✅ Email enviado correctamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error en función de email:', error)
    return { success: false, error }
  }
}