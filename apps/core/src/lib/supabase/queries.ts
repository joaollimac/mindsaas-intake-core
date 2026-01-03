import { supabase } from './client'
import { ensureAnonymousAuth } from './auth'

export interface Answer {
  question_key: string
  answer_text: string
}

export interface AnswerRow {
  session_id: string
  owner_id: string
  question_key: string
  answer_text: string
}

/**
 * Insere múltiplas respostas no Supabase
 */
export async function insertAnswers(
  sessionId: string,
  answers: Answer[]
): Promise<void> {
  // Garante autenticação
  const user = await ensureAnonymousAuth()

  // Prepara os dados para inserção
  const rows: AnswerRow[] = answers.map((answer) => ({
    session_id: sessionId,
    owner_id: user.id,
    question_key: answer.question_key,
    answer_text: answer.answer_text,
  }))

  // Insere todas as respostas
  const { error } = await supabase.from('intake_answers').insert(rows)

  if (error) {
    throw new Error(`Erro ao salvar respostas: ${error.message}`)
  }
}

/**
 * Busca todas as respostas de uma sessão
 */
export async function fetchAnswers(sessionId: string): Promise<AnswerRow[]> {
  // Garante autenticação
  await ensureAnonymousAuth()

  const { data, error } = await supabase
    .from('intake_answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('question_key')

  if (error) {
    throw new Error(`Erro ao buscar respostas: ${error.message}`)
  }

  return data || []
}

