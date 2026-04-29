package kr.hi.matey.service;

import kr.hi.matey.dao.EmotionReportDAO;
import kr.hi.matey.dto.BotHistoryReportDTO;
import kr.hi.matey.dto.DailyReportDTO;
import kr.hi.matey.dto.EmotionReportDTO;
import kr.hi.matey.dto.EmotionReportResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmotionReportService {

    private final EmotionReportDAO emotionReportDAO;

    // --- Dashboard 통계용 (기존) ---
    public EmotionReportResponseDTO getEmotionReportData(Long userId) {
        EmotionReportResponseDTO response = new EmotionReportResponseDTO();
        
        // 1. 일간 감정 통계
        List<Map<String, Object>> dailyStats = emotionReportDAO.selectDailyEmotionStats(userId);
        Map<String, DailyReportDTO> dailyReports = new HashMap<>();
        
        for (Map<String, Object> stat : dailyStats) {
            String dateKey = (String) stat.get("dateKey");
            DailyReportDTO dto = new DailyReportDTO();
            dto.setDateKey(dateKey);
            dto.setDisplayDate((String) stat.get("displayDate"));
            
            Number count = (Number) stat.get("conversationCount");
            dto.setConversationCount(count != null ? count.intValue() : 0);
            
            String emotion = (String) stat.get("dominantEmotion");
            dto.setDominantEmotion(emotion != null ? emotion : "알 수 없음");
            
            String minTime = (String) stat.get("minTime");
            String maxTime = (String) stat.get("maxTime");
            String timeRange = "시간 정보 없음";
            if (minTime != null && maxTime != null) {
                if (minTime.equals(maxTime)) {
                    timeRange = minTime;
                } else {
                    timeRange = minTime + " ~ " + maxTime;
                }
            }
            dto.setActiveTimeRange(timeRange);
            
            dto.setSummaryTitle("분석 대기 중");
            dto.setMainConcern("AI 분석 대기 중");
            dto.setDominantTopics(new ArrayList<>());
            
            String recommendedAction = (String) stat.get("recommendedAction");
            if (recommendedAction != null && !recommendedAction.isEmpty()) {
                dto.setMemo(Arrays.asList(recommendedAction.split("\n")));
            } else {
                dto.setMemo(new ArrayList<>());
            }
            
            dto.setTimeline(new ArrayList<>());
            
            List<DailyReportDTO.ChatPreviewDTO> chatPreview = new ArrayList<>();
            List<Map<String, Object>> previewData = emotionReportDAO.selectChatPreviews(userId, dateKey);
            for (Map<String, Object> p : previewData) {
                DailyReportDTO.ChatPreviewDTO c = new DailyReportDTO.ChatPreviewDTO();
                c.setId(p.get("id").toString());
                c.setRole((String) p.get("role"));
                c.setName((String) p.get("name"));
                c.setTime((String) p.get("time"));
                c.setText("대화 내용 숨김 (보안)"); // MESSAGE 테이블에 실제 텍스트가 저장되지 않음
                chatPreview.add(c);
            }
            dto.setChatPreview(chatPreview);
            
            dailyReports.put(dateKey, dto);
        }
        
        // 2. 봇별 히스토리 통계
        List<Map<String, Object>> botStats = emotionReportDAO.selectBotHistoryStats(userId);
        Map<String, BotHistoryReportDTO> botHistoryReports = new HashMap<>();
        
        for (Map<String, Object> stat : botStats) {
            String botKey = ((String) stat.get("botKey")).toLowerCase();
            BotHistoryReportDTO dto = new BotHistoryReportDTO();
            dto.setToneLabel("기본 리포트");
            dto.setSummary("아직 충분한 대화 데이터가 쌓이지 않았어요.");
            dto.setFeedbackTitle("대화를 더 나누어보세요.");
            dto.setFeedbackBody("메이티와 더 많은 이야기를 나누면 맞춤형 피드백을 받을 수 있습니다.");
            dto.setActionTips(new ArrayList<>());
            dto.setMeters(new ArrayList<>());
            
            botHistoryReports.put(botKey, dto);
        }
        
        response.setDailyReports(dailyReports);
        response.setBotHistoryReports(botHistoryReports);
        
        return response;
    }

    // --- CRUD Operations ---
    
    public EmotionReportDTO createReport(EmotionReportDTO dto) {
        emotionReportDAO.insertEmotionReport(dto);
        return dto;
    }

    public List<EmotionReportDTO> getReportList(Long userId) {
        return emotionReportDAO.selectEmotionReportList(userId);
    }

    public EmotionReportDTO getReportDetail(Long analysisId) {
        return emotionReportDAO.selectEmotionReportById(analysisId);
    }

    public void updateReport(Long analysisId, EmotionReportDTO dto) {
        dto.setAnalysisId(analysisId);
        emotionReportDAO.updateEmotionReport(dto);
    }

    public void deleteReport(Long analysisId) {
        emotionReportDAO.deleteEmotionReport(analysisId);
    }
}
