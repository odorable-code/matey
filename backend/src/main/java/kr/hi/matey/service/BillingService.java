package kr.hi.matey.service;

import kr.hi.matey.dao.BillingMapper;
import kr.hi.matey.dto.BillingDTO;
import kr.hi.matey.dto.PaymentDTO;
import kr.hi.matey.dto.PointDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingMapper billingMapper;

    public BillingDTO getBillingSummary(String userId) {
        return billingMapper.selectBillingSummary(userId);
    }

    public List<PaymentDTO> getPaymentHistory(String userId) {
        return billingMapper.selectPaymentHistory(userId);
    }

    public List<PointDTO> getPointHistory(String userId) {
        return billingMapper.selectPointHistory(userId);
    }
}
