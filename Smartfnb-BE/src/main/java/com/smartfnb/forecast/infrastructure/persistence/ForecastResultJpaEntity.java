package com.smartfnb.forecast.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * JPA Entity map bảng forecast_results — do AI Service tạo và quản lý.
 * BE chỉ đọc, KHÔNG ghi, KHÔNG có foreign key.
 * Mỗi row là kết quả dự báo 1 ngày cho 1 nguyên liệu × chi nhánh.
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Entity
@Table(name = "forecast_results", schema = "public")
@Getter
@NoArgsConstructor
public class ForecastResultJpaEntity {

    /** ID tự tăng của AI Service */
    @Id
    @Column(name = "id")
    private Long id;

    /** FK sang ai_series_registry.id — dùng @ManyToOne để JOIN trong JPQL */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id", insertable = false, updatable = false)
    private AiSeriesRegistryJpaEntity series;

    /** series_id dạng Long để filter trực tiếp nếu cần */
    @Column(name = "series_id", insertable = false, updatable = false)
    private Long seriesId;

    /** Ngày dự báo */
    @Column(name = "forecast_date")
    private LocalDate forecastDate;

    /** Số lượng tiêu thụ dự báo (đơn vị nguyên liệu) */
    @Column(name = "predicted_qty")
    private Double predictedQty;

    /** Ngày dự kiến hết hàng — null nếu tồn kho đủ trong kỳ dự báo */
    @Column(name = "stockout_date")
    private LocalDate stockoutDate;

    /** Số lượng gợi ý nhập */
    @Column(name = "suggested_qty")
    private Double suggestedQty;

    /** Ngày nên đặt hàng */
    @Column(name = "suggested_order_date")
    private LocalDate suggestedOrderDate;

    /**
     * Mức độ cấp bách: critical (hết hàng trong ≤3 ngày),
     * warning (hết hàng trong ≤7 ngày), ok (đủ hàng)
     */
    @Column(name = "urgency")
    private String urgency;

    /** true nếu dùng fallback prediction (chưa đủ data train model) */
    @Column(name = "is_fallback")
    private Boolean isFallback;

    /** Thời điểm AI Service ghi kết quả */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
