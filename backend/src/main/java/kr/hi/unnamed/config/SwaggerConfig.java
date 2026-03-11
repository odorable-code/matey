package kr.hi.unnamed.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("내 프로젝트 API 문서")
                        .description("Spring Boot 3.x 기반 API 명세서입니다.")
                        .version("1.0.0"));
    }
}