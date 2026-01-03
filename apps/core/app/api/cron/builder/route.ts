import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  // Validação do CRON_SECRET para proteção do endpoint
  const cronSecret = process.env.CRON_SECRET;
  const headersList = headers();
  const authHeader = headersList.get("authorization");

  // Extrai o token do header Authorization: Bearer <token>
  const providedToken = authHeader?.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : null;

  // Se CRON_SECRET estiver configurado, valida o token
  // Vercel Cron envia automaticamente o header correto
  if (cronSecret && providedToken !== cronSecret) {
    console.warn("[cron/builder] Unauthorized access attempt");
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const builderSecret = process.env.BUILDER_RUNNER_SECRET;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !builderSecret) {
    console.error("[cron/builder] Missing required environment variables");
    return NextResponse.json(
      { error: "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or BUILDER_RUNNER_SECRET" },
      { status: 500 }
    );
  }

  try {
    console.info("[cron/builder] Calling builder_job_runner...");

    const fetchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-mindsaas-secret": builderSecret,
    };

    // Adiciona apikey e Authorization se disponíveis
    if (anonKey) {
      fetchHeaders["apikey"] = anonKey;
      fetchHeaders["Authorization"] = `Bearer ${anonKey}`;
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/builder_job_runner`, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify({
        limit: 10,
        delivered_url_base: process.env.DELIVERED_URL_BASE || "",
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    
    console.info(`[cron/builder] builder_job_runner responded with status ${res.status}`, data);

    return NextResponse.json({ 
      status: res.status, 
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[cron/builder] Error calling builder_job_runner:", error);
    return NextResponse.json(
      { error: error.message || "Failed to call builder_job_runner" },
      { status: 500 }
    );
  }
}

