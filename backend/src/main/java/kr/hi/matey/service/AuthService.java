package kr.hi.matey.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import kr.hi.matey.dao.AuthDAO;
import kr.hi.matey.dao.UserDAO;
import kr.hi.matey.domain.UserDTO;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AuthService {
	
	private final AuthDAO authDAO;
	private final BCryptPasswordEncoder encoder;
//	private final NotificationService notificationService;
	

	public boolean signup(UserDTO user) {
		String encodedPw = encoder.encode(user.getPassword());
        user.setPassword(encodedPw);
        try {
            boolean result = authDAO.insertUser(user);
            return result;
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

}
