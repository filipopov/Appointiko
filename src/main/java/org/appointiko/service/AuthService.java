package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import org.appointiko.model.Owner;
import org.appointiko.repo.OwnerRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Local owner accounts. Credentials live in Keycloak; this only keeps the app-side profile.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final OwnerRepository ownerRepository;

    @Transactional
    public Owner findOrCreateOwner(String email) {
        String normalized = email.trim().toLowerCase();
        return ownerRepository.findByEmail(normalized).orElseGet(() -> {
            Owner owner = new Owner();
            owner.setEmail(normalized);
            return ownerRepository.save(owner);
        });
    }

    @Transactional
    public void updatePhone(Owner owner, String phone) {
        owner.setPhone(phone);
        ownerRepository.save(owner);
    }

    public Owner getByEmail(String email) {
        return ownerRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found"));
    }
}
