package com.smartfnb.auth.application.command;

import com.smartfnb.auth.application.query.result.UserProfileResult;
import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Xử lý lệnh cập nhật thông tin profile cá nhân.
 * Cho phép cập nhật: fullName, phone.
 * Email không được phép thay đổi qua endpoint này.
 *
 * <p>Validation:</p>
 * <ul>
 *   <li>User phải thuộc chính tenant đang đăng nhập (chống IDOR)</li>
 *   <li>Phone mới nếu thay đổi phải unique trong tenant</li>
 * </ul>
 *
 * @author vutq
 * @since 2026-04-23
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UpdateProfileCommandHandler {

    private final UserRepository userRepository;

    /**
     * Cập nhật profile người dùng.
     *
     * @param command thông tin cập nhật — userId và tenantId lấy từ JWT
     * @return UserProfileResult sau khi cập nhật
     * @throws SmartFnbException USER_NOT_FOUND (404) nếu user không tồn tại
     * @throws SmartFnbException PHONE_ALREADY_EXISTS (409) nếu phone đã dùng bởi user khác
     */
    @Transactional
    public UserProfileResult handle(UpdateProfileCommand command) {
        log.info("Cập nhật profile user: {}", command.userId());

        // 1. Tìm user — kết hợp userId + tenantId để ngăn IDOR
        UserJpaEntity user = userRepository
                .findByIdAndTenantId(command.userId(), command.tenantId())
                .orElseThrow(() -> new SmartFnbException(
                        "USER_NOT_FOUND",
                        "Không tìm thấy tài khoản người dùng",
                        404));

        // 2. Kiểm tra phone unique trong tenant (nếu phone thay đổi)
        String newPhone = command.phone();
        if (newPhone != null && !newPhone.isBlank()
                && !newPhone.equals(user.getPhone())) {
            boolean phoneExistsForOther = userRepository
                    .existsByPhoneAndTenantIdAndIdNot(newPhone, command.tenantId(), command.userId());
            if (phoneExistsForOther) {
                throw new SmartFnbException(
                        "PHONE_ALREADY_EXISTS",
                        "Số điện thoại đã được sử dụng bởi tài khoản khác",
                        409);
            }
        }

        // 3. Cập nhật các field được phép
        user.setFullName(command.fullName());
        if (newPhone != null && !newPhone.isBlank()) {
            user.setPhone(newPhone);
        }
        userRepository.save(user);

        log.info("Cập nhật profile thành công — userId={}", command.userId());
        return UserProfileResult.from(user);
    }
}
