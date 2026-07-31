CREATE DATABASE keycloak_db;

CREATE ROLE testcraft_app WITH LOGIN PASSWORD '{{ .Values.secrets.postgresAppPassword }}';
CREATE ROLE testcraft_keycloak WITH LOGIN PASSWORD '{{ .Values.secrets.postgresKeycloakPassword }}';
CREATE ROLE testcraft_monitor WITH LOGIN PASSWORD '{{ .Values.secrets.postgresMonitorPassword }}';

ALTER DATABASE {{ .Values.secrets.postgresDb }} OWNER TO testcraft_app;
ALTER DATABASE keycloak_db OWNER TO testcraft_keycloak;

GRANT pg_monitor TO testcraft_monitor;
