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
