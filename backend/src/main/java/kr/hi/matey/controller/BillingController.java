package kr.hi.matey.controller;

import kr.hi.matey.dto.BillingDTO;
import kr.hi.matey.dto.PaymentDTO;
import kr.hi.matey.dto.PointDTO;
import kr.hi.matey.service.BillingService;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mypage/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    // 1. 구독 요약 및 보유 포인트 조회
    @GetMapping
    public ResponseEntity<Map<String, Object>> getBillingInfo(
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();

        BillingDTO billing = billingService.getBillingSummary(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("billing", billing);

        return ResponseEntity.ok(response);
    }

    // 2. 결제 내역 조회
    @GetMapping("/payments")
    public ResponseEntity<Map<String, Object>> getPaymentHistory(
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();

        List<PaymentDTO> payments = billingService.getPaymentHistory(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("payments", payments);

        return ResponseEntity.ok(response);
    }

    // 3. 포인트 내역 조회
    @GetMapping("/points")
    public ResponseEntity<Map<String, Object>> getPointHistory(
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();

        List<PointDTO> pointHistory = billingService.getPointHistory(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("pointHistory", pointHistory);

        return ResponseEntity.ok(response);
    }
}