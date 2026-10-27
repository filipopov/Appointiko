package org.appointiko.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

/**
 * Sends {@code /oauth2/authorization/keycloak?signup} straight to Keycloak's registration form
 * ({@code prompt=create}) instead of the login form.
 */
class SignupAwareAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private static final String BASE_URI = "/oauth2/authorization";

    private final DefaultOAuth2AuthorizationRequestResolver delegate;

    SignupAwareAuthorizationRequestResolver(ClientRegistrationRepository clientRegistrations) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(clientRegistrations, BASE_URI);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return withSignupPrompt(request, delegate.resolve(request));
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return withSignupPrompt(request, delegate.resolve(request, clientRegistrationId));
    }

    private OAuth2AuthorizationRequest withSignupPrompt(HttpServletRequest request, OAuth2AuthorizationRequest authRequest) {
        if (authRequest == null || request.getParameter("signup") == null) {
            return authRequest;
        }
        return OAuth2AuthorizationRequest.from(authRequest)
                .additionalParameters(params -> params.put("prompt", "create"))
                .build();
    }
}
