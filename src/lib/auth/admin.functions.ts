import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Stato del primo avvio: il wizard è disponibile solo finché non esiste un amministratore. */
export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "ADMIN");
  if (error) throw new Error("Impossibile leggere lo stato di configurazione");
  return { needsSetup: (count ?? 0) === 0 };
});

/**
 * Assegna il ruolo ADMIN al primo account registrato.
 * Se un amministratore esiste già la richiesta viene rifiutata: il wizard
 * pubblico non può essere riaperto per creare admin arbitrari.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ name: z.string().trim().min(1).max(120) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "ADMIN");
    if (countError) throw new Error("Impossibile verificare gli amministratori esistenti");
    if ((count ?? 0) > 0) throw new Error("La configurazione iniziale è già stata completata");

    const email = (context.claims as { email?: string } | null)?.email ?? "";
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: context.userId, name: data.name, email, last_login: new Date().toISOString() });
    if (profileError) throw new Error("Impossibile creare il profilo amministratore");

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "ADMIN" });
    if (roleError) throw new Error("Impossibile assegnare il ruolo amministratore");

    return { ok: true };
  });

/** Aggiorna l'ultimo accesso e mantiene il profilo allineato. */
export const registerLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string } | null)?.email ?? "";
    await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, email, last_login: new Date().toISOString() });
    return { ok: true };
  });
