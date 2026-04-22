package kr.hi.matey.dao;

import kr.hi.matey.dto.MemberDTO;

public interface MemberDAO {

	MemberDTO selectMember(String username);

}
