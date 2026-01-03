'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Layout from '../components/Layout'
import { insertAnswers } from '@/src/lib/supabase/queries'

function QuizContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session')

  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState('')
  const [mainFeature, setMainFeature] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!sessionId) {
      setStatus('error')
      setErrorMessage('Sessão não encontrada. Por favor, inicie pelo /start')
      return
    }

    if (!goal.trim() || !audience.trim() || !mainFeature.trim()) {
      setStatus('error')
      setErrorMessage('Por favor, preencha todos os campos')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      await insertAnswers(sessionId, [
        { question_key: 'goal', answer_text: goal.trim() },
        { question_key: 'audience', answer_text: audience.trim() },
        { question_key: 'main_feature', answer_text: mainFeature.trim() },
      ])

      // Redireciona para /done com session para criar o PRD
      // O /done criará o PRD e redirecionará para /pay?prd=<prdInstanceId>
      router.push(`/done?session=${sessionId}`)
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'Erro ao salvar respostas')
    }
  }

  if (!sessionId) {
    return (
      <Layout>
        <div>
          <h1 className="page-title">Quiz</h1>
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #f59e0b', borderRadius: '4px' }}>
            <p style={{ color: '#f59e0b', margin: 0 }}>
              Nenhuma sessão encontrada. Por favor, inicie pelo /start
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <h1 className="page-title">Quiz</h1>
        <p className="page-text">
          Responda as perguntas abaixo para continuar.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="goal"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#e5e5e5',
                fontWeight: 500,
              }}
            >
              Objetivo
            </label>
            <textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              required
              disabled={status === 'loading'}
              style={{
                width: '100%',
                maxWidth: '600px',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                color: '#e5e5e5',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="audience"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#e5e5e5',
                fontWeight: 500,
              }}
            >
              Público-alvo
            </label>
            <input
              id="audience"
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              required
              disabled={status === 'loading'}
              style={{
                width: '100%',
                maxWidth: '600px',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                color: '#e5e5e5',
                fontSize: '1rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="main_feature"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#e5e5e5',
                fontWeight: 500,
              }}
            >
              Funcionalidade Principal
            </label>
            <textarea
              id="main_feature"
              value={mainFeature}
              onChange={(e) => setMainFeature(e.target.value)}
              rows={4}
              required
              disabled={status === 'loading'}
              style={{
                width: '100%',
                maxWidth: '600px',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                color: '#e5e5e5',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {status === 'error' && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                backgroundColor: '#1a1a1a',
              }}
            >
              <p style={{ color: '#ef4444', margin: 0 }}>{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              backgroundColor: status === 'loading' ? '#6b6b6b' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (status !== 'loading') {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (status !== 'loading') {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }
            }}
          >
            {status === 'loading' ? 'Salvando...' : 'Finalizar'}
          </button>
        </form>
      </div>
    </Layout>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div>
          <h1 className="page-title">Quiz</h1>
          <p className="page-text">Carregando...</p>
        </div>
      </Layout>
    }>
      <QuizContent />
    </Suspense>
  )
}

