import { supabase } from './client'
import { ensureAnonymousAuth } from './auth'

export interface PrdJson {
  type: string
  layer: string
  goal: string
  audience: string
  main_feature: string
  created_at: string
}

export interface PrdInstance {
  id: string
  owner_id: string
  session_id: string
  state: string
  prd_json: PrdJson
  created_at: string
}

export interface UpsertResult {
  id: string
  state: string
}

/**
 * Cria ou atualiza uma instância de PRD no Supabase
 * Usa o mesmo UUID para id e session_id (Caminho A)
 */
export async function upsertPrdInstance(
  sessionId: string,
  prdJson: PrdJson
): Promise<UpsertResult> {
  // Garante autenticação
  const user = await ensureAnonymousAuth()

  // Verifica se já existe uma instância com esse ID
  const { data: existing, error: fetchError } = await supabase
    .from('prd_instances')
    .select('id, state')
    .eq('id', sessionId)
    .maybeSingle()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Erro ao verificar PRD existente: ${fetchError.message}`)
  }

  if (existing) {
    // Atualiza a instância existente
    const { data: updated, error: updateError } = await supabase
      .from('prd_instances')
      .update({
        prd_json: prdJson,
        state: 'PAY',
      })
      .eq('id', sessionId)
      .select('id, state')
      .single()

    if (updateError) {
      throw new Error(`Erro ao atualizar PRD: ${updateError.message}`)
    }

    if (!updated) {
      throw new Error('Erro: PRD atualizado mas não retornado')
    }

    return {
      id: updated.id,
      state: updated.state,
    }
  } else {
    // Insere nova instância com id = sessionId (não gera UUID novo)
    const { data: inserted, error: insertError } = await supabase
      .from('prd_instances')
      .insert({
        id: sessionId,
        owner_id: user.id,
        session_id: sessionId,
        prd_json: prdJson,
        state: 'PAY',
      })
      .select('id, state')
      .single()

    if (insertError) {
      throw new Error(`Erro ao criar PRD: ${insertError.message}`)
    }

    if (!inserted) {
      throw new Error('Erro: PRD criado mas não retornado')
    }

    return {
      id: inserted.id,
      state: inserted.state,
    }
  }
}

/**
 * Busca uma instância de PRD por ID (com fallback para session_id)
 * Primeiro tenta buscar por id, depois por session_id
 */
export async function fetchPrdInstance(prdParam: string): Promise<PrdInstance | null> {
  // Garante autenticação
  await ensureAnonymousAuth()

  // Tenta buscar primeiro por id
  const { data: foundById, error: errorById } = await supabase
    .from('prd_instances')
    .select('*')
    .eq('id', prdParam)
    .maybeSingle()

  if (errorById && errorById.code !== 'PGRST116') {
    throw new Error(`Erro ao buscar PRD por id: ${errorById.message}`)
  }

  if (foundById) {
    if (typeof window !== 'undefined') {
      console.log('[fetchPrdInstance] Encontrado por id:', { prdParam, foundById: foundById.id })
    }
    return foundById
  }

  // Fallback: busca por session_id
  const { data: foundBySession, error: errorBySession } = await supabase
    .from('prd_instances')
    .select('*')
    .eq('session_id', prdParam)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (errorBySession && errorBySession.code !== 'PGRST116') {
    throw new Error(`Erro ao buscar PRD por session_id: ${errorBySession.message}`)
  }

  if (foundBySession) {
    if (typeof window !== 'undefined') {
      console.log('[fetchPrdInstance] Encontrado por session_id (fallback):', { prdParam, foundBySession: foundBySession.id })
    }
    return foundBySession
  }

  if (typeof window !== 'undefined') {
    console.log('[fetchPrdInstance] Não encontrado:', { prdParam, foundById: null, foundBySession: null })
  }

  return null
}

