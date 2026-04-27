package com.smartfnb.payment.infrastructure.external;

// author: Hoàng
// date: 27-04-2026
// note: Refactored sang PayOS Java SDK mới nhất (vn.payos:payos-java 2.0.1).
//       Không còn dùng global PayOS bean — thay bằng per-request PayOS instance.
//       Mỗi lần thanh toán, resolvePayOS() đọc credentials của chi nhánh hiện tại
//       từ branch_payment_configs (branchId + tenantId từ TenantContext),
//       giải mã AES-256 rồi khởi tạo PayOS(clientId, apiKey, checksumKey).
//       Điều này đảm bảo mỗi chi nhánh dùng đúng API key đã cấu hình.
//       orderCode được tính từ MSBs của paymentId — đảm bảo unique, < 10^10, dương.
//       SDK 2.x dùng package vn.payos.model.*, không dùng vn.payos.type.*.

import com.smartfnb.branch.infrastructure.persistence.BranchPaymentConfigJpaEntity;
import com.smartfnb.branch.infrastructure.persistence.BranchPaymentConfigJpaRepository;
import com.smartfnb.shared.AesEncryptionUtil;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Component("payos")
@RequiredArgsConstructor
@Slf4j
public class PayOSProvider implements QRCodeProvider {

    // author: Hoàng | date: 27-04-2026 | note: Bỏ global PayOS bean.
    //   Inject repository + AES util để build PayOS instance per-request
    //   từ credentials của chi nhánh trong branch_payment_configs.
    private final BranchPaymentConfigJpaRepository paymentConfigRepository;
    private final AesEncryptionUtil aesEncryptionUtil;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    /**
     * Khởi tạo PayOS instance theo chi nhánh đang xử lý request.
     * Lấy branchId + tenantId từ TenantContext, query DB, decrypt credentials.
     *
     * @throws SmartFnbException nếu chưa cấu hình PayOS hoặc branchId null
     */
    // author: Hoàng | date: 27-04-2026 | note: resolvePayOS() thay thế cho global bean.
    //   Mỗi request tạo PayOS mới từ credentials đúng của chi nhánh.
    public PayOS resolvePayOS(UUID tenantId, UUID branchId) throws Exception {
        if (tenantId == null) {
            throw new SmartFnbException("PAYOS_CONFIG_MISSING",
                "Không xác định được tenant hiện tại — không thể lấy cấu hình PayOS", 400);
        }

        if (branchId == null) {
            throw new SmartFnbException("PAYOS_CONFIG_MISSING",
                "Không xác định được chi nhánh hiện tại — không thể lấy cấu hình PayOS", 400);
        }

        BranchPaymentConfigJpaEntity config = paymentConfigRepository
            .findByBranchIdAndTenantId(branchId, tenantId)
            .orElseThrow(() -> new SmartFnbException("PAYOS_CONFIG_MISSING",
                "Chi nhánh chưa cấu hình PayOS. Vui lòng vào Cài đặt chi nhánh để nhập API Key.", 400));

        if (!config.isActive()) {
            throw new SmartFnbException("PAYOS_CONFIG_INACTIVE",
                "Cấu hình PayOS của chi nhánh đang bị tắt. Vui lòng kiểm tra lại cài đặt.", 400);
        }

        String apiKey      = aesEncryptionUtil.decrypt(config.getApiKeyEncrypted());
        String checksumKey = aesEncryptionUtil.decrypt(config.getChecksumKeyEncrypted());

        log.debug("Khởi tạo PayOS instance cho branchId={}", branchId);
        return new PayOS(config.getClientId(), apiKey, checksumKey);
    }

    private PayOS resolvePayOS() throws Exception {
        UUID tenantId = TenantContext.getCurrentTenantId();
        UUID branchId = TenantContext.getCurrentBranchId();
        return resolvePayOS(tenantId, branchId);
    }

    /**
     * Tạo payment link PayOS cho đơn hàng.
     * SDK xây dựng request body và tính signature HMAC-SHA256 nội bộ.
     * Trả về qrCodeUrl = checkoutUrl của PayOS — khách quét bằng app ngân hàng bất kỳ.
     */
    @Override
    public QRCodeResponse generateQRCode(UUID paymentId, BigDecimal amount, String orderNumber) throws Exception {
        // PayOS yêu cầu orderCode là số nguyên dương — dùng 10 chữ số cuối từ MSBs của UUID
        long orderCode = Math.abs(paymentId.getMostSignificantBits() % 10_000_000_000L);
        if (orderCode == 0) orderCode = 1; // tránh orderCode = 0
        Long amountValue = amount.longValue();
        log.info("PayOS chuẩn bị tạo payment link: paymentId={}, orderCode={}, orderNumber={}, amount={}",
            paymentId, orderCode, orderNumber, amountValue);

        // author: Hoàng | date: 27-04-2026 | note: PayOS giới hạn description tối đa 25 ký tự.
        //   Truncate để tránh lỗi validation từ PayOS API.
        String rawDescription = "TT " + orderNumber;
        String description = rawDescription.length() > 25
            ? rawDescription.substring(0, 25)
            : rawDescription;

        // author: Hoàng | date: 27-04-2026 | note: SDK PayOS 2.0.1 đổi ItemData -> PaymentLinkItem.
        PaymentLinkItem item = PaymentLinkItem.builder()
                .name(description)
                .price(amountValue)
                .quantity(1)
                .build();

        // author: Hoàng | date: 27-04-2026 | note: SDK PayOS 2.0.1 dùng CreatePaymentLinkRequest và amount/orderCode kiểu Long.
        //       expiredAt đồng bộ hạn QR với backend để giảm trường hợp gateway PAID sau khi UI local hết hạn.
        CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amountValue)
                .description(description)
                .item(item)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .expiredAt(Instant.now().plusSeconds(180).getEpochSecond())
                .build();

        try {
            // author: Hoàng | date: 27-04-2026 | note: Dùng resolvePayOS() thay vì global bean
            //   để lấy đúng credentials của chi nhánh đang xử lý request.
            PayOS payOS = resolvePayOS();
            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            String checkoutUrl   = response.getCheckoutUrl();
            String transactionId = response.getPaymentLinkId();
            String qrCode        = response.getQrCode();

            log.info("PayOS tạo payment link thành công: paymentId={}, orderCode={}, paymentLinkId={}, checkoutUrlPresent={}, qrCodePresent={}",
                paymentId, orderCode, transactionId,
                checkoutUrl != null && !checkoutUrl.isBlank(),
                qrCode != null && !qrCode.isBlank());

            return new QRCodeResponse(
                checkoutUrl,   // FE render QR từ URL này — khách quét mở trang thanh toán PayOS
                qrCode,        // PayOS SDK 2.0.1 trả raw QR string ở field qrCode
                transactionId,
                180L
            );
        } catch (SmartFnbException e) {
            // rethrow để GlobalExceptionHandler trả đúng HTTP status và error code
            throw e;
        } catch (Exception e) {
            log.error("PayOS tạo payment link thất bại: orderCode={}, error={}", orderCode, e.getMessage());
            throw new SmartFnbException("PAYOS_ERROR",
                "Không thể tạo link thanh toán PayOS: " + e.getMessage(), 502);
        }
    }

    /**
     * Kiểm tra trạng thái thanh toán từ PayOS.
     * SDK gọi GET /v2/payment-requests/{orderCode} và trả về PaymentLinkData.
     */
    @Override
    public QRStatusResponse checkPaymentStatus(UUID paymentId) throws Exception {
        try {
            // Dùng orderCode để nhất quán với generateQRCode
            long orderCode = Math.abs(paymentId.getMostSignificantBits() % 10_000_000_000L);
            if (orderCode == 0) orderCode = 1;

            // author: Hoàng | date: 27-04-2026 | note: Dùng resolvePayOS() để lấy credentials chi nhánh.
            PaymentLink data = resolvePayOS().paymentRequests().get(orderCode);

            // PayOS status: PENDING, PAID, CANCELLED, EXPIRED
            String payosStatus = data.getStatus() != null ? data.getStatus().getValue().toUpperCase() : "PENDING";
            String internalStatus = switch (payosStatus) {
                case "PAID"                   -> "success";
                case "CANCELLED", "EXPIRED"   -> "failed";
                default                       -> "pending";
            };
            // author: Hoàng | date: 27-04-2026 | note: Trả amount PayOS thật để ConfirmQRPaymentCommandHandler không đánh fail vì amount = 0.
            Long amountPaid = data.getAmountPaid() != null ? data.getAmountPaid() : data.getAmount();
            BigDecimal paidAmount = amountPaid != null ? BigDecimal.valueOf(amountPaid) : BigDecimal.ZERO;
            // Long paidAtTimestamp = "success".equals(internalStatus) ? System.currentTimeMillis() : null;

            String transactionId = data.getId() != null ? data.getId() : String.valueOf(orderCode);
            return new QRStatusResponse(internalStatus, transactionId, paidAmount);
        } catch (Exception e) {
            log.error("PayOS kiểm tra trạng thái thất bại: paymentId={}, error={}", paymentId, e.getMessage());
            // Trả pending thay vì throw — FE sẽ poll lại
            return new QRStatusResponse("pending", null, BigDecimal.ZERO);
        }
    }

    /**
     * Huỷ payment link PayOS.
     * SDK gọi POST /v2/payment-requests/{orderCode}/cancel.
     */
    // @Override
    // public void cancelQRCode(UUID paymentId) throws Exception {
    //     long orderCode = Math.abs(paymentId.getMostSignificantBits() % 10_000_000_000L);
    //     if (orderCode == 0) orderCode = 1;
    //     try {
    //         // author: Hoàng | date: 27-04-2026 | note: Dùng resolvePayOS() để lấy credentials chi nhánh.
    //         resolvePayOS().paymentRequests().cancel(orderCode, "Cashier huỷ thanh toán");
    //         log.info("PayOS đã huỷ payment link: orderCode={}", orderCode);
    //     } catch (Exception e) {
    //         // Không throw — link có thể đã hết hạn hoặc đã được thanh toán
    //         log.warn("PayOS cancel thất bại (bỏ qua): orderCode={}, error={}", orderCode, e.getMessage());
    //     }
    // }
}
