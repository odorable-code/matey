package kr.hi.matey.dao;


import kr.hi.matey.dto.BillingDTO;
import kr.hi.matey.dto.PaymentDTO;
import kr.hi.matey.dto.PointDTO;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface BillingDAO {
    BillingDTO selectBillingSummary(String userId);
    List<PaymentDTO> selectPaymentHistory(String userId);
    List<PointDTO> selectPointHistory(String userId);
}