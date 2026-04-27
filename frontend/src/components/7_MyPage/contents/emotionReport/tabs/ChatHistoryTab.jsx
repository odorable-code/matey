import React, { useMemo } from 'react';
import styles from './ChatHistoryTab.module.css';
import BotReportCard from '../components/BotReportCard';

const cx = (...items) => items.filter(Boolean).join(' ');

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

const pad = (value) => String(value).padStart(2, '0');

const formatDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDisplayDate = (value) => {
  const date = toDate(value);
  if (!date) return '날짜를 선택해 주세요';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const buildMonthMatrix = (anchorDate) => {
  const date = toDate(anchorDate) || new Date();
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const mondayIndex = (firstDay.getDay() + 6) % 7;

  const cells = [];

  for (let i = 0; i < mondayIndex; i += 1) cells.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

const normalizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .map((item, index) => ({
      id: item?.id ?? `${index}-${item?.time ?? 'msg'}`,
      role: item?.role ?? item?.speaker ?? (index % 2 === 0 ? 'user' : 'bot'),
      text: item?.text ?? item?.message ?? item?.content ?? '',
      time: item?.time ?? item?.label ?? '',
    }))
    .filter((item) => item.text);
};

const buildFallbackEntries = () => {
  const today = new Date();

  return [
    {
      dateKey: formatDateKey(
        new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 1))
      ),
      memo:
        '오늘은 감정을 정리하려는 의지는 있었지만, 마음을 다그치는 표현이 중간중간 반복됐어요.',
      moodTags: ['불안', '자책', '정리'],
      keywords: ['관계', '정리', '마음 정돈'],
      messages: [
        { role: 'user', text: '요즘 계속 내가 부족한 것 같아.', time: '22:14' },
        { role: 'bot', text: '지금은 해결보다 먼저 숨을 고르는 게 필요해 보여.', time: '22:15' },
      ],
      botReport: {
        title: '오늘의 해석',
        summary:
          '불안이 먼저 올라온 뒤 자책으로 이어지는 흐름이 보여요. 판단보다 정돈이 필요한 날에 가까웠어요.',
        emotionMeter: [
          { label: '불안', value: 72 },
          { label: '자책', value: 56 },
          { label: '정리', value: 49 },
        ],
        actionTips: ['해야 할 일 1개만 남기기', '자기비판 문장 줄이기'],
      },
    },
  ];
};

const normalizeEntry = (entry) => ({
  dateKey:
    entry?.dateKey ??
    entry?.date ??
    entry?.createdAt ??
    formatDateKey(new Date()),
  memo:
    entry?.memo ??
    entry?.note ??
    entry?.summary ??
    '기록이 아직 충분하지 않아요.',
  moodTags: entry?.moodTags ?? entry?.emotionTags ?? entry?.tags ?? [],
  keywords: entry?.keywords ?? entry?.topicTags ?? [],
  messages: normalizeMessages(
    entry?.messages ?? entry?.conversation ?? entry?.chatPreview ?? []
  ),
  botReport: entry?.botReport ?? entry?.report ?? entry?.analysis ?? null,
});

function ChatHistoryTab({
  data,
  selectedDate,
  onDateChange,
  selectedBotKey,
  botOptions = [],
  reportData = {},
  historyOverview = {},
}) {
  const normalizedEntries = useMemo(() => {
    const rawEntries =
      data?.dailyReports ??
      data?.entries ??
      data?.historyEntries ??
      historyOverview?.dailyReports ??
      historyOverview?.entries ??
      [];

    const source =
      Array.isArray(rawEntries) && rawEntries.length > 0
        ? rawEntries
        : buildFallbackEntries();

    return source.map(normalizeEntry);
  }, [data, historyOverview]);

  const entryMap = useMemo(() => {
    return normalizedEntries.reduce((acc, item) => {
      acc[item.dateKey] = item;
      return acc;
    }, {});
  }, [normalizedEntries]);

  const latestEntry = normalizedEntries[0] ?? null;
  const selectedDateKey =
    selectedDate ??
    latestEntry?.dateKey ??
    formatDateKey(new Date());

  const selectedEntry =
    entryMap[selectedDateKey] ??
    latestEntry ??
    normalizeEntry({ dateKey: selectedDateKey });

  const selectedDateObject = toDate(selectedEntry?.dateKey) ?? new Date();
  const monthMatrix = useMemo(
    () => buildMonthMatrix(selectedDateObject),
    [selectedDateObject]
  );

  const previewMessages =
    Array.isArray(selectedEntry?.messages) && selectedEntry.messages.length > 0
      ? selectedEntry.messages.slice(0, 4)
      : [
          {
            id: 'empty',
            role: 'user',
            text: '기록된 대화가 아직 없어요.',
            time: '',
          },
        ];

  const botMeta = useMemo(() => {
    const merged = reportData?.heroBots ?? reportData?.bots ?? botOptions ?? [];
    return (
      merged.find(
        (item) =>
          item?.key === selectedBotKey ||
          item?.id === selectedBotKey ||
          item?.value === selectedBotKey
      ) ||
      merged[0] ||
      null
    );
  }, [reportData, botOptions, selectedBotKey]);

  const todayKey = formatDateKey(new Date());

  return (
    <div
      className={cx(styles.historyTab, styles.historyRoot)}
      style={{
        display: 'grid',
        gridTemplateColumns: '320px minmax(0, 1fr)',
        gap: 20,
      }}
    >
      <section
        className={styles.calendarPanel}
        style={{
          background: 'linear-gradient(180deg, #fffafc 0%, #fff4f8 100%)',
          border: '1px solid rgba(236, 200, 218, 0.72)',
          borderRadius: 26,
          padding: 20,
          boxShadow: '0 16px 34px rgba(221, 176, 196, 0.12)',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '7px 12px',
              borderRadius: 999,
              background: 'rgba(255, 225, 238, 0.9)',
              color: '#bf5b87',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            DAILY PLANNER
          </div>

          <h3
            style={{
              margin: 0,
              color: '#5f3450',
              fontSize: 24,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {selectedDateObject.getMonth() + 1}월 기록
          </h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {DAY_LABELS.map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#bf7f9f',
                padding: '6px 0',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {monthMatrix.map((week, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 8,
              }}
            >
              {week.map((date, dayIndex) => {
                if (!date) {
                  return <div key={`empty-${weekIndex}-${dayIndex}`} style={{ minHeight: 46 }} />;
                }

                const dateKey = formatDateKey(date);
                const active = dateKey === selectedDateKey;
                const hasRecord = !!entryMap[dateKey];
                const isToday = dateKey === todayKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => onDateChange?.(dateKey)}
                    style={{
                      minHeight: 50,
                      borderRadius: 16,
                      border: active
                        ? '1.5px solid rgba(218, 112, 160, 0.55)'
                        : '1px solid rgba(236, 209, 221, 0.85)',
                      background: active
                        ? 'linear-gradient(180deg, #ffe6f0 0%, #ffd8e8 100%)'
                        : hasRecord
                        ? 'linear-gradient(180deg, #fff8fb 0%, #fff1f7 100%)'
                        : 'rgba(255,255,255,0.82)',
                      boxShadow: active
                        ? '0 12px 24px rgba(226, 135, 176, 0.22)'
                        : 'none',
                      color: active ? '#9a3f69' : '#80566b',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <div>{date.getDate()}</div>
                    {hasRecord ? (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          margin: '4px auto 0',
                          background: active ? '#d85d95' : '#ef9cbd',
                        }}
                      />
                    ) : isToday ? (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 10,
                          color: '#c487a6',
                          fontWeight: 800,
                        }}
                      >
                        T
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section
        className={styles.historyDetailPanel}
        style={{
          display: 'grid',
          gap: 18,
          minWidth: 0,
        }}
      >
        <div
          style={{
            borderRadius: 28,
            padding: 22,
            background: 'linear-gradient(180deg, #fffdfd 0%, #fff6fa 100%)',
            border: '1px solid rgba(237, 204, 220, 0.76)',
            boxShadow: '0 16px 38px rgba(221, 176, 196, 0.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '7px 12px',
                  borderRadius: 999,
                  background: 'rgba(255, 225, 238, 0.9)',
                  color: '#bf5b87',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                }}
              >
                SELECTED DAY
              </div>

              <h3
                style={{
                  margin: 0,
                  fontSize: 28,
                  lineHeight: 1.12,
                  color: '#5f3450',
                  fontWeight: 800,
                }}
              >
                {formatDisplayDate(selectedEntry?.dateKey)}
              </h3>
            </div>

            {botMeta?.name ? (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.86)',
                  border: '1px solid rgba(237, 201, 217, 0.82)',
                  color: '#9a5576',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {botMeta.name} · {botMeta.tone || botMeta.role || '기록 파트너'}
              </div>
            ) : null}
          </div>

          <div
            style={{
              borderRadius: 22,
              padding: 18,
              background: 'rgba(255,255,255,0.78)',
              border: '1px solid rgba(239, 208, 223, 0.72)',
            }}
          >
            <strong
              style={{
                display: 'block',
                marginBottom: 10,
                color: '#6f4560',
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              하루 메모
            </strong>

            <p
              style={{
                margin: 0,
                color: '#7c5a6f',
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              {selectedEntry?.memo}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: 18,
          }}
        >
          <div
            style={{
              borderRadius: 26,
              padding: 20,
              background: 'linear-gradient(180deg, #ffffff 0%, #fff7fb 100%)',
              border: '1px solid rgba(236, 203, 220, 0.74)',
              boxShadow: '0 12px 30px rgba(221, 176, 196, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#bc6a90',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              CONVERSATION PREVIEW
            </div>

            <h4
              style={{
                margin: '0 0 14px',
                fontSize: 20,
                lineHeight: 1.2,
                color: '#61384f',
                fontWeight: 800,
              }}
            >
              대화 흐름 미리보기
            </h4>

            <div style={{ display: 'grid', gap: 12 }}>
              {previewMessages.map((message) => {
                const isBot = String(message.role).toLowerCase().includes('bot');

                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isBot ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '78%',
                        padding: '14px 16px',
                        borderRadius: isBot
                          ? '18px 18px 18px 8px'
                          : '18px 18px 8px 18px',
                        background: isBot
                          ? 'linear-gradient(180deg, #fff5f8 0%, #ffeef4 100%)'
                          : 'linear-gradient(180deg, #f6ecff 0%, #efe3ff 100%)',
                        border: isBot
                          ? '1px solid rgba(240, 207, 221, 0.78)'
                          : '1px solid rgba(223, 209, 255, 0.78)',
                        color: '#6a4758',
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    >
                      <div>{message.text}</div>
                      {message.time ? (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 11,
                            color: '#b08aa0',
                            fontWeight: 600,
                            textAlign: isBot ? 'left' : 'right',
                          }}
                        >
                          {message.time}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 16,
            }}
          >
            <div
              style={{
                borderRadius: 24,
                padding: 16,
                background: 'linear-gradient(180deg, #fffdfd 0%, #fff5f9 100%)',
                border: '1px solid rgba(237, 204, 220, 0.75)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#bc6a90',
                  marginBottom: 12,
                  letterSpacing: '0.08em',
                }}
              >
                BOT INTERPRETATION
              </div>

              {selectedEntry?.botReport ? (
                <BotReportCard report={selectedEntry.botReport} />
              ) : (
                <div
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    background: 'rgba(255,255,255,0.82)',
                    color: '#7e5c70',
                    fontSize: 14,
                    lineHeight: 1.75,
                  }}
                >
                  아직 봇 해석 데이터가 없어요.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ChatHistoryTab;
