package kr.hi.matey.util;

import java.util.Arrays;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import kr.hi.matey.vo.UserVO;
import lombok.Data;

@Data
public class CustomUser extends User {

    private UserVO user;

    // Spring Security가 사용자를 인증하려면 아이디, 비밀번호, 권한이라는 3가지 정보가 반드시 필요
    public CustomUser(String username, String password, Collection<? extends GrantedAuthority> authorities) {
        super(username, password, authorities);
    }

    public CustomUser(UserVO vo) {
        super(	
        		// vo.getUserName() → Spring의 username으로 설정
        		vo.getEmail(),
        		// vo.getPassword() → Spring의 password으로 설정
                vo.getPassword(),
                // vo.getRole() → SimpleGrantedAuthority를 통해 Spring의 권한(authorities) 목록으로 변환
                vo.getRoleCode() != null
                ? Arrays.asList(new SimpleGrantedAuthority(vo.getRoleCode()))
                : Arrays.asList(new SimpleGrantedAuthority("ROLE_USER")) // 권한 정보가 없으면 기본값 부여
        		);
        this.user = vo;
    }
        }