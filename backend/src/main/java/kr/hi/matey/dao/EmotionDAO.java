package kr.hi.matey.dao;

import kr.hi.matey.dto.EmotionDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface EmotionDAO {
    List<EmotionDTO> selectEmotionHistory(long userId);
    void insertEmotionLog(EmotionDTO emotionDTO);
}