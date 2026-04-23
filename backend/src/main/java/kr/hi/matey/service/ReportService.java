package kr.hi.matey.service;

import org.springframework.stereotype.Service;

import kr.hi.matey.dao.ReportDAO;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {
	
	private final ReportDAO reportDAO;

}
