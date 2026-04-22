package kr.hi.matey.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import kr.hi.matey.dao.HospitalAdminsDAO;
import kr.hi.matey.dao.UserDAO;
import kr.hi.matey.domain.HospitalAdminsVO;
import kr.hi.matey.domain.MemberDTO;
import kr.hi.matey.domain.UserVO;
import kr.hi.matey.util.CustomUser;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class MemberDetailService implements UserDetailsService {

    private final UserDAO userDAO;
    private final HospitalAdminsDAO hospitalAdminsDAO;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. 환자 조회
        UserVO user = userDAO.selectUser(username);
        // 2. 관리자 조회
        HospitalAdminsVO admin = hospitalAdminsDAO.selectAdmin(username);

        MemberDTO member = null;

        if (user != null) {
            // 환자
            member = new MemberDTO(
                user.getUserId(),
                user.getUserPw(),
                user.getUserName(),
                user.getUserNum(),
                user.getRole()
            );
        } else if (admin != null) {
            // 병원 관리자 ✅ hoNum 추가
            member = new MemberDTO(
                admin.getAdminId(),
                admin.getAdminPw(),
                admin.getHospitalName(),
                admin.getAdminNum(),
                admin.getRole(),
                admin.getHoNum()  // ✅ hoNum 세팅
            );
        }

     // ✅ null 반환 대신 예외 던지기 (Spring Security 계약)
        if (member == null) {
            throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username);
        }

        return new CustomUser(member);
    }
}
