package kr.hi.matey.service;

import kr.hi.matey.dao.BillingDAO;
import kr.hi.matey.dto.BillingDTO;
import kr.hi.matey.dto.PaymentDTO;
import kr.hi.matey.dto.PointDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingDAO billingDAO;

    public BillingDTO getBillingSummary(long userId) {
        return billingDAO.selectBillingSummary(userId);
    }

public List<PaymentDTO> getPaymentHistory(long userId) {
        return billingDAO.selectPaymentHistory(userId);
    }

    public List<PointDTO> getPointHistory(long userId) {
        return billingDAO.selectPointHistory(userId);
    }
}
