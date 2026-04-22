package kr.hi.matey.service;

import java.util.List;

import kr.hi.matey.dao.UserDAO;
import kr.hi.matey.domain.UserDTO;
import kr.hi.matey.domain.UserVO;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class UserService {

    private final UserDAO userDAO;
    private final BCryptPasswordEncoder encoder;

    public boolean signup(UserDTO user) {
        String encodedPw = encoder.encode(user.getPassword());
        user.setPassword(encodedPw);
        try {
            boolean result = userDAO.insertUser(user);
            return result;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<UserVO> selectUsers() {
        return userDAO.selectUsers();
    }

    public boolean deleteUser(int userNum) {
        return userDAO.deleteUser(userNum);
    }

    public boolean updateUser(UserDTO user, int userNum) {
        return userDAO.updateUser(user, userNum);
    }

    public String findUserId(String phone, String email) {
        String userId = userDAO.findUserId(phone, email);
        if (userId == null) return null;
        return userId;
    }

    public UserVO login(String userId, String userPw) {
        UserVO user = userDAO.findByUserId(userId);
        if (user == null) return null;
        if (!encoder.matches(userPw, user.getPassword() )) return null;
        return user;
    }

    public boolean isIdDuplicate(String userId) {
        return userDAO.existsByUserId(userId) > 0;
    }

    // ✅ 기존 registerUser(boolean 반환) 제거 — signup()으로 통합됨

    public UserVO findOne(int userNum) {
        return userDAO.selectUserByUserNum(userNum);
    }

    public boolean isEmailDuplicate(String adminEmail) {
        return userDAO.existsByAdminEmail(adminEmail);
    }

    public boolean isBusinessNumDuplicate(String businessNum) {
        return userDAO.existsByAdminBusinessNum(businessNum);
    }

    public boolean isHospitalNameDuplicate(String hoName) {
        return userDAO.existsByAdminHoName(hoName);
    }
}
