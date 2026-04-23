package kr.hi.matey.service;

import kr.hi.matey.dao.AdminsDAO;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import kr.hi.matey.dao.UserDAO;
import kr.hi.matey.dto.MemberDTO;
import kr.hi.matey.util.CustomUser;
import kr.hi.matey.vo.AdminsVO;
import kr.hi.matey.vo.UserVO;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class MemberDetailService implements UserDetailsService {

    private final UserDAO userDAO;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserVO user = userDAO.selectUser(username);
        if (user == null) {
            throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username);
        }
        return new CustomUser(user);
    }
}
