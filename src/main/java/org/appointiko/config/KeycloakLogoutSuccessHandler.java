package org.appointiko.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Ends the local session and answers with Keycloak's end-session URL, so the SPA can also sign the
 * user out of Keycloak (RP-initiated logout) by navigating there.
 */
@Component
class KeycloakLogoutSuccessHandler implements LogoutSuccessHandler {

    private final String endSessionUri;
    private final String frontendUrl;

    KeycloakLogoutSuccessHandler(@Value("${app.keycloak.public-url}") String keycloakPublicUrl,
                                 @Value("${app.keycloak.realm}") String realm,
                                 @Value("${app.frontend-url:}") String frontendUrl) {
        this.endSessionUri = keycloakPublicUrl + "/realms/" + realm + "/protocol/openid-connect/logout";
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response,
                                Authentication authentication) throws IOException {
        String postLogoutRedirect = frontendUrl.isEmpty()
                ? UriComponentsBuilder.fromUriString(request.getRequestURL().toString())
                        .replacePath("/").replaceQuery(null).toUriString()
                : frontendUrl + "/";

        UriComponentsBuilder logoutUrl = UriComponentsBuilder.fromUriString(endSessionUri)
                .queryParam("post_logout_redirect_uri", postLogoutRedirect);
        if (authentication != null && authentication.getPrincipal() instanceof OidcUser oidcUser) {
            logoutUrl.queryParam("id_token_hint", oidcUser.getIdToken().getTokenValue());
        }

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"logoutUrl\":\"" + logoutUrl.encode().toUriString() + "\"}");
    }
}
