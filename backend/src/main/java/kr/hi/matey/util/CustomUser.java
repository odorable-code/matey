package kr.hi.matey.util;

import java.util.Arrays;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import kr.hi.matey.domain.UserDTO;
import kr.hi.matey.vo.UserVO;
import lombok.Data;

@Data
public class CustomUser extends User {

    private UserDTO user;
    private UserVO userVO;

    public CustomUser(String username, String password, Collection<? extends GrantedAuthority> authorities) {
        super(username, password, authorities);
    }

    public CustomUser(UserDTO vo) {
        super(
            String.valueOf(vo.getUserId()),
            vo.getPassword(),
            Arrays.asList(new SimpleGrantedAuthority(vo.getRole()))
        );
        this.user = vo;
    }

    public CustomUser(UserVO userVO) {
        super(
            userVO.getEmail(),
            userVO.getPassword(),
            Arrays.asList(new SimpleGrantedAuthority(userVO.getRole()))
        );
        this.userVO = userVO;
    }
}