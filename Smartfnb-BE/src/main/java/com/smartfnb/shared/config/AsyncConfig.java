package com.smartfnb.shared.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Cấu hình xử lý bất đồng bộ cho SmartF&B.
 * Cho phép sử dụng annotation @Async để chạy các tác vụ trong thread pool riêng.
 * Đặc biệt quan trọng cho WebSocket event handlers để không block main thread.
 *
 * @author vutq
 * @since 2026-05-03
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Phase 2: Có thể cấu hình ThreadPoolTaskExecutor cụ thể tại đây nếu cần
}
