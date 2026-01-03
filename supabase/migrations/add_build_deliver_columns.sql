-- Migration: Adicionar colunas para build/deliver em prd_instances
-- Execute este SQL no Supabase Dashboard > SQL Editor

ALTER TABLE public.prd_instances
  ADD COLUMN IF NOT EXISTS delivered_url text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS build_started_at timestamptz;

-- Índice para acelerar polling por state
CREATE INDEX IF NOT EXISTS prd_instances_state_idx ON public.prd_instances(state);

