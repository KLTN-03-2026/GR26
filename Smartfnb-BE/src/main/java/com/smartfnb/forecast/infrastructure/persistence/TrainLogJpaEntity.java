package com.smartfnb.forecast.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * JPA Entity map bảng train_logs — do AI Service tạo và quản lý.
 * BE chỉ đọc để lấy thông tin lần train gần nhất và độ tin cậy mô hình.
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Entity
@Table(name = "train_logs", schema = "public")
@Getter
@NoArgsConstructor
public class TrainLogJpaEntity {

    /** ID tự tăng của AI Service */
    @Id
    @Column(name = "id")
    private Long id;

    /** UUID của tenant (string) */
    @Column(name = "tenant_id")
    private String tenantId;

    /** UUID của chi nhánh (string) — null nếu là global model */
    @Column(name = "branch_id")
    private String branchId;

    /** Trạng thái train: SUCCESS, FAILED, IN_PROGRESS */
    @Column(name = "status")
    private String status;

    /** Mean Absolute Error — chỉ số chất lượng mô hình */
    @Column(name = "mae")
    private Double mae;

    /** Mean Absolute Percentage Error — chỉ số chất lượng theo % */
    @Column(name = "mape")
    private Double mape;

    /** Số lượng series được train */
    @Column(name = "series_count")
    private Integer seriesCount;

    /** Thời điểm hoàn thành train */
    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    /** Loại kích hoạt: scheduled (cron) hoặc manual */
    @Column(name = "trigger_type")
    private String triggerType;
}
