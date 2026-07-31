FROM quay.io/keycloak/keycloak:26.2

COPY --chown=1000:0 infrastructure/helm/testcraft/files/keycloak/theme.properties infrastructure/helm/testcraft/files/keycloak/template.ftl infrastructure/helm/testcraft/files/keycloak/login.ftl infrastructure/helm/testcraft/files/keycloak/register.ftl infrastructure/helm/testcraft/files/keycloak/error.ftl infrastructure/helm/testcraft/files/keycloak/login-verify-email.ftl /opt/keycloak/themes/dracula/login/
COPY --chown=1000:0 infrastructure/keycloak/realm.json /realm-source/realm.json

RUN mkdir -p /opt/keycloak/data/import && \
    sed 's|"GITHUB_IDP_ENABLED"|false|g; s|"GOOGLE_IDP_ENABLED"|false|g' /realm-source/realm.json > /opt/keycloak/data/import/realm.json

ENV KC_HEALTH_ENABLED=true

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]
