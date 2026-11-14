package com.gestion.commerciale.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")  // ← correspond à votre yaml
    private String uploadDir;

    @Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String absolutePath = Paths.get(uploadDir).toAbsolutePath().toString();
    registry
        .addResourceHandler("/uploads/**")
        .addResourceLocations("file:" + absolutePath + "/")
        .setCachePeriod(0) // ← désactive le cache en dev
        .resourceChain(true);
}

@Override
public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
    registry.addMapping("/uploads/**")
            .allowedOrigins("http://localhost:5173", "http://localhost:3000",  "https://virtuous-forgiveness-production-2b84.up.railway.app")
            .allowedMethods("GET")
            .allowCredentials(true);
}
}