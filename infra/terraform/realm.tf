resource "keycloak_realm" "testcraft" {
  realm   = "testcraft"
  enabled = true

  display_name = "TestCraft"

  access_token_lifespan    = "15m"
  sso_session_idle_timeout = "30m"
  sso_session_max_lifespan = "10h"
}

resource "keycloak_openid_client" "web" {
  realm_id  = keycloak_realm.testcraft.id
  client_id = "testcraft-web"
  name      = "TestCraft Web"
  enabled   = true

  access_type                  = "PUBLIC"
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = true
  service_accounts_enabled     = false

  pkce_code_challenge_method = "S256"

  valid_redirect_uris = [
    "${var.web_url}/*",
    "http://localhost:3000/*",
    "http://localhost:5173/*",
    "http://localhost:5999/*",
  ]

  valid_post_logout_redirect_uris = [
    var.web_url,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5999",
  ]

  web_origins = [
    var.web_url,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5999",
  ]
}

resource "keycloak_user" "dev" {
  realm_id = keycloak_realm.testcraft.id
  username = "dev"
  enabled  = true

  email      = "dev@testcraft.local"
  first_name = "Dev"
  last_name  = "User"

  initial_password {
    value     = var.dev_user_password
    temporary = false
  }
}

# Adds "testcraft-web" as an audience claim so the API can validate tokens
resource "keycloak_openid_audience_protocol_mapper" "web" {
  realm_id  = keycloak_realm.testcraft.id
  client_id = keycloak_openid_client.web.id
  name      = "testcraft-web-audience"

  included_client_audience = keycloak_openid_client.web.client_id
  add_to_id_token          = false
  add_to_access_token      = true
}
