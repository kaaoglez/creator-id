import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { sendPurchaseConfirmation } from '@/lib/email/purchaseConfirmation'
import { sendSaleNotification } from '@/lib/email/saleNotification'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  console.log('🔵 WEBHOOK RECIBIDO - INICIO')
  
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    if (!signature) {
      console.log('❌ No signature')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('✅ Evento válido:', event.type)

    if (event.type === 'checkout.session.completed') {
      console.log('💰 Checkout completado - Procesando...')
      
      const session = event.data.object as Stripe.Checkout.Session
      
      const workId = session.metadata?.work_id
      const buyerName = session.metadata?.buyer_name
      const buyerEmail = session.customer_email || session.metadata?.buyer_email

      console.log('📦 Metadata:', { workId, buyerName, buyerEmail })

      if (!workId || !buyerEmail) {
        console.log('❌ Missing metadata')
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      const supabase = await createClient()
      console.log('✅ Cliente Supabase creado')

      // Obtener datos completos de la obra y el creador
      const { data: work, error: workError } = await supabase
        .from('works')
        .select('*, creators(*)')
        .eq('id', workId)
        .single()

      if (workError || !work) {
        console.log('❌ Obra no encontrada:', workError)
        return NextResponse.json({ error: 'Work not found' }, { status: 404 })
      }

      console.log('📎 Obra encontrada:', { 
        title: work.title, 
        creator_email: work.creators.email,
        creator_name: work.creators.full_first_name
      })

      // Calcular comisiones
      const amount = work.price || 0
      const platformFee = amount * 0.25
      const creatorEarnings = amount * 0.75

      // Buscar si ya existe la compra
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single()

      let result

      if (existingPurchase) {
        // Actualizar compra existente
        console.log('🔄 Actualizando compra existente:', existingPurchase.id)
        result = await supabase
          .from('purchases')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
            creator_id: work.creator_id,
            work_title: work.title,
            platform_fee: platformFee,
            creator_earnings: creatorEarnings
          })
          .eq('stripe_session_id', session.id)
      } else {
        // Insertar nueva compra
        console.log('➕ Insertando nueva compra')
        result = await supabase
          .from('purchases')
          .insert({
            work_id: parseInt(workId),
            buyer_name: buyerName || 'Cliente',
            buyer_email: buyerEmail,
            amount: amount,
            status: 'completed',
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            completed_at: new Date().toISOString(),
            creator_id: work.creator_id,
            work_title: work.title,
            platform_fee: platformFee,
            creator_earnings: creatorEarnings
          })
      }

      if (result.error) {
        console.log('❌ Error en base de datos:', result.error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      console.log('✅ Compra registrada/actualizada correctamente')

      // Enviar email de confirmación al comprador
      if (work.file_url) {
        console.log('📧 Enviando email de confirmación al comprador:', buyerEmail)
        
        await sendPurchaseConfirmation({
          to: buyerEmail,
          buyerName: buyerName || 'Cliente',
          workTitle: work.title,
          downloadUrl: work.file_url,
          amount: amount
        })
      }

      // 📨 ENVIAR NOTIFICACIÓN AL CREADOR
      console.log('📧 Enviando notificación de venta al creador:', work.creators.email)
      
      // Formatear nombre del creador
      const creatorFullName = work.creators.full_first_name && work.creators.full_last_name
        ? `${work.creators.full_first_name} ${work.creators.full_last_name}`
        : 'Creador'

      await sendSaleNotification({
        to: work.creators.email,
        creatorName: creatorFullName,
        buyerName: buyerName || 'Comprador',
        buyerEmail: buyerEmail,
        workTitle: work.title,
        amount: amount,
        platformFee: platformFee,
        earnings: creatorEarnings,
        saleDate: new Date(),
        workId: work.id
      })

      console.log('✅ Proceso completado - Comprador y creador notificados')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}