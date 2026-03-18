import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SaleNotificationProps {
  to: string
  creatorName: string
  buyerName: string
  buyerEmail: string
  workTitle: string
  amount: number
  platformFee: number
  earnings: number
  saleDate: Date
  workId: number
}

export async function sendSaleNotification({
  to,
  creatorName,
  buyerName,
  buyerEmail,
  workTitle,
  amount,
  platformFee,
  earnings,
  saleDate,
  workId
}: SaleNotificationProps) {
  console.log('📧 Enviando notificación de venta a creador:', to)

  const formattedDate = saleDate.toLocaleDateString('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  try {
    const { data, error } = await resend.emails.send({
      from: 'Creator ID <notificaciones@creator-id.vercel.app>',
      to: [to],
      subject: `💰 ¡Nueva venta! - ${workTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4f46e5, #10b981); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .sale-details { background: #f9fafb; padding: 20px; margin: 20px 0; border-left: 4px solid #4f46e5; }
            .sale-details p { margin: 8px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #2e7d32; }
            .fee-breakdown { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: white; border: 1px solid #eaeaea; }
            .fee-item { text-align: center; flex: 1; }
            .fee-item .label { font-size: 14px; color: #666; }
            .fee-item .value { font-size: 18px; font-weight: bold; color: #333; }
            .earnings { background: #e8f5e8; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; color: #2e7d32; border: 1px solid #a5d6a7; }
            .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; border-top: 1px solid #eaeaea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 ¡Nueva venta!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${creatorName}</strong>,</p>
              <p>¡Felicitaciones! Alguien acaba de comprar tu obra.</p>

              <div class="sale-details">
                <p><strong>Obra vendida:</strong> ${workTitle}</p>
                <p><strong>Comprador:</strong> ${buyerName} (${buyerEmail})</p>
                <p><strong>Fecha:</strong> ${formattedDate}</p>
                <p><strong>Monto total:</strong> <span class="amount">$${amount.toFixed(2)} USD</span></p>
              </div>

              <div class="fee-breakdown">
                <div class="fee-item">
                  <div class="label">Total</div>
                  <div class="value">$${amount.toFixed(2)}</div>
                </div>
                <div class="fee-item">
                  <div class="label">Comisión (25%)</div>
                  <div class="value">$${platformFee.toFixed(2)}</div>
                </div>
                <div class="fee-item">
                  <div class="label">Tus ganancias</div>
                  <div class="value">$${earnings.toFixed(2)}</div>
                </div>
              </div>

              <div class="earnings">
                💰 Has ganado $${earnings.toFixed(2)} USD
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://creator-id.vercel.app/profile" class="button">
                  Ver todas tus ventas
                </a>
              </div>
            </div>
            <div class="footer">
              <p>Creator ID - Tu plataforma de identidad digital</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('❌ Error enviando notificación:', error)
      return { success: false, error }
    }

    console.log('✅ Notificación enviada:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error:', error)
    return { success: false, error }
  }
}