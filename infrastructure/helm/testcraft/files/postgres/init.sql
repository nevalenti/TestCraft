CREATE DATABASE keycloak_db;
CREATE DATABASE glitchtip_db;

CREATE ROLE testcraft_app WITH LOGIN PASSWORD '{{ .Values.secrets.postgresAppPassword }}';
CREATE ROLE testcraft_keycloak WITH LOGIN PASSWORD '{{ .Values.secrets.postgresKeycloakPassword }}';
CREATE ROLE testcraft_monitor WITH LOGIN PASSWORD '{{ .Values.secrets.postgresMonitorPassword }}';
CREATE ROLE testcraft_glitchtip WITH LOGIN PASSWORD '{{ .Values.secrets.postgresGlitchtipPassword }}';

ALTER DATABASE {{ .Values.secrets.postgresDb }} OWNER TO testcraft_app;
ALTER DATABASE keycloak_db OWNER TO testcraft_keycloak;
ALTER DATABASE glitchtip_db OWNER TO testcraft_glitchtip;

GRANT pg_monitor TO testcraft_monitor;
