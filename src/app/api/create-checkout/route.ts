import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(req: Request) {
  try {
    const { workId, workTitle, price, creatorId, creatorName } = await req.json()

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
      metadata: {
        workId,
        creatorId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Error creating checkout session:', err)
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 })
  }
}