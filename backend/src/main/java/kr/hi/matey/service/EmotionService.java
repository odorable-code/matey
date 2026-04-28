package kr.hi.matey.service;


import kr.hi.matey.dao.EmotionDAO;
import kr.hi.matey.dto.EmotionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmotionService {

    private final EmotionDAO emotionDAO;

    public List<EmotionDTO> getEmotionHistory(long userId) {
        return emotionDAO.selectEmotionHistory(userId);
    }

    @Transactional
    public void addEmotionLog(EmotionDTO emotionDTO) {
        emotionDAO.insertEmotionLog(emotionDTO);
    }
}