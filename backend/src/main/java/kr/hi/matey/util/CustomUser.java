package kr.hi.matey.util;

import java.math.BigInteger;
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


    public CustomUser(String username, String password, Collection<? extends GrantedAuthority> authorities) {
        super(username, password, authorities);
    }

    public CustomUser(UserVO vo) {
        super(	vo.getUserName(),
                vo.getPassword(),
                Arrays.asList(new SimpleGrantedAuthority(vo.getRole())));
        this.user = vo;
    }
}