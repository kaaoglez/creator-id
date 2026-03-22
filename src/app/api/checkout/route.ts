import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import Paypal from '@paypal/checkout-server-sdk'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Configuración PayPal
const paypalClient = () => {
  const environment = new Paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID!,
    process.env.PAYPAL_CLIENT_SECRET!
  )
  return new Paypal.core.PayPalHttpClient(environment)
}

export async function POST(req: Request) {
  try {
    const { workId, workTitle, price, creatorId, creatorName, paymentMethod } = await req.json()

    let paymentUrl = ''

    switch (paymentMethod) {
      case 'card':
      case 'stripe':
        // Stripe Checkout
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: workTitle,
                  description: `Obra de ${creatorName}`,
                },
                unit_amount: Math.round(price * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/work/${workId}?success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/work/${workId}?canceled=true`,
          metadata: { workId, creatorId, paymentMethod },
        })
        paymentUrl = session.url
        break

      case 'paypal':
        // PayPal Checkout
        const request = new Paypal.orders.OrdersCreateRequest()
        request.requestBody({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: price.toString(),
            },
            description: workTitle,
            custom_id: workId,
          }],
          application_context: {
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/work/${workId}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/work/${workId}?canceled=true`,
          },
        })

        const order = await paypalClient().execute(request)
        const approvalUrl = order.result.links.find((link: any) => link.rel === 'approve')
        paymentUrl = approvalUrl.href
        break

      case 'usdc':
        // Crypto con USDC (ejemplo con Solana Pay o similar)
        paymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/crypto/${workId}?amount=${price}`
        break

      default:
        throw new Error('Método de pago no soportado')
    }

    return NextResponse.json({ url: paymentUrl, paymentMethod })
  } catch (err: any) {
    console.error('Error creating checkout:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}