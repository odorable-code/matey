package kr.hi.matey.service;

import kr.hi.matey.dto.HistoryDTO;
import kr.hi.matey.dao.HistoryDAO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final HistoryDAO historyDAO;

    public List<HistoryDTO> getHistoryList(long userId) {
        List<HistoryDTO> list = historyDAO.selectHistoryList(userId);
        // DB의 콤마 구분 문자열을 List 구조로 변환
        list.forEach(this::processTags);
        return list;
    }

    public HistoryDTO getHistoryDetail(long historyId) {
        HistoryDTO item = historyDAO.selectHistoryById(historyId);
        if (item != null) {
            processTags(item);
        }
        return item;
    }

    // "스트레스, 수면, 관계" -> ["스트레스", "수면", "관계"] 형태로 파싱
    private void processTags(HistoryDTO dto) {
        if (dto.getTagsRaw() != null && !dto.getTagsRaw().isEmpty()) {
            List<String> parsedTags = Arrays.stream(dto.getTagsRaw().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            dto.setTags(parsedTags);
        }
    }
}