package com.smartfnb.payment.infrastructure.persistence;

import com.smartfnb.payment.domain.repository.InvoiceNumberGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Implementation của InvoiceNumberGenerator.
 * Sinh ra invoice_number duy nhất bằng Redis counter.
 * Format: INV-{BRANCH_CODE}-{YYYYMMDD}-{COUNTER}
 * Ví dụ: INV-XYZ-20260401-000001
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InvoiceNumberGeneratorImpl implements InvoiceNumberGenerator {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String INVOICE_COUNTER_KEY_PREFIX = "invoice:counter:";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter BRANCH_CODE_FORMATTER = DateTimeFormatter.ofPattern("yy");

    @Override
    public String generateInvoiceNumber(UUID branchId) {
        String branchCode = branchId.toString().substring(0, 3).toUpperCase();
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        
        // Redis key theo ngày để counter reset mỗi ngày
        String counterKey = INVOICE_COUNTER_KEY_PREFIX + dateStr + ":" + branchCode;
        
        // Increment counter
        Long counter = redisTemplate.opsForValue().increment(counterKey);
        
        // Set expiry 30 ngày để tránh accumulate counter
        redisTemplate.expire(counterKey, java.time.Duration.ofDays(30));
        
        String invoiceNumber = String.format("INV-%s-%s-%06d", 
            branchCode, dateStr, counter);
        
        log.debug("Sinh ra invoice_number: {}", invoiceNumber);
        return invoiceNumber;
    }
}
