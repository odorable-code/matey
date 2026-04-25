package kr.hi.matey.dto;

import lombok.Data;

@Data
public class BillingDTO {
    private String subscriptionName;
    private int availablePoints;
    private int monthlyAmount;
    private String nextBillingDate;
    private String paymentMethod;
}