package kr.hi.matey.dto;

import kr.hi.matey.util.TriggerType;
import lombok.Data;

@Data
public class CounselSummaryDTO {
	private int counselId; 
	private int chatRoomId;
	private int startMessageId; 
	private int endMessageId; 
	private String content;
	private TriggerType triggerType;
}
