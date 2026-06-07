variable "keycloak_url" {
  description = "Base URL of the Keycloak server"
  type        = string
  default     = "http://localhost:8080"
}

variable "keycloak_admin_user" {
  description = "Keycloak admin username"
  type        = string
  default     = "admin"
}

variable "keycloak_admin_password" {
  description = "Keycloak admin password"
  type        = string
  sensitive   = true
}

variable "e2e_user_password" {
  description = "Password for the dev user created in the testcraft realm"
  type        = string
  sensitive   = true
  default     = "e2e"
}
