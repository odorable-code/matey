package kr.hi.matey.dao;

import kr.hi.matey.domain.UserVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SocialAuthDAO {

    UserVO findByProviderAndProviderUserId(@Param("provider") String provider,
                                                                     @Param("providerUserId") String providerUserId);

    int insertSocialUser(UserVO user);
}