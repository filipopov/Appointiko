package org.appointiko.controller;

import org.appointiko.repo.OwnerRepository;
import org.appointiko.repo.SalonRepository;
import org.appointiko.service.AuthService;
import org.appointiko.service.GeocodingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * First login through Keycloak creates a bare owner; the owner then sets up their salon.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class OwnerOnboardingIntegrationTest {

    private static final String EMAIL = "new.owner@example.com";
    private static final String SETUP_JSON =
            "{\"salonName\":\"Nail Studio Ana\",\"city\":\"Skopje\",\"address\":\"Partizanska 1\",\"phone\":\"070123456\"}";

    @Autowired private MockMvc mvc;
    @Autowired private AuthService authService;
    @Autowired private OwnerRepository ownerRepository;
    @Autowired private SalonRepository salonRepository;

    @MockitoBean private GeocodingService geocodingService;

    @Test
    void findOrCreateOwner_isIdempotentAndCaseInsensitive() {
        var first = authService.findOrCreateOwner("  New.Owner@Example.com ");
        var second = authService.findOrCreateOwner(EMAIL);

        assertThat(second.getId()).isEqualTo(first.getId());
        assertThat(first.getEmail()).isEqualTo(EMAIL);
        assertThat(ownerRepository.findByEmail(EMAIL)).isPresent();
    }

    @Test
    @WithMockUser(username = EMAIL)
    void setupSalon_createsSalonOnce() throws Exception {
        var owner = authService.findOrCreateOwner(EMAIL);

        mvc.perform(post("/api/owner/salon").with(csrf())
                        .contentType("application/json").content(SETUP_JSON))
                .andExpect(status().isNoContent());

        assertThat(salonRepository.findByOwnerId(owner.getId()))
                .hasValueSatisfying(salon -> assertThat(salon.getName()).isEqualTo("Nail Studio Ana"));
        assertThat(ownerRepository.findById(owner.getId()).orElseThrow().getPhone()).isEqualTo("070123456");

        mvc.perform(post("/api/owner/salon").with(csrf())
                        .contentType("application/json").content(SETUP_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SALON_EXISTS"));
    }

    @Test
    @WithMockUser(username = EMAIL, roles = "ADMIN")
    void me_reportsAdminFromRole() throws Exception {
        authService.findOrCreateOwner(EMAIL);

        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admin").value(true))
                .andExpect(jsonPath("$.salon").doesNotExist());
    }

    @Test
    @WithMockUser(username = EMAIL)
    void setupSalon_validatesInput() throws Exception {
        authService.findOrCreateOwner(EMAIL);

        mvc.perform(post("/api/owner/salon").with(csrf())
                        .contentType("application/json").content("{\"salonName\":\"\",\"city\":\"Skopje\",\"address\":\"x\"}"))
                .andExpect(status().isBadRequest());
    }
}
