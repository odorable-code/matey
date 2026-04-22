package kr.hi.matey.service;

import kr.hi.matey.dao.AdminsDAO;
import kr.hi.matey.domain.AdminsDTO;


import lombok.AllArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class AdminsService {
    private final AdminsDAO adminsDAO;
    private final BCryptPasswordEncoder encoder;

    public boolean insertAdmin(AdminsDTO dto) {
        String encodedPw = encoder.encode(dto.getAdminPw());
        dto.setAdminPw(encodedPw);
        try {
        	System.out.println(dto);
            return adminsDAO.insertAdmin(dto);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ✅ adminMapper → hospitalAdminsDAO 로 수정
    public AdminsDTO getAdminById(String adminId) {
        return adminsDAO.selectAdminById(adminId);
    }
}
