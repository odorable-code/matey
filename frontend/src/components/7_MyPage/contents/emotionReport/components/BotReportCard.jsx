import React from 'react';
import styles from '../tabs/ChatHistoryTab.module.css';

function BotReportCard({
  botName = '메이티',
  userName = '사용자',
  report = {},
  dominantTopics = [],
  mainConcern = '',
}) {
  const toneLabel = report?.toneLabel || '분석형';
  const summary =
    report?.summary ||
    '선택한 봇의 성격에 맞춰 대화 흐름과 주요 고민을 해석해 보여주는 영역이에요.';
  const feedbackTitle = report?.feedbackTitle || '피드백을 준비 중이에요.';
  const feedbackBody =
    report?.feedbackBody ||
    '대화 데이터가 더 연결되면 봇 성격에 맞는 맞춤 피드백을 이 영역에서 보여줄 수 있어요.';

  const actionTips = Array.isArray(report?.actionTips) ? report.actionTips : [];
  const meters = Array.isArray(report?.meters) ? report.meters : [];
  const topics = Array.isArray(dominantTopics) ? dominantTopics : [];
  const resolvedConcern =
    mainConcern || `${userName}의 주요 고민을 분석 중이에요.`;

  return (
    <article className={`${styles.panel} ${styles.botReportCard}`}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelEyebrow}>BOT REPORT</span>
          <h3 className={styles.panelTitle}>{botName} 리포트</h3>
        </div>
        <span className={styles.reportChip}>{toneLabel}</span>
      </div>

      <div className={styles.reportMeta}>
        <p className={styles.reportLead}>{summary}</p>

        <div className={styles.keywordBlock}>
          <span className={styles.keywordLabel}>자주 이야기한 주제</span>
          <div className={styles.chipRow}>
            {topics.length > 0 ? (
              topics.map((topic) => (
                <span key={topic} className={styles.topicChip}>
                  {topic}
                </span>
              ))
            ) : (
              <span className={styles.softChip}>주제 데이터 준비 중</span>
            )}
          </div>
        </div>

        <div className={styles.concernBox}>
          <span className={styles.concernLabel}>
            요즘 가장 이슈인 {userName}의 고민
          </span>
          <p className={styles.concernText}>{resolvedConcern}</p>
        </div>

        <div className={styles.feedbackBox}>
          <h4 className={styles.feedbackTitle}>{feedbackTitle}</h4>
          <p className={styles.feedbackBody}>{feedbackBody}</p>
        </div>
      </div>

      {meters.length > 0 ? (
        <div className={styles.meterSection}>
          {meters.map((meter) => {
            const safeValue = Math.max(
              0,
              Math.min(100, Number(meter?.value) || 0)
            );

            return (
              <div key={meter.label} className={styles.meterRow}>
                <span className={styles.meterLabel}>{meter.label}</span>
                <div className={styles.meterTrack}>
                  <div
                    className={styles.meterFill}
                    style={{ width: `${safeValue}%` }}
                  />
                </div>
                <span className={styles.meterValue}>{safeValue}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {actionTips.length > 0 ? (
        <div className={styles.tipList}>
          {actionTips.map((tip, index) => (
            <div key={`${tip}-${index}`} className={styles.tipItem}>
              <span className={styles.tipBullet}>{index + 1}</span>
              <span className={styles.tipText}>{tip}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default BotReportCard;
