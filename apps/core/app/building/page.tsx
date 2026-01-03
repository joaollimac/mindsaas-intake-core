'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Layout from '../components/Layout'
import { supabase } from '@/src/lib/supabase/client'
import { ensureAnonymousAuth } from '@/src/lib/supabase/auth'

function BuildingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const prdId = searchParams.get('prd')

  const [state, setState] = useState<string | null>(null)
  const [pollError, setPollError] = useState<string | null>(null)

  // Polling do estado do PRD para verificar se mudou para DELIVERED
  useEffect(() => {
    if (!prdId) return

    const checkPrdState = async () => {
      try {
        await ensureAnonymousAuth()
        console.log('[Building] Polling PRD state com prdParam:', prdId)
        
        const { data, error } = await supabase
          .from('prd_instances')
          .select('state')
          .eq('id', prdId)
          .maybeSingle()

        console.log('[Building] Polling resultado:', { prdParam: prdId, state: data?.state, error: error?.message })

        setState(data?.state ?? null)
        setPollError(error?.message ?? null)

        if (!error && data?.state === 'DELIVERED') {
          // Redireciona quando o PRD estiver entregue usando o mesmo prdId (prd_instances.id)
          console.log('[Building] Redirecionando para /done?prd=', prdId)
          router.replace(`/done?prd=${prdId}`)
        }
      } catch (err: any) {
        const errorMessage = err?.message || 'Erro desconhecido'
        setPollError(errorMessage)
        console.error('[Building] Erro ao verificar estado do PRD:', err)
      }
    }

    // Verifica imediatamente
    checkPrdState()

    // Polling a cada 2.5 segundos
    const interval = setInterval(checkPrdState, 2500)

    return () => clearInterval(interval)
  }, [prdId, router])

  return (
    <Layout>
      <div>
        <h1 className="page-title">Building</h1>
        <p className="page-text">
          Seu PRD está sendo construído.
        </p>
        {prdId && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #2a2a2a', borderRadius: '4px', backgroundColor: '#1a1a1a' }}>
            <p style={{ color: '#a0a0a0', margin: 0, fontSize: '0.875rem' }}>
              PRD ID: <strong style={{ color: '#e5e5e5' }}>{prdId}</strong>
            </p>
          </div>
        )}

        {/* Debug do polling */}
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #2a2a2a', borderRadius: '4px', backgroundColor: '#1a1a1a' }}>
          {state !== null && (
            <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
              state: <strong style={{ color: '#e5e5e5' }}>{state}</strong>
            </p>
          )}
          {pollError && (
            <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>
              error: <strong>{pollError}</strong>
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default function BuildingPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div>
          <h1 className="page-title">Building</h1>
          <p className="page-text">Carregando...</p>
        </div>
      </Layout>
    }>
      <BuildingContent />
    </Suspense>
  )
}

