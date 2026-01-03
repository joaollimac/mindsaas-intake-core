import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Json = Record<string, unknown>;

function json(data: Json, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Auth por secret (você já tem BUILDER_RUNNER_SECRET nos Secrets do Supabase)
  const expected = Deno.env.get("BUILDER_RUNNER_SECRET");
  const got = req.headers.get("x-mindsaas-secret");
  if (expected && got !== expected) return json({ error: "unauthorized" }, 401);

  // Service Role
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // payload opcional: { "limit": 3, "delivered_url_base": "https://seu-dominio.com/delivered" }
  let body: any = {};
  try { body = await req.json(); } catch {}

  const limit = typeof body?.limit === "number" ? Math.max(1, Math.min(20, body.limit)) : 3;
  const deliveredUrlBase =
    typeof body?.delivered_url_base === "string" && body.delivered_url_base.length > 0
      ? body.delivered_url_base.replace(/\/$/, "")
      : null;

  // 1) Buscar itens em BUILD
  const { data: items, error: selErr } = await supabase
    .from("prd_instances")
    .select("id")
    .eq("state", "BUILD")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (selErr) return json({ error: "select_failed", details: selErr.message }, 500);

  if (!items || items.length === 0) {
    return json({ ok: true, processed: 0, ids: [] });
  }

  const ids = items.map((x: any) => x.id);

  // 2) Marcar como DELIVERED (simulando o "build" enquanto você não tem n8n)
  // No futuro: aqui você chamaria n8n / IA Dev / deploy Vercel e só depois marcaria DELIVERED.
  const now = new Date().toISOString();

  // Atualiza em lote
  const updates = await Promise.all(
    ids.map(async (id: string) => {
      const patch: any = {
        state: "DELIVERED",
        delivered_at: now,
        error_message: null,
      };
      if (deliveredUrlBase) patch.delivered_url = `${deliveredUrlBase}?prd=${id}`;

      const { error } = await supabase
        .from("prd_instances")
        .update(patch)
        .eq("id", id);

      return { id, ok: !error, error: error?.message ?? null };
    })
  );

  const failed = updates.filter((u) => !u.ok);
  if (failed.length > 0) {
    return json({ ok: false, processed: ids.length - failed.length, failed }, 500);
  }

  return json({ ok: true, processed: ids.length, ids });
});
