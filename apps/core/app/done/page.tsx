'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Layout from '../components/Layout'
import { fetchAnswers, AnswerRow } from '@/src/lib/supabase/queries'
import { upsertPrdInstance, fetchPrdInstance, PrdJson, PrdInstance } from '@/src/lib/supabase/prd'

function DoneContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session')
  const prdId = searchParams.get('prd')

  const [mode, setMode] = useState<'A' | 'B' | null>(null)
  const [prdJson, setPrdJson] = useState<PrdJson | null>(null)
  const [prdInstanceId, setPrdInstanceId] = useState<string | null>(null)
  const [state, setState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function processPrd() {
      // Determina o modo baseado nos query params
      if (sessionId) {
        // Modo A: Criação
        setMode('A')
        try {
          // 1. Busca as respostas da sessão
          const answers = await fetchAnswers(sessionId)

          // 2. Organiza as respostas por question_key
          const answersMap: Record<string, string> = {}
          answers.forEach((answer) => {
            answersMap[answer.question_key] = answer.answer_text
          })

          // 3. Monta o prd_json
          const prd: PrdJson = {
            type: 'SaaS Simples',
            layer: 'A',
            goal: answersMap['goal'] || '',
            audience: answersMap['audience'] || '',
            main_feature: answersMap['main_feature'] || '',
            created_at: new Date().toISOString(),
          }

          setPrdJson(prd)

          // 4. Cria ou atualiza a instância de PRD com session_id
          const result = await upsertPrdInstance(sessionId, prd)
          setPrdInstanceId(result.id)
          setState(result.state)

          // 5. Redireciona para /pay com o prd_instance_id
          router.replace(`/pay?prd=${result.id}`)
        } catch (err: any) {
          setError(err.message || 'Erro ao processar PRD')
        } finally {
          setLoading(false)
        }
      } else if (prdId) {
        // Modo B: Visualização
        setMode('B')
        try {
          console.log('[Done] Buscando PRD com prdParam:', prdId)
          
          // Busca a instância de PRD por ID (com fallback para session_id)
          const prdInstance = await fetchPrdInstance(prdId)

          if (!prdInstance) {
            setError('PRD instance não encontrada. Parâmetro prd inválido.')
            setLoading(false)
            return
          }

          console.log('[Done] PRD encontrado:', { id: prdInstance.id, state: prdInstance.state })

          setPrdJson(prdInstance.prd_json)
          setPrdInstanceId(prdInstance.id)
          setState(prdInstance.state)
        } catch (err: any) {
          console.error('[Done] Erro ao buscar PRD:', err)
          setError(err.message || 'Erro ao buscar PRD')
        } finally {
          setLoading(false)
        }
      } else {
        // Nenhum parâmetro válido
        setError('Parâmetro session ou prd é obrigatório')
        setLoading(false)
      }
    }

    processPrd()
  }, [sessionId, prdId, router])

  if (loading) {
    return (
      <Layout>
        <div>
          <h1 className="page-title">Done</h1>
          <p className="page-text">Processando PRD...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div>
          <h1 className="page-title">Done</h1>
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ef4444', borderRadius: '4px' }}>
            <p style={{ color: '#ef4444', margin: 0 }}>
              {error}
            </p>
          </div>
          {/* Debug */}
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #2a2a2a', borderRadius: '4px', backgroundColor: '#1a1a1a' }}>
            <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
              mode: <strong style={{ color: '#e5e5e5' }}>{mode || 'N/A'}</strong>
            </p>
            <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
              session: <strong style={{ color: '#e5e5e5' }}>{sessionId || 'N/A'}</strong>
            </p>
            <p style={{ color: '#a0a0a0', margin: 0, fontSize: '0.875rem' }}>
              prd: <strong style={{ color: '#e5e5e5' }}>{prdId || 'N/A'}</strong>
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!prdJson) {
    return (
      <Layout>
        <div>
          <h1 className="page-title">Done</h1>
          <p className="page-text">Carregando...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <h1 className="page-title">Done</h1>
        <p className="page-text">
          Processo de intake concluído.
        </p>

        {/* Debug */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #2a2a2a', borderRadius: '4px', backgroundColor: '#1a1a1a' }}>
          <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
            mode: <strong style={{ color: '#e5e5e5' }}>{mode || 'N/A'}</strong>
          </p>
          <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
            session: <strong style={{ color: '#e5e5e5' }}>{sessionId || 'N/A'}</strong>
          </p>
          <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
            prd: <strong style={{ color: '#e5e5e5' }}>{prdId || 'N/A'}</strong>
          </p>
          <p style={{ color: '#a0a0a0', margin: 0, fontSize: '0.875rem' }}>
            state: <strong style={{ color: '#e5e5e5' }}>{state || 'N/A'}</strong>
          </p>
        </div>

        {/* Estado atual */}
        {state && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #3b82f6', borderRadius: '4px', backgroundColor: '#1a1a1a' }}>
            <p style={{ color: '#3b82f6', margin: 0, fontWeight: 500 }}>
              Estado atual: <strong>{state}</strong>
            </p>
            {state !== 'DELIVERED' && (
              <p style={{ color: '#f59e0b', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                Ainda em {state}...
              </p>
            )}
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e5e5e5' }}>
            PRD JSON
          </h2>

          {/* JSON */}
          <div style={{ marginBottom: '2rem' }}>
            <pre
              style={{
                padding: '1rem',
                backgroundColor: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                overflow: 'auto',
                color: '#e5e5e5',
                fontSize: '0.875rem',
                lineHeight: '1.5',
              }}
            >
              {JSON.stringify(prdJson, null, 2)}
            </pre>
          </div>

          {/* Botão de pagamento - apenas no Modo B se state !== DELIVERED */}
          {mode === 'B' && prdInstanceId && state && state !== 'DELIVERED' && (
            <div>
              <button
                onClick={() => router.push(`/pay?prd=${prdInstanceId}`)}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 500,
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6'
                }}
              >
                Ir para pagamento
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default function DonePage() {
  return (
    <Suspense fallback={
      <Layout>
        <div>
          <h1 className="page-title">Done</h1>
          <p className="page-text">Carregando...</p>
        </div>
      </Layout>
    }>
      <DoneContent />
    </Suspense>
  )
}

