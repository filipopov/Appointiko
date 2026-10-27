package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import org.appointiko.model.Owner;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Maps a Keycloak login to a local {@link Owner} (created on first login) and to app roles.
 * ROLE_ADMIN comes from the Keycloak realm role "admin" or the owner's admin flag.
 */
@Service
@RequiredArgsConstructor
public class OwnerOidcUserService extends OidcUserService {

    private static final String ADMIN_REALM_ROLE = "admin";

    private final AuthService authService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        String email = oidcUser.getEmail();
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(new OAuth2Error("missing_email", "Keycloak account has no email", null));
        }

        Owner owner = authService.findOrCreateOwner(email);

        Set<GrantedAuthority> authorities = new HashSet<>(oidcUser.getAuthorities());
        List<String> realmRoles = oidcUser.getClaimAsStringList("roles");
        if (owner.isAdmin() || (realmRoles != null && realmRoles.contains(ADMIN_REALM_ROLE))) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        // Principal name is the email (user-name-attribute), which the controllers use to find the owner.
        String nameAttribute = userRequest.getClientRegistration().getProviderDetails()
                .getUserInfoEndpoint().getUserNameAttributeName();
        return new DefaultOidcUser(authorities, oidcUser.getIdToken(), oidcUser.getUserInfo(), nameAttribute);
    }
}
