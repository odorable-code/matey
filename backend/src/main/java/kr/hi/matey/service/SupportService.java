package kr.hi.matey.service;


import kr.hi.matey.dao.SupportDAO;
import kr.hi.matey.dto.FaqDTO;
import kr.hi.matey.dto.SupportDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportDAO supportDAO;

    public List<SupportDTO> getSupportList(long userId) {
        return supportDAO.selectSupportList(userId);
    }

    @Transactional
    public void createSupportTicket(SupportDTO supportDTO) {
        // 새 문의 등록 시 초기 상태를 '접수됨'으로 고정
        supportDTO.setStatus("접수됨");
        supportDAO.insertSupportTicket(supportDTO);
    }

    public List<FaqDTO> getFaqList() {
        return supportDAO.selectFaqList();
    }
}