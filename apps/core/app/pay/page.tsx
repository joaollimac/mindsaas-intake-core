'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Layout from '../components/Layout'
import { callEdgeFunction } from '@/src/lib/supabase/edge-functions'
import { supabase } from '@/src/lib/supabase/client'
import { ensureAnonymousAuth } from '@/src/lib/supabase/auth'

interface PaymentIntent {
  qr_code: string
  qr_code_payload: string
  payment_id: string
  status: string
}

function PayContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const prdId = searchParams.get('prd')

  const [payment, setPayment] = useState<PaymentIntent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [prdState, setPrdState] = useState<string | null>(null)
  const [pollError, setPollError] = useState<string | null>(null)

  useEffect(() => {
    async function createPayment() {
      if (!prdId) {
        setError('prd ausente')
        setLoading(false)
        return
      }

      try {
        // Garante autenticação anônima antes de chamar a Edge Function
        await ensureAnonymousAuth()

        const result = await callEdgeFunction('create_payment_intent', {
          session_id: prdId,
        })

        setPayment(result)
      } catch (err: any) {
        setError(err.message || 'Erro ao criar pagamento')
      } finally {
        setLoading(false)
      }
    }

    createPayment()
  }, [prdId])

  // Polling do estado do PRD para verificar se mudou para BUILD
  useEffect(() => {
    if (!prdId || !payment) return

    const checkPrdState = async () => {
      try {
        await ensureAnonymousAuth()
        console.log('[Pay] Polling PRD state com prdParam:', prdId)
        
        const { data, error } = await supabase
          .from('prd_instances')
          .select('state')
          .eq('id', prdId)
          .maybeSingle()

        console.log('[Pay] Polling resultado:', { prdParam: prdId, state: data?.state, error: error?.message })

        setPrdState(data?.state ?? null)
        setPollError(error?.message ?? null)

        if (!error && data) {
          if (data.state === 'BUILD') {
            // Redireciona quando o pagamento for confirmado
            console.log('[Pay] Redirecionando para /building?prd=', prdId)
            router.replace(`/building?prd=${prdId}`)
          } else if (data.state === 'DELIVERED') {
            // Redireciona quando o PRD estiver entregue
            console.log('[Pay] Redirecionando para /done?prd=', prdId)
            router.replace(`/done?prd=${prdId}`)
          }
        }
      } catch (err: any) {
        const errorMessage = err?.message || 'Erro desconhecido'
        setPollError(errorMessage)
        console.error('[Pay] Erro ao verificar estado do PRD:', err)
      }
    }

    // Verifica imediatamente
    checkPrdState()

    // Polling a cada 3 segundos
    const interval = setInterval(checkPrdState, 3000)

    return () => clearInterval(interval)
  }, [prdId, payment, router])

  function handleCopyPayload() {
    if (payment?.qr_code_payload) {
      navigator.clipboard.writeText(payment.qr_code_payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div>
          <h1 className="page-title">Pay</h1>
          <p className="page-text">Criando pagamento...</p>
        </div>
      </Layout>
    )
  }

  if (error || !prdId) {
    return (
      <Layout>
        <div>
          <h1 className="page-title">Pay</h1>
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ef4444', borderRadius: '4px' }}>
            <p style={{ color: '#ef4444', margin: 0 }}>{error || 'prd ausente'}</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!payment) {
    return (
      <Layout>
        <div>
          <h1 className="page-title">Pay</h1>
          <p className="page-text">Erro ao carregar pagamento.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <h1 className="page-title">Pay</h1>
        <p className="page-text">Escaneie o QR Code ou copie o código Pix para pagar.</p>

        {prdState === 'BUILD' && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #10b981', borderRadius: '4px', backgroundColor: '#1a1a1a' }}>
            <p style={{ color: '#10b981', margin: 0 }}>Pagamento confirmado! Redirecionando...</p>
          </div>
        )}

        {/* Debug do polling */}
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #2a2a2a', borderRadius: '4px', backgroundColor: '#1a1a1a' }}>
          {prdState !== null && (
            <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
              poll state: <strong style={{ color: '#e5e5e5' }}>{prdState}</strong>
            </p>
          )}
          {pollError && (
            <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>
              poll error: <strong>{pollError}</strong>
            </p>
          )}
        </div>

        <div style={{ marginTop: '2rem' }}>
          {/* QR Code */}
          {payment.qr_code && (
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <img
                src={payment.qr_code}
                alt="QR Code Pix"
                style={{
                  maxWidth: '300px',
                  width: '100%',
                  height: 'auto',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          )}

          {/* Pix Copia e Cola */}
          {payment.qr_code_payload && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#e5e5e5',
                  fontWeight: 500,
                }}
              >
                Pix Copia e Cola
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '600px' }}>
                <input
                  type="text"
                  value={payment.qr_code_payload}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#e5e5e5',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={handleCopyPayload}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: copied ? '#10b981' : '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}

          {/* Status */}
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #2a2a2a', borderRadius: '4px', backgroundColor: '#1a1a1a' }}>
            <p style={{ color: '#a0a0a0', margin: 0, fontSize: '0.875rem' }}>
              Status: <strong style={{ color: '#e5e5e5' }}>{payment.status}</strong>
            </p>
            {payment.payment_id && (
              <p style={{ color: '#a0a0a0', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                Payment ID: <strong style={{ color: '#e5e5e5' }}>{payment.payment_id}</strong>
              </p>
            )}
            {prdState && (
              <p style={{ color: '#a0a0a0', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                PRD State: <strong style={{ color: '#e5e5e5' }}>{prdState}</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div>
          <h1 className="page-title">Pay</h1>
          <p className="page-text">Carregando...</p>
        </div>
      </Layout>
    }>
      <PayContent />
    </Suspense>
  )
}

