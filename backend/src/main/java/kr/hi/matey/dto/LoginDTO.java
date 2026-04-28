package kr.hi.matey.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record LoginDTO (
    @Schema(description = "사용자의 아이디")
    long userId,
    @Schema(description = "사용자의 암호")
    String userPw,

    //AdminLogin-서연
    @Schema(description = "로그인 상태 유지 여부")
    boolean keepLogin
) {}