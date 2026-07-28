import { useEffect, useRef, useState } from 'react';

import keycloak from '@/auth/keycloak';

interface AuthProviderProps {
  children: React.ReactNode;
}

const isPublicRoute = () => location.pathname.startsWith('/share/');

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    (async () => {
      try {
        await keycloak.init({
          onLoad: isPublicRoute() ? 'check-sso' : 'login-required',
          pkceMethod: 'S256',
          checkLoginIframe: false,
        });
        setReady(true);
      } catch (error_) {
        console.error('Keycloak init failed:', error_);
        setError(String(error_));
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-200">
        <div className="space-y-2 text-center">
          <p className="font-semibold text-error">Auth initialisation failed</p>
          <p className="text-sm text-base-content/85">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-200">
        <span className="loading loading-lg loading-spinner text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};
