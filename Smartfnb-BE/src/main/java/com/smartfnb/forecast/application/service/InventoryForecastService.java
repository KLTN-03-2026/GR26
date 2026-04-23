package com.smartfnb.forecast.application.service;

import com.smartfnb.branch.infrastructure.persistence.BranchJpaEntity;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaRepository;
import com.smartfnb.forecast.application.dto.*;
import com.smartfnb.forecast.infrastructure.client.AIServiceClient;
import com.smartfnb.forecast.infrastructure.persistence.*;
import com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaEntity;
import com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaRepository;
import com.smartfnb.order.infrastructure.persistence.OrderJpaRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ dự báo tồn kho AI.
 * Đọc kết quả từ bảng AI (forecast_results, train_logs) và kết hợp với
 * dữ liệu tồn kho hiện tại từ BE để tạo response đầy đủ cho FE.
 *
 * <p>Quy tắc: KHÔNG chạy AI model realtime — chỉ đọc kết quả đã được tính sẵn.</p>
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryForecastService {

    private final ForecastResultJpaRepository forecastRepo;
    private final TrainLogJpaRepository trainLogRepo;
    private final InventoryBalanceJpaRepository inventoryBalanceRepo;
    private final BranchJpaRepository branchRepo;
    private final OrderJpaRepository orderRepo;
    private final AIServiceClient aiServiceClient;

    // ============================= PUBLIC API ==============================

    /**
     * Lấy toàn bộ dự báo tồn kho của 1 chi nhánh.
     * Sắp xếp nguyên liệu theo mức độ cấp bách: critical → warning → ok.
     *
     * @param branchId UUID chi nhánh (string)
     * @param tenantId UUID tenant (string)
     * @return response đầy đủ với danh sách nguyên liệu và độ tin cậy model
     */
    @Transactional(readOnly = true)
    public ForecastResponseDTO getForecast(String branchId, String tenantId) {
        // Kiểm tra chi nhánh thuộc đúng tenant — bảo mật multi-tenant
        BranchJpaEntity branch = getBranchOrThrow(branchId, tenantId);

        // Đọc kết quả dự báo từ AI tables
        List<ForecastResultJpaEntity> forecastRows = forecastRepo.findForecastByBranch(branchId, tenantId);
        if (forecastRows.isEmpty()) {
            log.debug("Chưa có dữ liệu dự báo cho branch={}", branchId);
            return ForecastResponseDTO.empty(branchId);
        }

        // Lấy tồn kho hiện tại từ BE (Map itemId → quantity)
        Map<String, Double> stockMap = buildStockMap(branchId, tenantId);

        // Tính số ngày hoạt động để đánh giá độ tin cậy
        int activeDays = getActiveDays(tenantId, branchId);
        Map<String, Object> confidence = calcConfidence(activeDays);

        // Lấy thời điểm train gần nhất
        String lastTrainedAt = trainLogRepo
                .findLatestSuccessfulByTenant(tenantId)
                .map(log -> log.getFinishedAt() != null ? log.getFinishedAt().toString() : null)
                .orElse(null);

        // Group forecast rows theo ingredientId rồi map sang DTO
        List<IngredientForecastDTO> ingredients = groupAndMapIngredients(forecastRows, stockMap);

        // Sắp xếp: critical → warning → ok
        ingredients = sortByUrgency(ingredients);

        return new ForecastResponseDTO(
                branchId,
                branch.getName(),
                LocalDateTime.now().toString(),
                lastTrainedAt,
                ingredients,
                (Integer) confidence.get("stars"),
                (String) confidence.get("label")
        );
    }

    /**
     * Lấy tóm tắt số lượng nguyên liệu theo mức độ cấp bách.
     *
     * @param branchId UUID chi nhánh (string)
     * @param tenantId UUID tenant (string)
     * @return tóm tắt urgentCount / warningCount / okCount
     */
    @Transactional(readOnly = true)
    public ForecastSummaryDTO getSummary(String branchId, String tenantId) {
        // Kiểm tra chi nhánh thuộc đúng tenant
        getBranchOrThrow(branchId, tenantId);

        // Đếm theo urgency từ DB
        List<Object[]> urgencyCounts = forecastRepo.countByUrgency(branchId, tenantId);

        int urgent = 0, warning = 0, ok = 0;
        for (Object[] row : urgencyCounts) {
            String urgency = (String) row[0];
            long count = ((Number) row[1]).longValue();
            switch (urgency != null ? urgency : "") {
                case "critical" -> urgent += (int) count;
                case "warning"  -> warning += (int) count;
                case "ok"       -> ok += (int) count;
            }
        }

        int activeDays = getActiveDays(tenantId, branchId);
        Map<String, Object> confidence = calcConfidence(activeDays);

        return new ForecastSummaryDTO(
                branchId,
                urgent,
                warning,
                ok,
                urgent + warning + ok,
                LocalDateTime.now().toString(),
                (Integer) confidence.get("stars")
        );
    }

    /**
     * Lấy dự báo cho 1 nguyên liệu cụ thể.
     *
     * @param branchId     UUID chi nhánh (string)
     * @param tenantId     UUID tenant (string)
     * @param ingredientId UUID nguyên liệu (string)
     * @return DTO nguyên liệu với danh sách dự báo theo ngày
     * @throws SmartFnbException nếu không tìm thấy dữ liệu dự báo
     */
    @Transactional(readOnly = true)
    public IngredientForecastDTO getForecastByIngredient(
            String branchId, String tenantId, String ingredientId) {

        getBranchOrThrow(branchId, tenantId);

        List<ForecastResultJpaEntity> rows =
                forecastRepo.findForecastByIngredient(branchId, tenantId, ingredientId);

        if (rows.isEmpty()) {
            throw new SmartFnbException(
                    "FORECAST_NOT_FOUND",
                    "Chưa có dữ liệu dự báo cho nguyên liệu này. Hệ thống sẽ cập nhật vào đêm nay.",
                    404
            );
        }

        // Lấy tồn kho hiện tại cho nguyên liệu này
        UUID branchUuid = UUID.fromString(branchId);
        UUID ingredientUuid = UUID.fromString(ingredientId);

        double currentStock = inventoryBalanceRepo
                .findByBranchIdAndItemId(branchUuid, ingredientUuid)
                .map(b -> b.getQuantity().doubleValue())
                .orElse(0.0);

        return mapToIngredientDTO(rows, currentStock);
    }

    /**
     * Lấy trạng thái train model cho 1 chi nhánh.
     *
     * @param tenantId UUID tenant (string)
     * @param branchId UUID chi nhánh (string)
     * @return DTO trạng thái train với độ tin cậy model
     */
    @Transactional(readOnly = true)
    public TrainStatusDTO getTrainStatus(String tenantId, String branchId) {
        Optional<TrainLogJpaEntity> latestLog =
                trainLogRepo.findLatestSuccessfulByTenantAndBranch(tenantId, branchId)
                        .or(() -> trainLogRepo.findTopByTenantIdOrderByFinishedAtDesc(tenantId));

        int activeDays = getActiveDays(tenantId, branchId);
        Map<String, Object> confidence = calcConfidence(activeDays);

        return new TrainStatusDTO(
                branchId,
                latestLog.map(l -> l.getFinishedAt() != null ? l.getFinishedAt().toString() : null).orElse(null),
                latestLog.map(TrainLogJpaEntity::getStatus).orElse(null),
                latestLog.map(TrainLogJpaEntity::getSeriesCount).orElse(null),
                latestLog.isPresent(),
                (Integer) confidence.get("stars"),
                (String) confidence.get("label")
        );
    }

    /**
     * Trigger train thủ công — gọi AI Service async.
     *
     * @param tenantId UUID tenant (string)
     * @param jwtToken JWT token để forward cho AI Service
     */
    public void triggerTrain(String tenantId, String jwtToken) {
        log.info("Trigger train thủ công cho tenant={}", tenantId);
        aiServiceClient.triggerTrain(tenantId, jwtToken);
    }

    // ============================= PRIVATE HELPERS ========================

    /**
     * Lấy chi nhánh, đồng thời kiểm tra quyền tenant (chống IDOR).
     */
    private BranchJpaEntity getBranchOrThrow(String branchId, String tenantId) {
        UUID branchUuid = UUID.fromString(branchId);
        UUID tenantUuid = UUID.fromString(tenantId);

        BranchJpaEntity branch = branchRepo.findById(branchUuid)
                .orElseThrow(() -> new SmartFnbException(
                        "BRANCH_NOT_FOUND",
                        "Không tìm thấy chi nhánh: " + branchId,
                        404
                ));

        // Đảm bảo chi nhánh thuộc đúng tenant — bảo mật multi-tenant
        if (!branch.getTenantId().equals(tenantUuid)) {
            throw new SmartFnbException(
                    "BRANCH_ACCESS_DENIED",
                    "Không có quyền truy cập chi nhánh này",
                    403
            );
        }
        return branch;
    }

    /**
     * Xây dựng Map itemId(string) → currentStock từ inventory_balances.
     */
    private Map<String, Double> buildStockMap(String branchId, String tenantId) {
        UUID branchUuid = UUID.fromString(branchId);
        UUID tenantUuid = UUID.fromString(tenantId);

        List<InventoryBalanceJpaEntity> balances =
                inventoryBalanceRepo.findByTenantAndBranch(tenantUuid, branchUuid,
                        org.springframework.data.domain.Pageable.unpaged());

        return balances.stream()
                .collect(Collectors.toMap(
                        b -> b.getItemId().toString(),
                        b -> b.getQuantity().doubleValue(),
                        (a, b) -> a
                ));
    }

    /**
     * Group forecast rows theo ingredientId và map sang List<IngredientForecastDTO>.
     */
    private List<IngredientForecastDTO> groupAndMapIngredients(
            List<ForecastResultJpaEntity> rows,
            Map<String, Double> stockMap) {

        // Group theo ingredientId
        Map<String, List<ForecastResultJpaEntity>> grouped = rows.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getSeries().getIngredientId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<IngredientForecastDTO> result = new ArrayList<>();
        for (Map.Entry<String, List<ForecastResultJpaEntity>> entry : grouped.entrySet()) {
            String ingredientId = entry.getKey();
            List<ForecastResultJpaEntity> ingredientRows = entry.getValue();

            double currentStock = stockMap.getOrDefault(ingredientId, 0.0);
            result.add(mapToIngredientDTO(ingredientRows, currentStock));
        }
        return result;
    }

    /**
     * Map danh sách ForecastResultJpaEntity (cùng ingredientId) sang IngredientForecastDTO.
     * Lấy thông tin tên/unit từ row đầu tiên (tất cả row cùng ingredient thì tên giống nhau).
     */
    private IngredientForecastDTO mapToIngredientDTO(
            List<ForecastResultJpaEntity> rows, double currentStock) {

        if (rows.isEmpty()) {
            return null;
        }

        ForecastResultJpaEntity first = rows.get(0);
        String ingredientId = first.getSeries().getIngredientId();

        // Lấy tên và unit từ inventory_balances (có thể null nếu chưa import)
        String ingredientName = ingredientId; // fallback
        String unit = "";
        try {
            UUID ingredientUuid = UUID.fromString(ingredientId);
            // Tìm bất kỳ branch nào có ingredient này để lấy tên
            var balanceOpt = inventoryBalanceRepo
                    .findByBranchIdAndItemId(
                            UUID.fromString(first.getSeries().getBranchId()),
                            ingredientUuid
                    );
            if (balanceOpt.isPresent()) {
                ingredientName = balanceOpt.get().getItemName() != null
                        ? balanceOpt.get().getItemName() : ingredientId;
                unit = balanceOpt.get().getUnit() != null ? balanceOpt.get().getUnit() : "";
            }
        } catch (Exception e) {
            log.debug("Không lấy được tên nguyên liệu {}: {}", ingredientId, e.getMessage());
        }

        // Lấy thông tin từ row cuối cùng (ngày xa nhất) — stockout và suggested order
        ForecastResultJpaEntity representative = rows.stream()
                .max(Comparator.comparing(ForecastResultJpaEntity::getForecastDate))
                .orElse(first);

        // Urgency: lấy mức nguy cấp nhất trong các ngày dự báo
        String urgency = rows.stream()
                .map(ForecastResultJpaEntity::getUrgency)
                .filter(Objects::nonNull)
                .max(Comparator.comparingInt(InventoryForecastService::urgencyRank))
                .orElse("ok");

        // Danh sách ngày dự báo
        List<DayForecastDTO> forecastDays = rows.stream()
                .map(r -> new DayForecastDTO(
                        r.getForecastDate().toString(),
                        r.getPredictedQty()
                ))
                .toList();

        return new IngredientForecastDTO(
                ingredientId,
                ingredientName,
                unit,
                currentStock,
                forecastDays,
                representative.getStockoutDate() != null
                        ? representative.getStockoutDate().toString() : null,
                representative.getSuggestedQty(),
                representative.getSuggestedOrderDate() != null
                        ? representative.getSuggestedOrderDate().toString() : null,
                urgency,
                representative.getIsFallback()
        );
    }

    /**
     * Sắp xếp danh sách nguyên liệu: critical → warning → ok.
     */
    private List<IngredientForecastDTO> sortByUrgency(List<IngredientForecastDTO> ingredients) {
        return ingredients.stream()
                .sorted(Comparator.comparingInt(
                        (IngredientForecastDTO i) -> urgencyRank(i.urgency())
                ).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Quy đổi urgency string thành số để sort (critical > warning > ok).
     */
    private static int urgencyRank(String urgency) {
        return switch (urgency != null ? urgency : "") {
            case "critical" -> 2;
            case "warning"  -> 1;
            default         -> 0;
        };
    }

    /**
     * Đếm số ngày phân biệt có đơn hàng hoàn thành của chi nhánh.
     * Dùng để tính độ tin cậy model AI.
     *
     * @param tenantId UUID tenant (string)
     * @param branchId UUID chi nhánh (string)
     * @return số ngày đã hoạt động
     */
    private int getActiveDays(String tenantId, String branchId) {
        try {
            UUID tenantUuid = UUID.fromString(tenantId);
            UUID branchUuid = UUID.fromString(branchId);
            return (int) orderRepo.countDistinctCompletedOrderDays(tenantUuid, branchUuid);
        } catch (Exception e) {
            log.debug("Không đếm được active days cho branch={}: {}", branchId, e.getMessage());
            return 0;
        }
    }

    /**
     * Tính độ tin cậy model dựa trên số ngày có đơn hàng.
     * Nhiều ngày hoạt động → AI có nhiều data → model đáng tin hơn.
     *
     * @param activeDays số ngày phân biệt có đơn COMPLETED
     * @return Map gồm "stars" (Integer 1–5) và "label" (String)
     */
    private Map<String, Object> calcConfidence(int activeDays) {
        if (activeDays >= 365) return Map.of("stars", 5, "label", "Rất tin cậy");
        if (activeDays >= 180) return Map.of("stars", 4, "label", "Tin cậy");
        if (activeDays >= 90)  return Map.of("stars", 3, "label", "Khá tin cậy");
        if (activeDays >= 30)  return Map.of("stars", 2, "label", "Đang học");
        return Map.of("stars", 1, "label", "Mới bắt đầu");
    }
}
