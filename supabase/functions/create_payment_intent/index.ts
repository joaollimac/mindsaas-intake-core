import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYNCPAY_BASE_URL = Deno.env.get('SYNCPAY_BASE_URL')
const SYNCPAY_CLIENT_ID = Deno.env.get('SYNCPAY_CLIENT_ID')
const SYNCPAY_CLIENT_SECRET = Deno.env.get('SYNCPAY_CLIENT_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    // Verifica método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Obtém o token de autenticação do header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Cria cliente Supabase com o token do usuário
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    })

    // Verifica o usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Lê o body
    const { session_id } = await req.json()
    if (!session_id) {
      return new Response(JSON.stringify({ error: 'session_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Valida variáveis de ambiente do SyncPay
    if (!SYNCPAY_BASE_URL || !SYNCPAY_CLIENT_ID || !SYNCPAY_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: 'SyncPay configuration missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Autentica no SyncPay
    const authResponse = await fetch(`${SYNCPAY_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SYNCPAY_CLIENT_ID,
        client_secret: SYNCPAY_CLIENT_SECRET,
      }),
    })

    if (!authResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to authenticate with SyncPay' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { access_token } = await authResponse.json()

    // Cria cobrança Pix no SyncPay
    const paymentResponse = await fetch(`${SYNCPAY_BASE_URL}/payments/pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        amount: 100, // Valor em centavos (ajuste conforme necessário)
        description: `Pagamento para sessão ${session_id}`,
        external_reference: session_id,
        metadata: {
          session_id,
        },
      }),
    })

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      return new Response(JSON.stringify({ error: `SyncPay error: ${errorText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const paymentData = await paymentResponse.json()

    // Extrai dados do pagamento
    const provider_transaction_id = paymentData.id || paymentData.transaction_id
    const qr_code = paymentData.qr_code || paymentData.qrcode_base64
    const qr_code_payload = paymentData.qr_code_payload || paymentData.pix_copy_paste

    if (!qr_code || !qr_code_payload) {
      return new Response(JSON.stringify({ error: 'Invalid payment response from SyncPay' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Cria cliente Supabase com service role para inserir no banco
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Persiste o pagamento no banco
    const { data: paymentRecord, error: dbError } = await supabaseAdmin
      .from('payments')
      .insert({
        owner_id: user.id,
        session_id,
        provider_transaction_id,
        qr_code,
        qr_code_payload,
        status: 'PENDING',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(JSON.stringify({ error: 'Failed to save payment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Retorna resposta
    return new Response(
      JSON.stringify({
        qr_code,
        qr_code_payload,
        payment_id: paymentRecord.id,
        status: paymentRecord.status,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

