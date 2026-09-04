import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { claimFirstAdmin, getSetupStatus, registerLogin } from "@/lib/auth/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Accesso curatori — Galleria Aurora" },
      {
        name: "description",
        content:
          "Accedi all'area di gestione della Galleria Aurora per curare opere, metadata e allestimento 3D.",
      },
      { property: "og:title", content: "Accesso curatori — Galleria Aurora" },
      {
        property: "og:description",
        content: "Area riservata al team curatoriale della Galleria Aurora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search['next'] === "string" ? (search['next'] as string) : undefined,
  }),
  component: AuthPage,
});

/** Solo percorsi relativi allo stesso dominio possono essere usati come destinazione. */
function safePath(path?: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/admin";
  return path;
}

function AuthPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const destination = safePath(next);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getSetupStatus()
      .then((s) => {
        setNeedsSetup(s.needsSetup);
        if (s.needsSetup) setMode("signup");
      })
      .catch(() => setNeedsSetup(false));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" || !session) return;
      void finalize();
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void finalize();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSetup, name, destination]);

  /** Dopo l'autenticazione: primo admin se serve, poi ritorno alla destinazione. */
  async function finalize() {
    try {
      if (needsSetup) {
        await claimFirstAdmin({ data: { name: name.trim() || "Amministratore" } });
        toast.success("Amministratore creato");
      } else {
        await registerLogin();
      }
    } catch {
      /* l'utente potrebbe non essere amministratore: la rotta protetta lo gestisce */
    }
    void navigate({ to: destination });
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}${destination}`, data: { name } },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "Email o password non corretti"
          : "Accesso non riuscito",
        { description: error.message },
      );
      return;
    }
    if (mode === "signup") toast.success("Account creato");
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Accesso con Google non riuscito");
      return;
    }
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-4 py-10">
      <div className="glass-panel w-full max-w-md p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground">
              {needsSetup ? "Configurazione iniziale" : "Accesso curatori"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {needsSetup
                ? "Crea il primo account amministratore della galleria."
                : "Area riservata alla gestione della galleria."}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {(mode === "signup" || needsSetup) && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimo 8 caratteri. Le password sono verificate contro archivi di credenziali
              compromesse e non vengono mai salvate in chiaro.
            </p>
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            {busy
              ? "Attendi…"
              : needsSetup
                ? "Crea amministratore"
                : mode === "signup"
                  ? "Crea account"
                  : "Accedi"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          oppure
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={google}>
          Continua con Google
        </Button>

        {!needsSetup && (
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="focus-ring mt-4 w-full rounded-lg py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
          </button>
        )}

        <Link
          to="/"
          className="mt-2 block text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Torna alla galleria
        </Link>
      </div>
    </main>
  );
}
