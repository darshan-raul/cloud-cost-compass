{{- define "cloud-cost-compass.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end }}

{{- define "cloud-cost-compass.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end }}
{{- end }}
{{- end }}

{{- define "cloud-cost-compass.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "_" "-" | replace "/" "-" | trunc 55 | trimSuffix "-" -}}
{{- end }}

{{- define "cloud-cost-compass.labels" -}}
app.kubernetes.io/name: {{ include "cloud-cost-compass.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
helm.sh/chart: {{ include "cloud-cost-compass.chart" . }}
{{- end }}

{{- define "cloud-cost-compass.selectorLabels" -}}
app.kubernetes.io/name: {{ include "cloud-cost-compass.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}