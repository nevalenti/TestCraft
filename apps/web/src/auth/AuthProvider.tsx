import { useEffect, useRef, useState } from "react";

import keycloak from "@/auth/keycloak";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    keycloak
      .init({
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then(() => setReady(true))
      .catch((err) => {
        console.error("Keycloak init failed:", err);
        setError(String(err));
      });
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-200">
        <div className="text-center space-y-2">
          <p className="text-error font-semibold">Auth initialisation failed</p>
          <p className="text-sm text-base-content/60">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};
