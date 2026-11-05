{{- define "testcraft.podSecurityContext" -}}
runAsNonRoot: true
runAsUser: {{ .uid }}
runAsGroup: {{ .gid }}
{{- if hasKey . "fsGroup" }}
fsGroup: {{ .fsGroup }}
{{- end }}
seccompProfile:
  type: RuntimeDefault
{{- end -}}

{{- define "testcraft.containerSecurityContext" -}}
allowPrivilegeEscalation: false
capabilities:
  drop: ["ALL"]
{{- if .add }}
  add: [{{ range $i, $cap := .add }}{{ if $i }}, {{ end }}"{{ $cap }}"{{ end }}]
{{- end }}
{{- end -}}

{{- define "testcraft.rootInitSecurityContext" -}}
runAsNonRoot: false
runAsUser: 0
runAsGroup: 0
{{ include "testcraft.containerSecurityContext" . }}
{{- end -}}

{{- define "testcraft.appDatabaseEnv" -}}
- name: POSTGRES_HOST
  value: postgres
- name: POSTGRES_PORT
  value: "5432"
- name: POSTGRES_USER
  value: testcraft_app
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: testcraft-secrets
      key: POSTGRES_APP_PASSWORD
- name: POSTGRES_DB
  valueFrom:
    secretKeyRef:
      name: testcraft-secrets
      key: POSTGRES_DB
- name: DATABASE_URL
  value: "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DB)"
{{- end -}}
