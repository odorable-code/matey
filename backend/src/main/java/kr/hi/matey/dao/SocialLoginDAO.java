package kr.hi.matey.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.hi.matey.dto.SocialLoginDTO;
import kr.hi.matey.vo.UserVO;

@Mapper
public interface SocialLoginDAO {

    SocialLoginDTO findByProviderAndProviderUserId(
            @Param("provider") String provider,
            @Param("providerUserId") String providerUserId
    );

    UserVO findUserByUserId(@Param("userId") Long userId);

    int insertUser(UserVO user);

    int insertSocialLogin(SocialLoginDTO socialLogin);
}