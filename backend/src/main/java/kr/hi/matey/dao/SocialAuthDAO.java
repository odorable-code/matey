package kr.hi.matey.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.hi.matey.vo.UserVO;

@Mapper
public interface SocialAuthDAO {

    UserVO findByProviderAndProviderUserId(@Param("provider") String provider,
                                                                     @Param("providerUserId") String providerUserId);

    int insertSocialUser(UserVO user);
}