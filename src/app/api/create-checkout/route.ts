import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { workId, buyerName, buyerEmail, successUrl, cancelUrl } = await req.json()

    if (!workId || !buyerName || !buyerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Obtener datos de la obra
    const supabase = await createClient()
    const { data: work, error } = await supabase
      .from('works')
      .select('*, creators(email)')
      .eq('id', workId)
      .single()

    if (error || !work) {
      console.error('Error fetching work:', error)
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      )
    }

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: work.title,
              description: work.description || 'Obra digital',
              images: work.file_url ? [work.file_url] : [],
            },
            unit_amount: Math.round(work.price * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: buyerEmail,
      metadata: {
        work_id: work.id.toString(),
        creator_id: work.creator_id,
        buyer_name: buyerName,
      },
    })

    // Crear registro de compra en estado 'pending'
    await supabase
      .from('purchases')
      .insert({
        work_id: work.id,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        amount: work.price,
        status: 'pending',
        stripe_session_id: session.id,
      })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    )
  }
}