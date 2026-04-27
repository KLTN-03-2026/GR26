package com.smartfnb.shared.config;

// author: Hoàng
// date: 27-04-2026
// note: Khởi tạo PayOS SDK bean dùng credentials từ application.yml.
//       Bean này chỉ nên dùng cho luồng global/legacy; PayOS theo chi nhánh dùng PayOSProvider.
//       Credentials (clientId, apiKey, checksumKey) cấu hình qua biến môi trường:
//         PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;

@Configuration
public class PayOSConfig {

    /**
     * PayOS SDK bean — singleton được dùng bởi PayOSProvider và webhook handler.
     * Constructor của PayOS(clientId, apiKey, checksumKey) sẽ throw Exception nếu params null/blank.
     */
    // @Bean
    public PayOS payOS(
            @Value("${payos.client-id}") String clientId,
            @Value("${payos.api-key}") String apiKey,
            @Value("${payos.checksum-key}") String checksumKey) throws Exception {
        return new PayOS(clientId, apiKey, checksumKey);
    }
}
