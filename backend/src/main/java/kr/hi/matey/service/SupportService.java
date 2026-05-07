package kr.hi.matey.service;


import kr.hi.matey.dao.SupportDAO;
import kr.hi.matey.dto.FaqDTO;
import kr.hi.matey.dto.SupportReasonDTO;
import kr.hi.matey.dto.SupportDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportDAO supportDAO;

    private static final Pattern REPORT_META_PATTERN =
            Pattern.compile("^\\[REPORT\\s+(POST|COMMENT)\\s+(\\d+)\\]");

    public List<SupportDTO> getSupportList(long userId) {
        return supportDAO.selectSupportList(userId);
    }

    @Transactional
    public void deleteOwnSupportTicket(long userId, long supportId) {
        supportDAO.deleteAnswersForOwnedSupport(supportId, userId);
        int deleted = supportDAO.deleteSupportIfOwner(supportId, userId);
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "문의를 찾을 수 없어요.");
        }
    }

    @Transactional
    public void createSupportTicket(SupportDTO supportDTO) {
        // 새 문의 등록 시 초기 상태를 DB 기준 'PENDING'으로 고정
        supportDTO.setStatus("PENDING");

        // 신고(POST/COMMENT) 유형은 동일 대상 중복 접수를 막습니다.
        Long reasonId = supportDTO.getSupportReasonId();
        if (reasonId != null) {
            SupportReasonDTO reason = supportDAO.selectSupportReasonById(reasonId);
            String tt = reason != null ? String.valueOf(reason.getTargetType()) : "";
            boolean isReport = "POST".equalsIgnoreCase(tt) || "COMMENT".equalsIgnoreCase(tt);
            if (isReport) {
                Matcher m = REPORT_META_PATTERN.matcher(String.valueOf(supportDTO.getTitle()));
                if (m.find()) {
                    String targetType = m.group(1);
                    Long targetId = Long.valueOf(m.group(2));
                    int exists = supportDAO.countExistingReportForTarget(
                            supportDTO.getUserId(),
                            targetType,
                            targetId
                    );
                    if (exists > 0) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "이미 신고한 내용이에요."
                        );
                    }
                }
            }
        }
        supportDAO.insertSupportTicket(supportDTO);
    }

    public List<FaqDTO> getFaqList() {
        return supportDAO.selectFaqList();
    }

    public List<SupportReasonDTO> getSupportReasons() {
        return supportDAO.selectSupportReasons();
    }

    @Transactional
    public void createFaq(FaqDTO faqDTO) {
        supportDAO.insertFaq(faqDTO);
    }

    @Transactional
    public void updateFaq(FaqDTO faqDTO) {
        supportDAO.updateFaq(faqDTO);
    }

    public FaqDTO getFaqById(Long faqId) {
        return supportDAO.selectFaqById(faqId);
    }
}