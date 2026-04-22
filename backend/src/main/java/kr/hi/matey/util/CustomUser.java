package kr.hi.matey.util;

import java.util.Arrays;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import kr.hi.matey.domain.UserDTO;
import lombok.Data;

@Data
// Spring Security는 내부적으로 User라는 객체를 사용해 인증을 처리하는데,
//여기에 우리 서비스만의 추가 정보(닉네임, 주소 등)를 담고 싶을 때 이렇게 User를 상속받아 CustomUser를 만듬
public class CustomUser extends User {

    private UserDTO user;

    // Spring Security에서 말하는 username은 실제 사람의 이름(Name)이 아니라, 로그인을 할 때 사용하는 '유저 식별자(ID)'를 의미
    public CustomUser(String username, String password, Collection<? extends GrantedAuthority> authorities) {
        super(username, password, authorities);
    }
    public CustomUser(UserDTO vo) {
        super(	vo.getUserId(),
                vo.getPassword(),
                Arrays.asList(new SimpleGrantedAuthority(vo.getRole())));
        this.user = vo;
    }


}