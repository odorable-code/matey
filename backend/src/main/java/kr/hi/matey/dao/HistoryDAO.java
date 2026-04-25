package kr.hi.matey.dao;

import kr.hi.matey.dto.HistoryDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface HistoryDAO {
    List<HistoryDTO> selectHistoryList(long userId);
    HistoryDTO selectHistoryById(long id);
}