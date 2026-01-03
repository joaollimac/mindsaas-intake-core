import { supabase } from './client'
import { User } from '@supabase/supabase-js'

/**
 * Garante que o usuário está autenticado anonimamente
 * Se já estiver autenticado, retorna o usuário atual
 * Caso contrário, faz signInAnonymously
 */
export async function ensureAnonymousAuth(): Promise<User> {
  // Verifica se já existe uma sessão
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    return user
  }

  // Se não houver usuário, faz signIn anônimo
  const { data, error } = await supabase.auth.signInAnonymously()
  
  if (error) {
    throw new Error(`Erro ao fazer login anônimo: ${error.message}`)
  }

  if (!data.user) {
    throw new Error('Erro: usuário não retornado após login anônimo')
  }

  return data.user
}

