package kr.hi.matey;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class VerifySeedHashes {

    @Test
    void sqlFileHashesMatchPlainPasswords() {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        assertTrue(enc.matches("user1@test.com",
                "$2a$10$WuFXSHPrxLS4NzmQ2O18/ONxOvvh9yhmtWmVdmXDhZPAllz0ACm.2"));
        assertTrue(enc.matches("subadmin1@test.com",
                "$2a$10$Mtw0DQKqQ4MyyGSRqSKApewy1vTm1GOZD8Z5BV317H6fIKa2iMUZu"));
        assertTrue(enc.matches("admin1@test.com",
                "$2a$10$VZNiB5ikzDaBMaylOAJEuuipYqCCPWi3YI0hEGe0DgwG6ysGq8mAi"));
    }
}
