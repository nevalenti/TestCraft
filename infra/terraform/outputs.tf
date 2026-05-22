output "realm" {
  description = "Keycloak realm name"
  value       = keycloak_realm.testcraft.realm
}

output "web_client_id" {
  description = "Public client ID for the React frontend"
  value       = keycloak_openid_client.web.client_id
}

output "issuer_url" {
  description = "OIDC issuer URL — use as Keycloak:Authority in appsettings"
  value       = "${var.keycloak_url}/realms/${keycloak_realm.testcraft.realm}"
}

output "jwks_url" {
  description = "JWKS endpoint for manual inspection"
  value       = "${var.keycloak_url}/realms/${keycloak_realm.testcraft.realm}/protocol/openid-connect/certs"
}
