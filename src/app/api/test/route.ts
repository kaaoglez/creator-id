import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  console.log('🔵 TEST ENDPOINT')
  
  try {
    const supabase = await createClient()
    
    // Probar insert
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        work_id: 1,
        buyer_name: 'Test API',
        buyer_email: 'test@api.com',
        amount: 99.99,
        status: 'test',
        stripe_session_id: 'api_test_' + Date.now()
      })
      .select()
    
    if (error) {
      console.log('❌ Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.log('❌ Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}