package org.appointiko.config;

import org.appointiko.service.OwnerOidcUserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

/**
 * Authentication is delegated to Keycloak via OpenID Connect. The backend acts as the OAuth2
 * client (backend-for-frontend): tokens stay on the server and the SPA only holds a session cookie.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           ClientRegistrationRepository clientRegistrations,
                                           OwnerOidcUserService ownerOidcUserService,
                                           KeycloakLogoutSuccessHandler logoutSuccessHandler,
                                           @Value("${app.frontend-url:}") String frontendUrl) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/owner/**").authenticated()
                .requestMatchers("/**").permitAll()
            )
            .oauth2Login(oauth -> oauth
                // The React app owns /login; this also disables Spring's generated login page.
                .loginPage(frontendUrl + "/login")
                .authorizationEndpoint(endpoint -> endpoint
                    .authorizationRequestResolver(new SignupAwareAuthorizationRequestResolver(clientRegistrations)))
                .userInfoEndpoint(userInfo -> userInfo.oidcUserService(ownerOidcUserService))
                .defaultSuccessUrl(frontendUrl + "/", true)
                .failureUrl(frontendUrl + "/login?error")
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(logoutSuccessHandler)
            );
        return http.build();
    }
}
