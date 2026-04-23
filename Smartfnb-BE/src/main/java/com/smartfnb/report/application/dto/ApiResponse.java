package com.smartfnb.report.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard API Response wrapper for all S-19 Report APIs
 * 
 * Used for:
 * - Success responses (with data)
 * - Error responses (with message)
 * - List responses (with pagination)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    
    // Response status
    private boolean success;
    
    // Response data (can be single object, list, or null for errors)
    private T data;
    
    // Error information
    private String message;               // Error message or success message
    private String errorCode;             // VD: INVALID_DATE_RANGE, FORBIDDEN_PAYROLL_ACCESS
    
    // Pagination (if applicable)
    private PaginationInfo pagination;
    
    // Metadata
    private LocalDateTime timestamp;
    
    /**
     * Success response (with data, no pagination)
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Success response (with data and pagination)
     */
    public static <T> ApiResponse<T> success(T data, PaginationInfo pagination) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .pagination(pagination)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Error response
     */
    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
