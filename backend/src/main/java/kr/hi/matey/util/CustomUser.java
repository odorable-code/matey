package kr.hi.matey.util;

import java.util.Arrays;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import kr.hi.matey.domain.MemberDTO;
import lombok.Data;

@Data
public class CustomUser extends User {

    private MemberDTO user;


    public CustomUser(String username, String password, Collection<? extends GrantedAuthority> authorities) {
        super(username, password, authorities);
    }
    public CustomUser(MemberDTO vo) {
        super(	vo.getId(),
                vo.getPw(),
                Arrays.asList(new SimpleGrantedAuthority(vo.getRole())));
        this.user = vo;
    }


}