package kr.hi.matey.vo;

import java.sql.Timestamp;

import lombok.Data;
@Data
public class RoleVO {
	private long role_id;
	private String role_code;
	private String role_name;
	private String description;
	private int is_active;
	private Timestamp created_at;

}
