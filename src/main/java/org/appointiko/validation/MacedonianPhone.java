package org.appointiko.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = MacedonianPhoneValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface MacedonianPhone {
    String message() default "INVALID_PHONE";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
