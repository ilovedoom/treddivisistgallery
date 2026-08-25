import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
}

/** Sessione + ruolo: il CMS è accessibile solo agli account con ruolo ADMIN. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    isAdmin: false,
  });

  useEffect(() => {
    let active = true;

    const loadRole = async (session: Session | null) => {
      if (!session) {
        if (active) setState({ loading: false, session: null, user: null, isAdmin: false });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "ADMIN")
        .maybeSingle();
      if (active) {
        setState({
          loading: false,
          session,
          user: session.user,
          isAdmin: Boolean(data),
        });
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void loadRole(session);
    });

    void supabase.auth.getSession().then(({ data }) => loadRole(data.session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
