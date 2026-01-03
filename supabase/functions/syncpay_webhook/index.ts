import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYNC_PAY_WEBHOOK_TOKEN = Deno.env.get('SYNC_PAY_WEBHOOK_TOKEN')
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

    // Valida token via querystring
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!SYNC_PAY_WEBHOOK_TOKEN || token !== SYNC_PAY_WEBHOOK_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Lê o body do webhook
    const webhookData = await req.json()

    // Extrai informações do pagamento
    const provider_transaction_id = webhookData.id || webhookData.transaction_id
    const status = webhookData.status
    const session_id = webhookData.metadata?.session_id || webhookData.external_reference

    if (!provider_transaction_id || !status) {
      return new Response(JSON.stringify({ error: 'Invalid webhook data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Cria cliente Supabase com service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Atualiza o status do pagamento por provider_transaction_id
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({ status: status === 'paid' || status === 'PAID' ? 'PAID' : status })
      .eq('provider_transaction_id', provider_transaction_id)
      .select()
      .single()

    if (paymentError) {
      console.error('Payment update error:', paymentError)
      // Continua mesmo se não encontrar o pagamento (pode ter sido criado de outra forma)
    }

    // Se o pagamento foi pago e temos session_id, atualiza o PRD e payments
    if ((status === 'paid' || status === 'PAID') && session_id) {
      // Busca o session_id do pagamento se não foi fornecido no webhook
      let finalSessionId = session_id
      if (!finalSessionId && payment) {
        finalSessionId = payment.session_id
      }

      if (finalSessionId) {
        console.info(`[syncpay_webhook] Processing payment confirmation for prd_instance_id: ${finalSessionId}`)

        // Atualiza payments onde session_id = session_id recebido
        const { error: paymentsUpdateError } = await supabase
          .from('payments')
          .update({ status: 'PAID' })
          .eq('session_id', finalSessionId)

        if (paymentsUpdateError) {
          console.error('Payments update error:', paymentsUpdateError)
        }

        // Verifica o estado atual do PRD antes de atualizar (idempotência)
        const { data: currentPrd, error: fetchError } = await supabase
          .from('prd_instances')
          .select('id, state')
          .eq('id', finalSessionId)
          .maybeSingle()

        if (fetchError) {
          console.error('PRD fetch error:', fetchError)
        }

        // Só atualiza para BUILD se estiver em PAY (não regredir estado)
        if (currentPrd && currentPrd.state === 'PAY') {
          const now = new Date().toISOString()
          
          const { error: prdError } = await supabase
            .from('prd_instances')
            .update({ 
              state: 'BUILD',
              build_started_at: now,
            })
            .eq('id', finalSessionId)
            .eq('state', 'PAY')

          if (prdError) {
            console.error('PRD update error:', prdError)
          } else {
            console.info(`[syncpay_webhook] PRD ${finalSessionId} transitioned from PAY to BUILD at ${now}`)
          }
        } else if (currentPrd) {
          console.info(`[syncpay_webhook] PRD ${finalSessionId} already in state ${currentPrd.state}, skipping transition to BUILD`)
        } else {
          console.warn(`[syncpay_webhook] PRD ${finalSessionId} not found`)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

