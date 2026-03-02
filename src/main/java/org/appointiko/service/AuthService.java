package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import org.appointiko.model.Owner;
import org.appointiko.repo.OwnerRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final OwnerRepository ownerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Owner owner = ownerRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found: " + email));
        return new User(owner.getEmail(), owner.getPasswordHash(), List.of());
    }

    public Owner register(String email, String password, String phone) {
        if (ownerRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("EMAIL_EXISTS");
        }
        Owner owner = new Owner();
        owner.setEmail(email);
        owner.setPasswordHash(passwordEncoder.encode(password));
        owner.setPhone(phone);
        return ownerRepository.save(owner);
    }

    public Owner getByEmail(String email) {
        return ownerRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found"));
    }
}
