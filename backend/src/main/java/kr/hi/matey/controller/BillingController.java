package kr.hi.matey.controller;

import kr.hi.matey.dto.BillingDTO;
import kr.hi.matey.dto.PaymentDTO;
import kr.hi.matey.dto.PointDTO;
import kr.hi.matey.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Map<String, Object>> getBillingInfo() {
        // TODO: SecurityContext에서 실제 로그인한 사용자 ID를 가져옵니다.
        String userId = "test_user_id";

        BillingDTO billing = billingService.getBillingSummary(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("billing", billing);

        return ResponseEntity.ok(response);
    }

    // 2. 결제 내역 조회
    @GetMapping("/payments")
    public ResponseEntity<Map<String, Object>> getPaymentHistory() {
        String userId = "test_user_id";

        List<PaymentDTO> payments = billingService.getPaymentHistory(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("payments", payments);

        return ResponseEntity.ok(response);
    }

    // 3. 포인트 내역 조회
    @GetMapping("/points")
    public ResponseEntity<Map<String, Object>> getPointHistory() {
        String userId = "test_user_id";

        List<PointDTO> pointHistory = billingService.getPointHistory(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("pointHistory", pointHistory);

        return ResponseEntity.ok(response);
    }
}