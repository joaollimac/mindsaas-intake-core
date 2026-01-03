'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../components/Layout'
import { supabase } from '@/src/lib/supabase/client'
import { ensureAnonymousAuth } from '@/src/lib/supabase/auth'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function StartPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  async function handleStart() {
    setStatus('loading')
    setErrorMessage('')

    try {
      // 1. Garante autenticação anônima
      const user = await ensureAnonymousAuth()

      // 2. Cria sessão no Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('intake_sessions')
        .insert({
          owner_id: user.id,
          status: 'draft',
        })
        .select()
        .single()

      if (sessionError) {
        throw new Error(`Erro ao criar sessão: ${sessionError.message}`)
      }

      if (!sessionData || !sessionData.id) {
        throw new Error('Erro: sessão criada mas ID não retornado')
      }

      // 3. Redireciona para /quiz com o session ID
      setStatus('success')
      router.push(`/quiz?session=${sessionData.id}`)
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'Erro desconhecido ao iniciar')
    }
  }

  return (
    <Layout>
      <div>
        <h1 className="page-title">Start</h1>
        <p className="page-text">
          Esta é a página inicial do processo de intake.
        </p>

        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={handleStart}
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
            {status === 'loading' ? 'Iniciando...' : 'Começar'}
          </button>
        </div>

        {status === 'error' && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              backgroundColor: '#1a1a1a',
            }}
          >
            <p style={{ color: '#ef4444', margin: 0 }}>
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

