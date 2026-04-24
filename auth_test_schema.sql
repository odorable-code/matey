-- Authentication test schema extracted from DB draft
-- 대상 기능:
-- 회원가입, 로그인, 중복 이메일 확인, 비밀번호 재설정, 아이디 찾기, 자동 로그인, 로그아웃

CREATE TABLE ROLE (
    role_id BIGINT NOT NULL AUTO_INCREMENT,
    role_code VARCHAR(30) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_active TINYINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_role_code (role_code)
);

CREATE TABLE USER (
    user_id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NULL,
    nickname VARCHAR(30) NOT NULL,
    user_name VARCHAR(30) NULL,
    birth_date DATE NULL,
    gender VARCHAR(10) NULL,
    profile_image VARCHAR(500) NULL,
    login_type VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_terms_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    is_privacy_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    is_marketing_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_email (email),
    KEY idx_user_role_id (role_id),
    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id) REFERENCES ROLE(role_id)
);

CREATE TABLE SOCIAL_LOGIN (
    social_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (social_id),
    UNIQUE KEY uq_social_provider_user (provider, provider_user_id),
    KEY idx_social_user_id (user_id),
    CONSTRAINT fk_social_user
        FOREIGN KEY (user_id) REFERENCES USER(user_id)
        ON DELETE CASCADE
);

CREATE TABLE AUTO_LOGIN (
    auto_login_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(500) NULL DEFAULT NULL,
    last_used_at TIMESTAMP NULL DEFAULT NULL,
    expired_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (auto_login_id),
    UNIQUE KEY uq_auto_login_token_hash (token_hash),
    KEY idx_auto_login_user_id (user_id),
    KEY idx_auto_login_expired_at (expired_at),
    CONSTRAINT fk_auto_login_user
        FOREIGN KEY (user_id) REFERENCES USER(user_id)
        ON DELETE CASCADE
);

-- 비밀번호 재설정 임시 토큰(리프레시 토큰과 별도)
CREATE TABLE PASSWORD_RESET_TOKEN (
    reset_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    requested_ip VARCHAR(45) NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (reset_id),
    UNIQUE KEY uq_password_reset_token_hash (token_hash),
    KEY idx_password_reset_user_id (user_id),
    KEY idx_password_reset_expires_at (expires_at),
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES USER(user_id)
        ON DELETE CASCADE
);
