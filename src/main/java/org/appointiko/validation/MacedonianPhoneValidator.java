package org.appointiko.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class MacedonianPhoneValidator implements ConstraintValidator<MacedonianPhone, String> {

    private static final Pattern MK_PHONE = Pattern.compile("^(\\+389|0)(7[0-8])\\d{6}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true; // Allow null/empty — use @NotBlank separately where required
        }
        String cleaned = value.replaceAll("[\\s\\-]", "");
        return MK_PHONE.matcher(cleaned).matches();
    }
}
