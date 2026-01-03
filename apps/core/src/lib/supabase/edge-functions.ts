import { supabase } from './client'

/**
 * Chama uma Edge Function do Supabase com autenticação
 * Requer que ensureAnonymousAuth() seja chamado antes
 */
export async function callEdgeFunction(
  functionName: string,
  body: Record<string, any>
): Promise<any> {
  // Obtém a sessão atual para pegar o access_token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    throw new Error(`Erro ao obter sessão: ${sessionError.message}`)
  }

  if (!session || !session.access_token) {
    throw new Error('Sessão não encontrada. Certifique-se de chamar ensureAnonymousAuth() antes.')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurado')
  }

  // Chama a Edge Function
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro na Edge Function: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

