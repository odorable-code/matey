package kr.hi.matey.util;

/**
 * DB·JWT·스프링 권한 문자열이 {@code ADMIN}, {@code ROLE_ADMIN} 등으로 섞여도 동일하게 판별합니다.
 */
public final class RoleCodeHelper {

    private RoleCodeHelper() {
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        String r = raw.trim().toUpperCase();
        if (r.startsWith("ROLE_")) {
            return r.substring(5);
        }
        return r;
    }

    public static boolean isAdminOrSuperAdmin(String roleCode) {
        String r = normalize(roleCode);
        return "ADMIN".equals(r) || "SUPER_ADMIN".equals(r);
    }

    public static boolean isSuperAdmin(String roleCode) {
        // 우리 정책상 전체 관리자(ADMIN)와 최고 권한(SUPER_ADMIN)을 동일하게 취급한다.
        // 따라서 여기서는 ADMIN·SUPER_ADMIN 모두를 최고 권한으로 인정한다.
        return isAdminOrSuperAdmin(roleCode);
    }

    /** 공지·이벤트(일반) 카테고리 글쓰기: 관리자 + 부관리자 */
    public static boolean isCommunityStaffPublisher(String roleCode) {
        String r = normalize(roleCode);
        return "ADMIN".equals(r) || "SUPER_ADMIN".equals(r) || "SUBADMIN".equals(r);
    }
}
