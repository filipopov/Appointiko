package org.appointiko.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.appointiko.validation.MacedonianPhone;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String password,
        @MacedonianPhone String phone,
        @NotBlank String salonName
) {}
