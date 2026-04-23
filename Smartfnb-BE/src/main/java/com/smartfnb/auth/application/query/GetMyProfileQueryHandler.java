package com.smartfnb.auth.application.query;

import com.smartfnb.auth.application.query.result.UserProfileResult;
import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Handler lấy profile người dùng hiện tại.
 * Read-only — không có @Transactional.
 *
 * <p>Security: query bắt buộc kết hợp userId + tenantId để ngăn IDOR.
 * Nếu user không tồn tại hoặc thuộc tenant khác → 404 NOT FOUND.</p>
 *
 * @author vutq
 * @since 2026-04-23
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GetMyProfileQueryHandler {

    private final UserRepository userRepository;

    /**
     * Lấy thông tin profile của người dùng hiện tại.
     *
     * @param query chứa userId và tenantId từ JWT
     * @return UserProfileResult — các field an toàn, không có passwordHash/posPin
     * @throws SmartFnbException 404 nếu user không tồn tại hoặc không thuộc tenant
     */
    public UserProfileResult handle(GetMyProfileQuery query) {
        log.info("Lấy profile user: {}", query.userId());

        UserJpaEntity user = userRepository
                .findByIdAndTenantId(query.userId(), query.tenantId())
                .orElseThrow(() -> new SmartFnbException(
                        "USER_NOT_FOUND",
                        "Không tìm thấy tài khoản người dùng",
                        404));

        return UserProfileResult.from(user);
    }
}
