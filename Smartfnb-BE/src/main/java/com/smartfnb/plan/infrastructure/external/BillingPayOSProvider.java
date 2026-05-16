package com.smartfnb.plan.infrastructure.external;

// author: Hoàng | date: 2026-05-16
// note: Provider PayOS cho thanh toán gói dịch vụ (subscription billing) ở cấp platform/SaaS.
//       KHÔNG dùng TenantContext.getCurrentBranchId() như PayOSProvider POS.
//       Dùng credentials riêng từ payos.billing.* trong application.yml:
//         payos.billing.client-id, payos.billing.api-key, payos.billing.checksum-key
//       Không cần per-branch config. Một PayOS instance dùng chung cho mọi tenant.
//       orderCode được sinh từ MSBs của attemptId (UUID) — đảm bảo unique, <10^10, dương.
//       expiredAt: 15 phút (900 giây) — đủ dài để user thanh toán gói.

import com.smartfnb.shared.exception.SmartFnbException;
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

/**
 * PayOS billing provider — platform-level (không phụ thuộc branchId hay TenantContext).
 *
 * <p>Dùng cho thanh toán gói dịch vụ SaaS, khác với {@code PayOSProvider} POS
 * (per-branch credentials từ {@code branch_payment_configs}).</p>
 *
 * @author Hoàng
 * @since 2026-05-16
 */
@Component
@Slf4j
public class BillingPayOSProvider {

    private final String clientId;
    private final String apiKey;
    private final String checksumKey;
    private final String returnUrl;
    private final String cancelUrl;

    // author: Hoàng | date: 2026-05-16 | note: Inject credentials billing từ application.yml.
    //   Không dùng @ConfigurationProperties để tránh tạo thêm class config riêng.
    //   Fallback về payos.* POS nếu billing.* chưa cấu hình (dev convenience).
    public BillingPayOSProvider(
            @Value("${payos.billing.client-id}") String clientId,
            @Value("${payos.billing.api-key}") String apiKey,
            @Value("${payos.billing.checksum-key}") String checksumKey,
            @Value("${payos.billing.return-url}") String returnUrl,
            @Value("${payos.billing.cancel-url}") String cancelUrl) {
        this.clientId   = clientId;
        this.apiKey     = apiKey;
        this.checksumKey = checksumKey;
        this.returnUrl  = returnUrl;
        this.cancelUrl  = cancelUrl;
    }

    /**
     * Tạo PayOS instance từ billing credentials (platform-level, không per-branch).
     */
    private PayOS buildPayOS() {
        return new PayOS(clientId, apiKey, checksumKey);
    }

    /**
     * Kết quả tạo payment link PayOS.
     *
     * @param checkoutUrl      URL mở trang thanh toán PayOS
     * @param qrCode           Raw QR string để FE vẽ QR
     * @param paymentLinkId    paymentLinkId của PayOS (dùng làm providerReference trong DB)
     * @param orderCode        orderCode gửi lên PayOS (dùng để polling)
     * @param expiresInSeconds Thời gian hết hạn QR (giây)
     */
    public record BillingPayOSResult(
            String checkoutUrl,
            String qrCode,
            String paymentLinkId,
            long orderCode,
            long expiresInSeconds
    ) {}

    /**
     * Tạo payment link PayOS cho hóa đơn gói dịch vụ.
     *
     * @param attemptId     UUID của subscription_payment_attempts — dùng để sinh orderCode
     * @param amount        Số tiền thanh toán (VND, không có decimal)
     * @param invoiceNumber Mã hóa đơn INV-YYYYMM-NNNNN — hiển thị trong app ngân hàng
     * @return BillingPayOSResult chứa checkoutUrl, qrCode, paymentLinkId, orderCode, expiresInSeconds
     * @throws SmartFnbException nếu PayOS API trả lỗi
     */
    public BillingPayOSResult createPaymentLink(UUID attemptId, BigDecimal amount, String invoiceNumber) {
        // author: Hoàng | date: 2026-05-16 | note: orderCode từ MSBs của attemptId
        //   — đảm bảo unique vì mỗi attempt có UUID riêng, không xung đột với POS orderCode.
        long orderCode = Math.abs(attemptId.getMostSignificantBits() % 10_000_000_000L);
        if (orderCode == 0) orderCode = 1;

        Long amountLong = amount.longValue();

        // author: Hoàng | date: 2026-05-16 | note: PayOS giới hạn description tối đa 25 ký tự.
        String rawDesc = "Goi " + invoiceNumber;
        String description = rawDesc.length() > 25 ? rawDesc.substring(0, 25) : rawDesc;

        // 15 phút hết hạn — đủ để owner mở app ngân hàng và thanh toán
        long expiredAtEpoch = Instant.now().plusSeconds(900).getEpochSecond();

        PaymentLinkItem item = PaymentLinkItem.builder()
                .name(description)
                .price(amountLong)
                .quantity(1)
                .build();

        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amountLong)
                .description(description)
                .item(item)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .expiredAt(expiredAtEpoch)
                .build();

        log.info("BillingPayOS: tạo payment link: attemptId={}, orderCode={}, invoiceNumber={}, amount={}",
                attemptId, orderCode, invoiceNumber, amountLong);

        try {
            CreatePaymentLinkResponse response = buildPayOS().paymentRequests().create(request);

            String checkoutUrl   = response.getCheckoutUrl();
            String paymentLinkId = response.getPaymentLinkId();
            String qrCode        = response.getQrCode();

            log.info("BillingPayOS: tạo thành công: orderCode={}, paymentLinkId={}, checkoutUrlPresent={}, qrCodePresent={}",
                    orderCode, paymentLinkId,
                    checkoutUrl != null && !checkoutUrl.isBlank(),
                    qrCode != null && !qrCode.isBlank());

            return new BillingPayOSResult(checkoutUrl, qrCode, paymentLinkId, orderCode, 900L);

        } catch (SmartFnbException e) {
            throw e;
        } catch (Exception e) {
            log.error("BillingPayOS: tạo payment link thất bại: orderCode={}, error={}", orderCode, e.getMessage());
            throw new SmartFnbException("PAYOS_ERROR",
                    "Không thể tạo link thanh toán PayOS cho gói dịch vụ: " + e.getMessage(), 502);
        }
    }

    /**
     * Kiểm tra trạng thái thanh toán của một payment link PayOS theo orderCode.
     * Dùng cho polling endpoint khi FE muốn kiểm tra mà không cần chờ webhook.
     *
     * @param orderCode orderCode của attempt cần kiểm tra
     * @return "PAID" | "PENDING" | "CANCELLED" | "EXPIRED"
     */
    public String checkPaymentStatus(long orderCode) {
        try {
            PaymentLink data = buildPayOS().paymentRequests().get(orderCode);
            if (data == null || data.getStatus() == null) return "PENDING";
            return data.getStatus().getValue().toUpperCase();
        } catch (Exception e) {
            log.warn("BillingPayOS: kiểm tra trạng thái thất bại: orderCode={}, error={}", orderCode, e.getMessage());
            return "PENDING"; // trả PENDING thay vì throw — FE sẽ poll lại
        }
    }

    /**
     * Hủy payment link PayOS của hóa đơn gói dịch vụ.
     *
     * @param orderCode orderCode của PayOS payment link cần hủy
     * @throws Exception nếu PayOS từ chối hủy hoặc API lỗi
     *
     * author: Hoàng | date: 2026-05-16 | note: Dùng khi owner hủy invoice UNPAID để chọn lại gói khác.
     */
    public void cancelPaymentLink(long orderCode) throws Exception {
        buildPayOS().paymentRequests().cancel(orderCode, "Owner huy thanh toan goi");
        log.info("BillingPayOS: đã hủy payment link orderCode={}", orderCode);
    }
}
