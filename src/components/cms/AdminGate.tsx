import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Protezione dell'area di gestione: la sessione è verificata lato client per il
 * rendering, mentre le operazioni sensibili restano protette dalle regole del database.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { loading, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { next: "/admin" } });
  }, [loading, user, navigate]);

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Verifica dell'accesso…</div>;
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="mx-auto grid max-w-md gap-4 px-6 py-16 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold text-foreground">Accesso non autorizzato</h1>
        <p className="text-sm text-muted-foreground">
          Il tuo account non ha i permessi per gestire la galleria. Chiedi a un amministratore di
          abilitarti.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/">Torna alla galleria</Link>
          </Button>
          <Button
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate({ to: "/auth", search: { next: "/admin" } });
            }}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Esci
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/** Pulsante di uscita con pulizia della sessione. */
export function SignOutButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await supabase.auth.signOut();
        void navigate({ to: "/auth", search: { next: "/admin" } });
      }}
    >
      <LogOut className="size-4" aria-hidden="true" />
      Esci
    </Button>
  );
}
