package org.appointiko.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the role-based gating in SecurityConfig. We don't need a real user — just confirm
 * that anonymous, ROLE_USER, and ROLE_ADMIN are routed correctly.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class AuthSecurityIntegrationTest {

    private static final String SETUP_JSON =
            "{\"salonName\":\"Studio\",\"city\":\"Skopje\",\"address\":\"Partizanska 1\"}";

    @Autowired private MockMvc mvc;

    @Test
    void anonymous_blockedFromAdmin() throws Exception {
        mvc.perform(get("/api/admin/salons"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void nonAdminUser_forbiddenFromAdmin() throws Exception {
        mvc.perform(get("/api/admin/salons"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_canAccessAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/salons"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymous_blockedFromOwner() throws Exception {
        mvc.perform(get("/api/owner/salon"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anonymous_blockedFromBoostRequest() throws Exception {
        mvc.perform(post("/api/owner/boost-request")
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"days\":7}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anonymous_blockedFromKeepServices() throws Exception {
        mvc.perform(post("/api/owner/services/keep")
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"activeIds\":[]}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void stateChangingRequest_withoutCsrfToken_isRejected() throws Exception {
        mvc.perform(post("/api/owner/salon")
                        .contentType("application/json")
                        .content(SETUP_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void stateChangingRequest_withCsrfToken_isAllowedThrough() throws Exception {
        // Passes CSRF and is then rejected for being anonymous (401), not blocked by CSRF (403).
        mvc.perform(post("/api/owner/salon")
                        .with(csrf())
                        .contentType("application/json")
                        .content(SETUP_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void passwordLoginEndpoints_areGone() throws Exception {
        mvc.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content("{\"email\":\"a@b.mk\",\"password\":\"secret123\"}"))
                .andExpect(status().is4xxClientError())
                .andExpect(status().is(org.hamcrest.Matchers.not(401)));
    }

    @Test
    void login_redirectsToKeycloak() throws Exception {
        mvc.perform(get("/oauth2/authorization/keycloak"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", org.hamcrest.Matchers.allOf(
                        org.hamcrest.Matchers.startsWith("http://localhost:8180/realms/appointiko/protocol/openid-connect/auth?"),
                        org.hamcrest.Matchers.containsString("client_id=appointiko-web"),
                        org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("prompt=create")))));
    }

    @Test
    void signup_opensKeycloakRegistration() throws Exception {
        mvc.perform(get("/oauth2/authorization/keycloak").param("signup", ""))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("prompt=create")));
    }

    @Test
    void logout_returnsKeycloakEndSessionUrl() throws Exception {
        mvc.perform(post("/api/auth/logout")
                        .with(csrf())
                        .with(oidcLogin().idToken(token -> token.tokenValue("id-token-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logoutUrl").value(org.hamcrest.Matchers.allOf(
                        org.hamcrest.Matchers.startsWith("http://localhost:8180/realms/appointiko/protocol/openid-connect/logout"),
                        org.hamcrest.Matchers.containsString("id_token_hint=id-token-123"),
                        org.hamcrest.Matchers.containsString("post_logout_redirect_uri="))));
    }

    @Test
    void clientLookupEndpoint_isGone() throws Exception {
        mvc.perform(get("/api/public/salons/any-salon/client-lookup").param("phone", "070123456"))
                .andExpect(status().isNotFound());
    }

    @Test
    void publicEndpoints_arePublic() throws Exception {
        mvc.perform(get("/api/public/explore/salons"))
                .andExpect(status().isOk());
    }
}
