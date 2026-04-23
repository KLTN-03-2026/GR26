package com.smartfnb.report.application.query;

import com.smartfnb.report.application.dto.TopItemsResult;
import com.smartfnb.report.infrastructure.persistence.DailyItemStatJpaRepository;
import com.smartfnb.report.infrastructure.persistence.DailyItemStatJpaEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * QueryHandler: Lấy Top N sản phẩm bán chạy theo ngày.
 *
 * @author vutq
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetTopItemsQueryHandler {
    
    private final DailyItemStatJpaRepository dailyItemStatRepo;
    
    public TopItemsResult handle(GetTopItemsQuery query) {
        log.info("Lấy Top Items: branchId={}, date={}, limit={}", 
            query.branchId(), query.date(), query.limit());
        
        var topItems = dailyItemStatRepo
            .findByBranchIdAndDateOrderByRevenueDesc(query.branchId(), query.date())
            .stream()
            .limit(query.limit())
            .map((entity) -> {
                var domain = entity.toDomain();
                return new TopItemsResult.TopItemDto(
                    domain.itemId(),
                    domain.itemName(),
                    domain.qtySold(),
                    domain.revenue(),
                    domain.grossMargin(),
                    0  // Rank sẽ set lại bên dưới
                );
            })
            .collect(Collectors.toList());
        
        // Set ranking
        for (int i = 0; i < topItems.size(); i++) {
            var item = topItems.get(i);
            topItems.set(i, new TopItemsResult.TopItemDto(
                item.itemId(), item.itemName(), item.qtySold(),
                item.revenue(), item.grossMargin(), i + 1
            ));
        }
        
        return new TopItemsResult(
            query.date(),
            "Branch Name",  // TODO: Lấy tên branch
            topItems
        );
    }
}
