import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORE_JOB_UPDATE_SECRET = Deno.env.get('CORE_JOB_UPDATE_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  prd_id?: string
  prd_instance_id?: string
  state: 'DELIVERED' | 'FAILED'
  delivered_url?: string
}

serve(async (req) => {
  try {
    // Verifica método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Valida header de segurança
    const secret = req.headers.get('x-mindsaas-secret')
    
    if (!CORE_JOB_UPDATE_SECRET || secret !== CORE_JOB_UPDATE_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Lê o body
    const body: RequestBody = await req.json()

    // Aceita prd_id ou prd_instance_id (compatibilidade)
    const prdId = body.prd_id || body.prd_instance_id

    // Valida campos obrigatórios
    if (!prdId || !body.state) {
      return new Response(JSON.stringify({ error: 'Missing required fields: prd_id or prd_instance_id, state' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Valida state
    if (body.state !== 'DELIVERED' && body.state !== 'FAILED') {
      return new Response(JSON.stringify({ error: 'Invalid state. Must be DELIVERED or FAILED' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Cria cliente Supabase com service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Atualiza prd_instances
    const { data: updatedPrd, error: prdError } = await supabase
      .from('prd_instances')
      .update({
        state: body.state,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prdId)
      .select('id')
      .maybeSingle()

    if (prdError) {
      console.error('Error updating prd_instances:', prdError)
      return new Response(JSON.stringify({ error: `Failed to update prd_instances: ${prdError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!updatedPrd) {
      return new Response(JSON.stringify({ error: 'PRD instance not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Se state === 'DELIVERED' e delivered_url foi fornecido, atualiza deliveries
    if (body.state === 'DELIVERED' && body.delivered_url) {
      try {
        // Tenta fazer upsert em deliveries (ignora se a tabela não existir)
        const { error: deliveryError } = await supabase
          .from('deliveries')
          .upsert({
            prd_id: prdId,
            delivered_url: body.delivered_url,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'prd_id',
          })

        if (deliveryError) {
          // Se a tabela não existir, apenas loga e continua (não falha)
          if (deliveryError.code === '42P01' || deliveryError.message.includes('does not exist')) {
            console.log('deliveries table does not exist, skipping...')
          } else {
            console.error('Error updating deliveries:', deliveryError)
            // Não falha a requisição se deliveries falhar
          }
        }
      } catch (err) {
        // Ignora erros relacionados a deliveries
        console.log('Error handling deliveries (ignored):', err)
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

