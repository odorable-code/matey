package kr.hi.matey.dto;

/**
 * 관리자 역할 열거형
 */
public enum AdminRole {
    USER("USER", "일반 사용자"),
    ADMIN("ADMIN", "일반 관리자"),
    SUPER_ADMIN("SUPER_ADMIN", "슈퍼 관리자");

    private final String code;
    private final String label;

    AdminRole(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    public static AdminRole fromCode(String code) {
        for (AdminRole role : values()) {
            if (role.code.equalsIgnoreCase(code)) {
                return role;
            }
        }
        return USER;
    }
}