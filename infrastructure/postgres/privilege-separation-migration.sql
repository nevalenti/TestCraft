\set ON_ERROR_STOP on

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'testcraft_app') THEN
    EXECUTE format('CREATE ROLE testcraft_app WITH LOGIN PASSWORD %L', :'app_password');
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'testcraft_keycloak') THEN
    EXECUTE format('CREATE ROLE testcraft_keycloak WITH LOGIN PASSWORD %L', :'keycloak_password');
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'testcraft_monitor') THEN
    EXECUTE format('CREATE ROLE testcraft_monitor WITH LOGIN PASSWORD %L', :'monitor_password');
  END IF;
END $$;

GRANT pg_monitor TO testcraft_monitor;

REASSIGN OWNED BY CURRENT_USER TO testcraft_app;
ALTER DATABASE :"app_db" OWNER TO testcraft_app;

\c keycloak_db

REASSIGN OWNED BY CURRENT_USER TO testcraft_keycloak;
ALTER DATABASE keycloak_db OWNER TO testcraft_keycloak;
