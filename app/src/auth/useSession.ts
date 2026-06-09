import { useEffect, useState } from "react";
import { initAuth } from "./keycloak";
import { setSession, getSession_ } from "./session";
import type { TenantSession } from "@/lib/roles";

export function useSession() {
  const [session, setSessionState] = useState<TenantSession | null>(getSession_());
  const [loading, setLoading] = useState(!session);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!session) {
        const s = await initAuth();
        if (!cancelled) {
          setSession(s);
          setSessionState(s);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return { session, loading };
}
