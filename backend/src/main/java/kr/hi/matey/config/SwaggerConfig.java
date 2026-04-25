package kr.hi.matey.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
    	// Security Scheme 정의
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");
        
        // Security Requirement 정의
        SecurityRequirement securityRequirement = new SecurityRequirement().addList("BearerAuth");
    	
        return new OpenAPI()
                .info(new Info().title("Matey API")
                        .description("Spring Boot 3.x 기반 API 명세서입니다.")
                        .version("1.0.0"))
				        .addSecurityItem(securityRequirement)  // Security Requirement 추가
				        .schemaRequirement("BearerAuth", securityScheme);  // Security Scheme 추가
    }
}