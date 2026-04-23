package com.smartfnb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Điểm khởi động ứng dụng SmartF&B.
 * SaaS POS đa chi nhánh — Java 21 Virtual Threads + Spring Boot 3.3 + DDD + CQRS
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@SpringBootApplication
public class SmartFnbApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartFnbApplication.class, args);
    }
}
