/**
 * =========================================================
 * 파일명 : src/components/8_AdminPage/AdminPage.jsx
 * 역할   : 메이티 관리자 페이지 (DB 스키마 기반 v3.2)
 * =========================================================
 *
 * [이번 수정 핵심]
 * - 히어로 하단 hero-actions (실시간 지표 새로고침/사용자 관리/문의·신고 처리) 제거
 * - 히어로 아래 독립 탭바(tabbar) 제거
 * - 탭 버튼 5개를 히어로 hero-copy 하단에 hero-tabs로 통합 배치
 * - 중복 버튼 완전 제거
 *
 * [DB 매핑]
 * - 사용자  : USER + USER_ROLE + ROLE
 *   role_code = 'ADMIN' / 'SUBADMIN' / 'USER'
 *   status    = 'ACTIVE' / 'BANNED' / 'DELETED'
 * - 문의/신고: SUPPORT + SUPPORT_REASON + SUPPORT_ANSWER
 *   reason_type = 'REPORT' / 'INQUIRY'
 *   status      = 'PENDING' / 'DONE'
 * - 상담봇  : BOT + BOT_POPULARITY_STAT
 * - 감정    : EMOTION_SCORE + EMOTION_CATEGORY
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) ROLE_LABELS / STATUS_* : 라벨 표시 코드
 * 2) handleUser*            : 사용자 권한/상태 변경 로직
 * 3) handleSupport*         : 문의/신고 처리 로직
 * =========================================================
 */

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI, getStoredToken } from '../../utils/api';
import { displaySupportTicketTitle } from '../../utils/supportReportDisplay';
import './AdminPage.css';

/* =========================================================
   상수 / 라벨 매핑 코드
========================================================= */
const ADMIN_LOG_STORAGE_KEY = 'matey_admin_activity_logs_v4';
const VALID_ADMIN_TABS = new Set(['overview', 'users', 'supports', 'bots', 'logs']);

const ROLE_LABELS = {
  ADMIN: '총 관리자',
  SUBADMIN: '서브 관리자',
  USER: '일반 사용자',
};

function formatRoleLabelForTable(roleCode) {
  const r = String(roleCode || '').toUpperCase();
  if (r === 'SUPER_ADMIN') return ROLE_LABELS.ADMIN;
  return ROLE_LABELS[r] || r || '—';
}

/** 목록 · 상세 패널 관리 열 라벨 (일반 사용자만 상세, 그 외 관리) */
function manageButtonLabelForRole(roleCode) {
  const r = String(roleCode || '').toUpperCase();
  const bucket = r === 'SUPER_ADMIN' ? 'ADMIN' : r;
  return bucket === 'USER' ? '상세' : '관리';
}

const LOGIN_TYPE_LABELS = {
  LOCAL: '이메일',
  KAKAO: '카카오',
  NAVER: '네이버',
  GOOGLE: '구글',
};

function formatLoginTypeLabel(loginType) {
  const k = String(loginType || 'LOCAL').toUpperCase();
  return LOGIN_TYPE_LABELS[k] || k || '—';
}

const USER_STATUS_LABELS = {
  ACTIVE: '활성',
  BANNED: '정지',
  DELETED: '탈퇴',
};

const SUPPORT_STATUS_LABELS = {
  PENDING: '대기',
  DONE: '완료',
};

const SUPPORT_STATUS_PILL_CLASS = {
  PENDING: 'is-pending',
  DONE: 'is-resolved',
};

const REASON_TYPE_LABELS = {
  REPORT: '신고',
  INQUIRY: '문의',
};

/** API(camelCase) → 화면에서 쓰는 snake_case 사용자 행 */
function normalizeAdminUser(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.userId ?? raw.user_id;
  if (id == null) return null;
  return {
    user_id: id,
    email: raw.email ?? '',
    nickname: raw.nickname ?? '',
    user_name: raw.userName ?? raw.user_name ?? '',
    gender: raw.gender ?? '',
    login_type: raw.loginType ?? raw.login_type ?? 'LOCAL',
    status: raw.status ?? 'ACTIVE',
    last_login_at: raw.lastLoginAt ?? raw.last_login_at ?? null,
    created_at: raw.createdAt ?? raw.created_at ?? null,
    role_code: raw.roleCode ?? raw.role_code ?? raw.roleName ?? 'USER',
    chat_count: raw.conversationCount ?? raw.chat_count ?? 0,
    report_count: raw.reportCount ?? raw.report_count ?? 0,
    support_count: raw.supportCount ?? raw.support_count ?? 0,
    assigned_bot_name: raw.assignedBotName ?? raw.assigned_bot_name ?? '',
  };
}

/** API(camelCase) → 문의·신고 목록용 snake_case */
function normalizeAdminFeedback(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const sid = raw.supportId ?? raw.support_id;
  if (sid == null) return null;
  const rt = String(raw.reasonType ?? raw.reason_type ?? 'INQUIRY').toUpperCase();
  return {
    support_id: sid,
    support_reason_id: raw.supportReasonId ?? raw.support_reason_id ?? null,
    reason_type: rt === 'REPORT' ? 'REPORT' : 'INQUIRY',
    target_type: raw.targetType ?? raw.target_type ?? null,
    reason_name: raw.reasonName ?? raw.reason_name ?? '',
    user_id: raw.userId ?? raw.user_id,
    user_nickname: raw.userNickname ?? raw.user_nickname ?? '',
    title: raw.title ?? '',
    content: raw.content ?? '',
    status: raw.status ?? 'PENDING',
    created_at: raw.createdAt ?? raw.created_at ?? '',
  };
}

/** /api/admin/stats/emotions 등 응답을 막대 그래프용 형태로 */
function normalizeEmotionStat(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.emotion_code != null && raw.count != null) {
    return {
      emotion_code: raw.emotion_code,
      emotion_name: raw.emotion_name ?? raw.emotion_code,
      count: Number(raw.count) || 0,
      color: raw.color ?? 'blue',
    };
  }
  if (raw.label != null) {
    const label = String(raw.label);
    return {
      emotion_code: label.replace(/\s+/g, '_').toUpperCase(),
      emotion_name: label,
      count: Number(raw.value) || 0,
      color: 'blue',
    };
  }
  return null;
}

/* =========================================================
   유틸리티 코드
========================================================= */
function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function isAdminLike(roleCode) {
  const code = String(roleCode || '').toUpperCase();
  return code === 'ADMIN' || code === 'SUBADMIN' || code === 'SUPER_ADMIN';
}

function isSuperAdmin(roleCode) {
  const code = String(roleCode || '').toUpperCase();
  return code === 'ADMIN' || code === 'SUPER_ADMIN';
}

/** 총관리자 등급 — UI/API에서 타 계정에 부여 불가 */
function isTopAdminRole(roleCode) {
  const code = String(roleCode || '').toUpperCase();
  return code === 'ADMIN' || code === 'SUPER_ADMIN';
}

function getUserRoleCode(targetUser) {
  const raw =
    targetUser?.role_code ||
    targetUser?.role ||
    targetUser?.roles?.[0]?.role_code ||
    targetUser?.roles?.[0] ||
    'USER';
  let code = String(raw).trim().toUpperCase();
  if (code.startsWith('ROLE_')) {
    code = code.slice(5);
  }
  return code || 'USER';
}

/** 관리자 API 응답 실패 시 사용자에게 보여 줄 메시지 */
function formatAdminApiFailure(err) {
  const st = err?.status;
  if (st === 401) {
    return '로그인이 만료되었거나 인증 토큰이 유효하지 않아요. 다시 로그인한 뒤 새로고침해 주세요.';
  }
  if (st === 403) {
    return '관리자 API 접근이 거부되었어요. 백엔드 서버와 역할(ADMIN 등)을 확인해 주세요.';
  }
  return err?.message || '관리자 데이터 요청에 실패했어요.';
}

function formatDate(dateLike) {
  if (!dateLike) return '-';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(dateLike) {
  if (!dateLike) return '-';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 상세 패널 닫은 뒤 목록에서 해당 카드(또는 목록 상단)로 스크롤 */
function scrollSupportCardIntoView(supportId) {
  if (supportId == null) return;
  const key = String(supportId);
  const run = () => {
    const el = document.querySelector(`[data-matey-support-card="${key}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    document
      .querySelector('.matey-admin-v3__support-grid')
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

function isReactSyntheticEvent(value) {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof value.preventDefault === 'function' &&
    typeof value.stopPropagation === 'function'
  );
}

function getSupportAnswerTextFromDetail(detail) {
  if (!detail) return '';
  return String(detail.answerContent ?? detail.answer_content ?? '').trim();
}

function nowTimeLabel(offsetMinutes = 0) {
  const date = new Date(Date.now() + offsetMinutes * 60000);
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${hh}:${mm}`;
}

function createInitialRealtimeSeries(count = 12) {
  const total = Number.isFinite(Number(count)) ? Math.max(1, Number(count)) : 12;
  const start = -5 * (total - 1);
  return Array.from({ length: total }, (_, idx) => {
    const label = nowTimeLabel(start + idx * 5);
    return { label, value: 0 };
  });
}

/* =========================================================
   활동 로그 저장 코드 (localStorage)
========================================================= */
function loadLogs() {
  try {
    const raw = window.localStorage.getItem(ADMIN_LOG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveLogs(logs) {
  try {
    window.localStorage.setItem(ADMIN_LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    /* noop */
  }
}

/* =========================================================
   라인 차트 패스 빌더 코드
========================================================= */
function buildLineGeometry(series, width = 620, height = 220, paddingX = 18, paddingY = 18) {
  if (!Array.isArray(series) || series.length === 0) {
    return { linePath: '', areaPath: '', points: [] };
  }

  const values = series.map((item) => item.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = series.map((item, index) => {
    const x =
      paddingX +
      (series.length === 1 ? chartWidth / 2 : (chartWidth / (series.length - 1)) * index);
    const y = paddingY + chartHeight - ((item.value - min) / range) * chartHeight;

    return { x, y, value: item.value, label: item.label };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    height - paddingY
  } L ${points[0].x} ${height - paddingY} Z`;

  return { linePath, areaPath, points };
}

/* =========================================================
   메인 컴포넌트
========================================================= */
export default function AdminPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, authLoading } = useAuth();

  /* =========================================================
     탭 상태: URL ?tab= 만 사용 (다른 페이지에서 /admin 진입 시 항상 개요부터)
     새로고침 시에도 같은 탭 유지하려면 주소에 ?tab= 이 남아 있어야 함
  ========================================================= */
  const activeTab = useMemo(() => {
    const t = searchParams.get('tab');
    if (t && VALID_ADMIN_TABS.has(t)) return t;
    return 'overview';
  }, [searchParams]);

  const setActiveTab = useCallback(
    (key) => {
      if (!VALID_ADMIN_TABS.has(key)) return;
      if (key === 'overview') {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ tab: key }, { replace: true });
      }
    },
    [setSearchParams]
  );

  /* =========================================================
     데이터 상태
  ========================================================= */
  const [users, setUsers] = useState([]);
  const [supports, setSupports] = useState([]);
  const [bots, setBots] = useState([]);
  const [emotionStats, setEmotionStats] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dbOverview, setDbOverview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** 일부 API만 실패했을 때(데이터는 일부 표시) 상단 안내 */
  const [loadWarning, setLoadWarning] = useState(null);

  /* =========================================================
     실시간 차트 데이터
  ========================================================= */
  const [liveUserSeries, setLiveUserSeries] = useState(() => createInitialRealtimeSeries(12));
  const [liveChatSeries, setLiveChatSeries] = useState(() => createInitialRealtimeSeries(12));

  /* =========================================================
     사용자 관리 필터
  ========================================================= */
  const [userKeyword, setUserKeyword] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userManageId, setUserManageId] = useState(null);
  const [userManageLoading, setUserManageLoading] = useState(false);
  const [userManageFetchError, setUserManageFetchError] = useState('');
  const [userDrawerRoleDraft, setUserDrawerRoleDraft] = useState('USER');
  const [userDrawerStatusDraft, setUserDrawerStatusDraft] = useState('ACTIVE');
  const [userDrawerSaving, setUserDrawerSaving] = useState(false);
  const userDrawerTitleId = useId();
  const userDrawerRoleFieldId = useId();
  const userDrawerStatusFieldId = useId();

  /* =========================================================
     문의/신고 필터
  ========================================================= */
  const [supportTypeFilter, setSupportTypeFilter] = useState('INQUIRY');
  const [supportStatusFilter, setSupportStatusFilter] = useState('ALL');
  const [selectedSupportId, setSelectedSupportId] = useState(null);

  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportDetail, setSupportDetail] = useState(null);
  const [supportDetailLoading, setSupportDetailLoading] = useState(false);
  const [supportDetailError, setSupportDetailError] = useState('');
  const [supportAnswerDraft, setSupportAnswerDraft] = useState('');
  const [supportAnswerSaving, setSupportAnswerSaving] = useState(false);
  const [supportAnswerDoneOpen, setSupportAnswerDoneOpen] = useState(false);
  /** 답변 확인 모달 문구: 기존 답변 수정 vs 신규 등록 */
  const [supportAnswerDoneWasEdit, setSupportAnswerDoneWasEdit] = useState(false);
  const supportAnswerDoneTitleId = useId();

  /* =========================================================
     활동 로그 필터
  ========================================================= */
  const [logKeyword, setLogKeyword] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState('ALL');

  /* =========================================================
     현재 로그인한 관리자 정보
  ========================================================= */
  const adminName = useMemo(() => {
    return (
      user?.nickname ||
      user?.user_name ||
      user?.name ||
      user?.email?.split('@')?.[0] ||
      '관리자'
    );
  }, [user]);

  const adminRole = useMemo(() => getUserRoleCode(user), [user]);
  const currentAdminIsSuper = useMemo(() => isSuperAdmin(adminRole), [adminRole]);

  /* =========================================================
     활동 로그 push
  ========================================================= */
  const pushAdminLog = useCallback(
    (category, action, target, detail, tags = []) => {
      const nextItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        actor: adminName,
        actor_role: ROLE_LABELS[adminRole] || '관리자',
        category,
        action,
        target,
        detail,
        tags,
        created_at: new Date().toISOString(),
      };

      setLogs((prev) => {
        const next = [nextItem, ...prev].slice(0, 120);
        saveLogs(next);
        return next;
      });
    },
    [adminName, adminRole]
  );

  /* =========================================================
     초기 데이터 로드
  ========================================================= */
  useEffect(() => {
    async function fetchAdminData() {
      try {
        setLoading(true);
        setError(null);
        setLoadWarning(null);

        const rawToken = getStoredToken();
        if (String(rawToken || '').startsWith('mock-token-')) {
          setError(
            '프런트 테스트(mock) 로그인은 실제 백엔드 JWT가 아니라 관리자 API가 모두 실패해요. 팀과 같은 DB·서버에 붙이려면 일반 로그인으로 발급된 토큰을 쓰는지 확인해 주세요.'
          );
          return;
        }

        const settled = await Promise.allSettled([
          adminAPI.getUsers(),
          adminAPI.getFeedbacks({ status: 'ALL' }),
          adminAPI.getDashboardOverview(),
        ]);

        const failed = settled
          .map((r, idx) => (r.status === 'rejected' ? { idx, reason: r.reason } : null))
          .filter(Boolean);

        const usersData = settled[0].status === 'fulfilled' ? settled[0].value : [];
        const feedbacksData = settled[1].status === 'fulfilled' ? settled[1].value : [];
        const dashboardData = settled[2].status === 'fulfilled' ? settled[2].value : {};

        const usersArr = Array.isArray(usersData) ? usersData : [];
        const feedbacksArr = Array.isArray(feedbacksData) ? feedbacksData : [];

        setUsers(usersArr.map(normalizeAdminUser).filter(Boolean));
        setSupports(feedbacksArr.map(normalizeAdminFeedback).filter(Boolean));

        if (dashboardData.overview) {
          setDbOverview(dashboardData.overview);
        }

        if (dashboardData.liveMetrics) {
          setLiveChatSeries(
            dashboardData.liveMetrics.map((m) => ({
              label: m.label,
              value: Number(m.value) || 0,
            }))
          );
          setLiveUserSeries(
            dashboardData.liveMetrics.map((m) => ({
              label: m.label,
              value: Math.floor((Number(m.value) || 0) * 1.5),
            }))
          );
        }

        if (dashboardData.emotionDistribution) {
          setEmotionStats(
            dashboardData.emotionDistribution.map(normalizeEmotionStat).filter(Boolean)
          );
        }

        setBots([]);
        setLogs(loadLogs());

        if (failed.length > 0) {
          const hint = formatAdminApiFailure(failed[0].reason);
          if (failed.length >= 3) {
            setError(hint);
          } else {
            setLoadWarning(
              failed.length === 1
                ? hint
                : `일부 데이터만 불러왔어요. (${failed.length}건 요청 실패) ${hint}`
            );
          }
        }
      } catch (err) {
        console.error('관리자 데이터 로드 실패:', err);
        setError(err?.message || '데이터를 불러오지 못했어요.');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated && !authLoading) {
      fetchAdminData();
    }
  }, [isAuthenticated, authLoading]);

  /* =========================================================
     실시간 차트 데이터 새로고침
  ========================================================= */
  const handleRefreshRealtime = async () => {
    try {
      const dashboardData = await adminAPI.getDashboardOverview();
      if (dashboardData.liveMetrics) {
        setLiveChatSeries(dashboardData.liveMetrics.map(m => ({
          label: m.label,
          value: Number(m.value) || 0
        })));
        setLiveUserSeries(dashboardData.liveMetrics.map(m => ({
          label: m.label,
          value: Math.floor((Number(m.value) || 0) * 1.5)
        })));
      }
      if (dashboardData.overview) {
        setDbOverview(dashboardData.overview);
      }
      
      pushAdminLog(
        '대시보드',
        '실시간 지표 새로고침',
        '운영 대시보드',
        'DB 데이터를 기반으로 활성 사용자 / 채팅 세션 지표를 새로고침했습니다.',
        ['실시간 통계']
      );
    } catch (err) {
      console.error('실시간 지표 갱신 실패:', err);
    }
  };

  /* =========================================================
     실시간 차트 자동 갱신 (30초마다 DB 재조회)
  ========================================================= */
  useEffect(() => {
    const interval = window.setInterval(() => {
      handleRefreshRealtime();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  /* =========================================================
     운영 통계 요약 (DB 컬럼 기반)
  ========================================================= */
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
    const bannedUsers = users.filter((u) => u.status === 'BANNED').length;
    const deletedUsers = users.filter((u) => u.status === 'DELETED').length;

    const adminCount = users.filter((u) => getUserRoleCode(u) === 'ADMIN').length;
    const subAdminCount = users.filter((u) => getUserRoleCode(u) === 'SUBADMIN').length;

    const pendingSupports = supports.filter((s) => s.status === 'PENDING').length;
    const reportCount = supports.filter((s) => s.reason_type === 'REPORT').length;
    const inquiryCount = supports.filter((s) => s.reason_type === 'INQUIRY').length;

    const totalLikes = bots.reduce((sum, b) => sum + (b.like_count || 0), 0);
    const totalDislikes = bots.reduce((sum, b) => sum + (b.dislike_count || 0), 0);

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      deletedUsers,
      adminCount,
      subAdminCount,
      pendingSupports,
      reportCount,
      inquiryCount,
      totalLikes,
      totalDislikes,
    };
  }, [users, supports, bots]);

  const summaryStats = useMemo(() => {
    const o = dbOverview && typeof dbOverview === 'object' ? dbOverview : {};

    const pick = (...keys) => {
      for (const k of keys) {
        if (o?.[k] != null) return o[k];
      }
      return undefined;
    };

    return {
      totalUsers: pick('totalUsers', 'userCount', 'total_users') ?? stats.totalUsers,
      activeUsers: pick('activeUsers', 'activeUserCount', 'active_users') ?? stats.activeUsers,
      bannedUsers: pick('bannedUsers', 'bannedUserCount', 'banned_users') ?? stats.bannedUsers,
      deletedUsers: pick('deletedUsers', 'deletedUserCount', 'deleted_users') ?? stats.deletedUsers,

      pendingSupports:
        pick('pendingSupports', 'pendingSupportCount', 'pending_supports') ?? stats.pendingSupports,
      reportCount: pick('reportCount', 'report_count', 'reports') ?? stats.reportCount,
      inquiryCount: pick('inquiryCount', 'inquiry_count', 'inquiries') ?? stats.inquiryCount,

      adminCount: pick('adminCount', 'admin_count') ?? stats.adminCount,
      subAdminCount: pick('subAdminCount', 'sub_admin_count') ?? stats.subAdminCount,

      totalLikes: pick('totalLikes', 'total_likes') ?? stats.totalLikes,
      totalDislikes: pick('totalDislikes', 'total_dislikes') ?? stats.totalDislikes,
    };
  }, [dbOverview, stats]);

  const userDirectoryMetrics = useMemo(
    () => ({
      total: summaryStats.totalUsers,
      active: summaryStats.activeUsers,
      banned: summaryStats.bannedUsers,
      staff: users.filter((u) => isAdminLike(getUserRoleCode(u))).length,
    }),
    [users, summaryStats]
  );

  /* =========================================================
     필터링된 사용자
  ========================================================= */
  const filteredUsers = useMemo(() => {
    const keyword = normalizeText(userKeyword);

    return users.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.email, item.nickname, item.user_name]
          .map(normalizeText)
          .some((value) => value.includes(keyword));

      const role = getUserRoleCode(item);
      const matchesRole = userRoleFilter === 'ALL' || role === userRoleFilter;
      const matchesStatus = userStatusFilter === 'ALL' || item.status === userStatusFilter;

      return matchesKeyword && matchesRole && matchesStatus;
    });
  }, [users, userKeyword, userRoleFilter, userStatusFilter]);

  const userManageRow = useMemo(() => {
    if (userManageId == null) return null;
    return users.find((u) => u.user_id === userManageId) || null;
  }, [users, userManageId]);

  /* =========================================================
     필터링된 문의/신고
  ========================================================= */
  const filteredSupports = useMemo(() => {
    return supports.filter((item) => {
      const matchesType =
        supportTypeFilter === 'ALL' || item.reason_type === supportTypeFilter;
      const matchesStatus =
        supportStatusFilter === 'ALL' || item.status === supportStatusFilter;

      return matchesType && matchesStatus;
    });
  }, [supports, supportTypeFilter, supportStatusFilter]);

  const selectedSupport = useMemo(() => {
    return (
      filteredSupports.find((item) => item.support_id === selectedSupportId) ||
      filteredSupports[0] ||
      null
    );
  }, [filteredSupports, selectedSupportId]);

  useEffect(() => {
    if (filteredSupports.length === 0) {
      setSelectedSupportId(null);
      return;
    }
    if (!filteredSupports.some((item) => item.support_id === selectedSupportId)) {
      setSelectedSupportId(filteredSupports[0].support_id);
    }
  }, [filteredSupports, selectedSupportId]);

  const supportDetailIsReport = useMemo(
    () => String(supportDetail?.reasonType || '').toUpperCase() === 'REPORT',
    [supportDetail?.reasonType]
  );

  const supportHasExistingAnswer = useMemo(
    () => Boolean(getSupportAnswerTextFromDetail(supportDetail)),
    [supportDetail]
  );

  const openSupportModal = useCallback((supportId) => {
    setSelectedSupportId(supportId);
    setSupportModalOpen(true);
  }, []);

  const closeSupportModal = useCallback(
    (arg) => {
      const opts = isReactSyntheticEvent(arg) ? {} : arg || {};
      const scrollToId =
        opts.scrollToSupportId != null ? opts.scrollToSupportId : selectedSupportId;

      setSupportModalOpen(false);
      setSupportDetail(null);
      setSupportDetailError('');
      setSupportDetailLoading(false);
      setSupportAnswerDraft('');
      setSupportAnswerSaving(false);

      if (opts.scroll === false) return;
      if (scrollToId != null) {
        scrollSupportCardIntoView(scrollToId);
      }
    },
    [selectedSupportId]
  );

  useEffect(() => {
    if (!supportModalOpen || selectedSupportId == null) return undefined;

    let cancelled = false;
    async function loadDetail() {
      try {
        setSupportDetailLoading(true);
        setSupportDetailError('');
        const detail = await adminAPI.getFeedbackDetail(selectedSupportId);
        if (cancelled) return;
        setSupportDetail(detail || null);
        setSupportAnswerDraft(String(detail?.answerContent || '').trim());
      } catch (e) {
        if (cancelled) return;
        setSupportDetail(null);
        setSupportDetailError(e?.message || '상세 정보를 불러오지 못했어요.');
      } finally {
        if (!cancelled) setSupportDetailLoading(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [supportModalOpen, selectedSupportId]);

  const handleSupportAnswerSave = useCallback(async () => {
    if (!selectedSupportId) {
      window.alert('먼저 문의/신고 항목을 선택해 주세요.');
      return;
    }
    const content = String(supportAnswerDraft || '').trim();
    if (!content) {
      window.alert('답변 내용을 입력해 주세요.');
      return;
    }

    try {
      setSupportAnswerSaving(true);
      const ticketId = selectedSupportId;
      const wasEdit = Boolean(getSupportAnswerTextFromDetail(supportDetail));

      await adminAPI.answerFeedback(ticketId, content);

      setSupports((prev) =>
        prev.map((s) =>
          s.support_id === ticketId ? { ...s, status: 'DONE' } : s
        )
      );

      pushAdminLog(
        '문의·신고 관리',
        wasEdit ? '답변 수정' : '답변 등록',
        `티켓 #${ticketId}`,
        wasEdit
          ? '관리자 답변을 수정했습니다.'
          : '관리자 답변을 등록했습니다.'
      );

      setSupportAnswerDoneWasEdit(wasEdit);
      closeSupportModal({ scrollToSupportId: ticketId });
      setSupportAnswerDoneOpen(true);
    } catch (e) {
      const wasEdit = Boolean(getSupportAnswerTextFromDetail(supportDetail));
      window.alert(
        e?.message ||
          (wasEdit ? '답변 수정에 실패했어요.' : '답변 등록에 실패했어요.')
      );
    } finally {
      setSupportAnswerSaving(false);
    }
  }, [
    selectedSupportId,
    supportAnswerDraft,
    supportDetail,
    pushAdminLog,
    closeSupportModal,
  ]);

  /* =========================================================
     필터링된 활동 로그
  ========================================================= */
  const filteredLogs = useMemo(() => {
    const keyword = normalizeText(logKeyword);

    return logs.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.actor, item.action, item.target, item.detail, ...(item.tags || [])]
          .map(normalizeText)
          .some((value) => value.includes(keyword));

      const matchesCategory =
        logCategoryFilter === 'ALL' || item.category === logCategoryFilter;

      return matchesKeyword && matchesCategory;
    });
  }, [logs, logKeyword, logCategoryFilter]);

  /* =========================================================
     일괄/단일 사용자 권한 변경 가능 여부
  ========================================================= */
  const canManageRole = useCallback(
    (target) => {
      const isSelf =
        normalizeText(target?.email) === normalizeText(user?.email);
      return currentAdminIsSuper && !isSelf;
    },
    [currentAdminIsSuper, user]
  );

  const canManageStatus = useCallback(
    (target) => {
      const isSelf =
        normalizeText(target?.email) === normalizeText(user?.email);
      if (isSelf) return false;

      if (currentAdminIsSuper) return true;
      return getUserRoleCode(target) === 'USER';
    },
    [currentAdminIsSuper, user]
  );

  useEffect(() => {
    if (userManageId != null && !users.some((u) => u.user_id === userManageId)) {
      setUserManageId(null);
    }
  }, [users, userManageId]);

  useEffect(() => {
    if (userManageId == null) {
      setUserManageFetchError('');
      return undefined;
    }

    let cancelled = false;
    setUserManageLoading(true);
    setUserManageFetchError('');

    adminAPI
      .getUser(userManageId)
      .then((raw) => {
        if (cancelled) return;
        const u = normalizeAdminUser(raw);
        if (!u) return;
        setUsers((prev) =>
          prev.some((x) => x.user_id === u.user_id)
            ? prev.map((x) => (x.user_id === u.user_id ? { ...x, ...u } : x))
            : [...prev, u]
        );
      })
      .catch((err) => {
        if (!cancelled) setUserManageFetchError(formatAdminApiFailure(err));
      })
      .finally(() => {
        if (!cancelled) setUserManageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userManageId]);

  useEffect(() => {
    if (userManageId == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setUserManageId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [userManageId]);

  const userManageRowSignature = userManageRow
    ? `${userManageRow.user_id}:${userManageRow.role_code}:${userManageRow.status}`
    : '';

  useEffect(() => {
    if (userManageId == null || !userManageRow) return;
    setUserDrawerRoleDraft(getUserRoleCode(userManageRow));
    setUserDrawerStatusDraft(String(userManageRow.status || 'ACTIVE').toUpperCase());
  }, [userManageId, userManageRowSignature]);

  const userDrawerRoleEditable =
    Boolean(userManageRow) && currentAdminIsSuper && canManageRole(userManageRow);
  const userDrawerStatusEditable =
    Boolean(userManageRow) && canManageStatus(userManageRow);
  const userDrawerHasPendingChanges =
    Boolean(userManageRow) &&
    ((userDrawerRoleEditable &&
      userDrawerRoleDraft !== getUserRoleCode(userManageRow)) ||
      (userDrawerStatusEditable &&
        userDrawerStatusDraft !== String(userManageRow.status || '').toUpperCase()));

  const handleUserDrawerCancel = () => {
    if (!userManageRow || userManageLoading) return;
    setUserDrawerRoleDraft(getUserRoleCode(userManageRow));
    setUserDrawerStatusDraft(String(userManageRow.status || 'ACTIVE').toUpperCase());
  };

  const handleUserDrawerSave = async () => {
    if (!userManageRow || !userDrawerHasPendingChanges || userDrawerSaving) return;

    const uid = userManageRow.user_id;
    const curRole = getUserRoleCode(userManageRow);
    const curStatus = String(userManageRow.status || 'ACTIVE').toUpperCase();
    const nextRole = userDrawerRoleDraft;
    const nextStatus = userDrawerStatusDraft;

    if (
      userDrawerRoleEditable &&
      nextRole !== curRole &&
      isTopAdminRole(nextRole) &&
      !isTopAdminRole(curRole)
    ) {
      window.alert('총관리자 권한은 다른 계정에 부여할 수 없습니다.');
      return;
    }

    const lines = [];
    if (userDrawerRoleEditable && nextRole !== curRole) {
      lines.push(
        `${formatRoleLabelForTable(curRole)}의 권한을 ${formatRoleLabelForTable(nextRole)}(으)로 변경하시겠습니까?`
      );
    }
    if (userDrawerStatusEditable && nextStatus !== curStatus) {
      lines.push(
        `상태를 ${USER_STATUS_LABELS[curStatus] || curStatus}에서 ${USER_STATUS_LABELS[nextStatus] || nextStatus}(으)로 변경하시겠습니까?`
      );
    }
    if (lines.length === 0) return;

    const emailLine = userManageRow.email?.trim() || '등록된 이메일 없음';
    const msg = `${lines.join('\n\n')}\n\n계정: ${emailLine}\n\n저장하면 바로 반영돼요.`;
    if (!window.confirm(msg)) return;

    setUserDrawerSaving(true);
    try {
      if (userDrawerRoleEditable && nextRole !== curRole) {
        await adminAPI.updateUserRole(uid, nextRole);
        setUsers((prev) =>
          prev.map((u) => (u.user_id === uid ? { ...u, role_code: nextRole } : u))
        );
        pushAdminLog(
          '권한 관리',
          '사용자 권한 변경',
          userManageRow.nickname,
          `${userManageRow.nickname} 사용자의 권한을 ${formatRoleLabelForTable(nextRole)}(으)로 변경했습니다.`,
          ['권한 변경', nextRole]
        );
      }

      if (userDrawerStatusEditable && nextStatus !== curStatus) {
        await adminAPI.updateUser(uid, { status: nextStatus });
        setUsers((prev) =>
          prev.map((u) => (u.user_id === uid ? { ...u, status: nextStatus } : u))
        );
        pushAdminLog(
          '사용자 관리',
          '사용자 상태 변경',
          userManageRow.nickname,
          `${userManageRow.nickname} 사용자의 상태를 ${USER_STATUS_LABELS[nextStatus]}(으)로 변경했습니다.`,
          ['상태 변경', nextStatus]
        );
      }
    } catch (err) {
      console.error(err);
      window.alert(formatAdminApiFailure(err) || '저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setUserDrawerSaving(false);
    }
  };

  /* =========================================================
     문의/신고 상태 변경
  ========================================================= */
  const handleSupportStatusChange = async (supportId, nextStatus) => {
    const target = supports.find((s) => s.support_id === supportId);
    if (!target || target.status === nextStatus) return;

    try {
      await adminAPI.updateFeedbackStatus(supportId, nextStatus);
      setSupports((prev) =>
        prev.map((s) =>
          s.support_id === supportId ? { ...s, status: nextStatus } : s
        )
      );
      setSupportDetail((prev) =>
        prev && selectedSupportId === supportId
          ? { ...prev, status: nextStatus }
          : prev
      );

      pushAdminLog(
        '문의·신고 관리',
        `${REASON_TYPE_LABELS[target.reason_type]} 상태 변경`,
        `티켓 #${supportId}`,
        `"${target.title}" 티켓 상태를 ${SUPPORT_STATUS_LABELS[nextStatus]}(으)로 변경했습니다.`,
        [REASON_TYPE_LABELS[target.reason_type], nextStatus]
      );
    } catch (err) {
      window.alert(err?.message || '상태 변경에 실패했어요.');
    }
  };

  /* =========================================================
     활동 로그 전체 삭제
  ========================================================= */
  const handleClearLogs = () => {
    if (logs.length === 0) return;
    setLogs([]);
    saveLogs([]);
  };

  /* =========================================================
     라인 차트 패스
  ========================================================= */
  const userLine = useMemo(() => buildLineGeometry(liveUserSeries), [liveUserSeries]);
  const chatLine = useMemo(() => buildLineGeometry(liveChatSeries), [liveChatSeries]);

  /* =========================================================
     인증 / 권한 가드
  ========================================================= */
  if (authLoading || loading) {
    return (
      <div className="matey-admin-v3 matey-admin-v3--state">
        <div className="matey-admin-v3__state-card">
          <div className="matey-admin-v3__spinner" />
          <h2>운영 데이터를 불러오고 있어요</h2>
          <p>관리자 권한과 운영 통계를 확인하는 중입니다. 잠시만 기다려 주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="matey-admin-v3 matey-admin-v3--state">
        <div className="matey-admin-v3__state-card">
          <h2>데이터 로드 오류</h2>
          <p>서버 연결에 문제가 발생했어요: {error}</p>
          <p>잠시 후 다시 시도하거나 새로고침해 주세요.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search || ''}` }}
      />
    );
  }

  if (!isAdminLike(adminRole)) {
    return (
      <div className="matey-admin-v3 matey-admin-v3--state">
        <div className="matey-admin-v3__state-card">
          <h2>접근 권한이 없어요</h2>
          <p>
            이 페이지는 관리자 전용 운영 대시보드입니다.
            <br />
            일반 사용자는 마이페이지에서 개인 정보와 상담 이력을 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     렌더 데이터 정리
  ========================================================= */
  const userLast = liveUserSeries[liveUserSeries.length - 1]?.value ?? 0;
  const chatLast = liveChatSeries[liveChatSeries.length - 1]?.value ?? 0;
  const userFirst = liveUserSeries[0]?.value ?? 0;
  const chatFirst = liveChatSeries[0]?.value ?? 0;
  const userDelta = userLast - userFirst;
  const chatDelta = chatLast - chatFirst;

  const todayLogCount = logs.filter((item) => {
    const t = new Date(item.created_at).getTime();
    return Date.now() - t <= 1000 * 60 * 60 * 24;
  }).length;

  const maxEmotionCount = emotionStats.reduce(
    (max, item) => Math.max(max, item.count || 0),
    1
  );

  return (
    <div className="matey-admin-v3">
      {supportAnswerDoneOpen ? (
        <div
          className="matey-admin-v3__modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSupportAnswerDoneOpen(false);
          }}
        >
          <div
            className="matey-admin-v3__modal matey-admin-v3__modal--confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby={supportAnswerDoneTitleId}
          >
            <h2 id={supportAnswerDoneTitleId} className="matey-admin-v3__modal-title">
              {supportAnswerDoneWasEdit ? '답변 수정 완료' : '답변 등록 완료'}
            </h2>
            <p className="matey-admin-v3__panel-sub" style={{ margin: '0 0 22px', textAlign: 'center' }}>
              {supportAnswerDoneWasEdit
                ? '답변이 수정되었어요. 이용자에게 알림이 전달됩니다.'
                : '답변이 등록되었어요. 이용자에게 알림이 전달됩니다.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="matey-admin-v3__primary-button"
                style={{ minWidth: 120 }}
                onClick={() => setSupportAnswerDoneOpen(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {loadWarning ? (
        <div
          className="matey-admin-v3__state-card"
          style={{
            margin: '16px 24px 0',
            border: '1px solid rgba(234, 179, 8, 0.5)',
            background: 'rgba(234, 179, 8, 0.08)',
          }}
          role="status"
        >
          <p style={{ margin: 0, fontWeight: 600 }}>일부 데이터를 불러오지 못했어요</p>
          <p style={{ margin: '8px 0 0', opacity: 0.9 }}>{loadWarning}</p>
        </div>
      ) : null}
      {/* =========================================================
          히어로 섹션
      ========================================================= */}
      <section className="matey-admin-v3__hero">
        <div className="matey-admin-v3__hero-copy">
          <span className="matey-admin-v3__eyebrow">MATEY ADMIN CONSOLE</span>
          <h1>
            메이티 운영을
            <br />한 눈에 관리해요 🐾
          </h1>
          <p>
            사용자 권한, 문의 및 신고, 상담봇 인기 지표, 감정 분포까지 메이티가 운영되는 모든
            흐름을 한 화면에서 확인할 수 있어요.
          </p>

          {/* 탭 버튼을 히어로 내부에 배치 */}
          <div className="matey-admin-v3__hero-tabs">
            {[
              { key: 'overview', label: '개요' },
              { key: 'users', label: '사용자 관리' },
              { key: 'supports', label: '문의·신고 관리' },
              { key: 'bots', label: '상담봇 관리' },
              { key: 'logs', label: '활동 로그' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`matey-admin-v3__tab-btn ${
                  activeTab === tab.key ? 'is-active' : ''
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 가로 3열 컴팩트 메트릭 */}
        <div className="matey-admin-v3__hero-side">
          <div className="matey-admin-v3__hero-metric accent-violet">
            <span>현재 접속 관리자</span>
            <strong>{adminName}</strong>
            <small>
              {ROLE_LABELS[adminRole] || '관리자'} · 오늘 로그 {todayLogCount}건
            </small>
          </div>

          <div className="matey-admin-v3__hero-metric accent-blue">
            <span>실시간 활성 사용자</span>
            <strong>{userLast}</strong>
            <small>
              직전 대비 {userDelta >= 0 ? '+' : ''}
              {userDelta}명
            </small>
          </div>

          <div className="matey-admin-v3__hero-metric accent-mint">
            <span>실시간 채팅 세션</span>
            <strong>{chatLast}</strong>
            <small>
              직전 대비 {chatDelta >= 0 ? '+' : ''}
              {chatDelta}건
            </small>
          </div>
        </div>
      </section>

      {/* =========================================================
          요약 카드
      ========================================================= */}
      <section className="matey-admin-v3__summary-grid">
        <article className="matey-admin-v3__summary-card accent-violet">
          <span>전체 사용자</span>
          <strong>{summaryStats.totalUsers}</strong>
          <p>전체 계정 수</p>
        </article>

        <article className="matey-admin-v3__summary-card accent-blue">
          <span>활성 사용자</span>
          <strong>{summaryStats.activeUsers}</strong>
          <p>
            정지 {summaryStats.bannedUsers}명 · 탈퇴 {summaryStats.deletedUsers}명
          </p>
        </article>

        <article className="matey-admin-v3__summary-card accent-orange">
          <span>대기 중 문의·신고</span>
          <strong>{summaryStats.pendingSupports}</strong>
          <p>
            신고 {summaryStats.reportCount}건 · 문의 {summaryStats.inquiryCount}건
          </p>
        </article>

        <article className="matey-admin-v3__summary-card accent-mint">
          <span>관리자 권한 계정</span>
          <strong>{summaryStats.adminCount + summaryStats.subAdminCount}</strong>
          <p>
            총 {summaryStats.adminCount}명 · 서브 {summaryStats.subAdminCount}명
          </p>
        </article>
      </section>

      {/* =========================================================
          본문 (탭별 컨텐츠)
      ========================================================= */}
      <div className="matey-admin-v3__content">
        {/* ----------------- 개요 탭 ----------------- */}
        {activeTab === 'overview' && (
          <div className="matey-admin-v3__section-stack">
            <section className="matey-admin-v3__panel">
              <div className="matey-admin-v3__panel-head">
                <div>
                  <span className="matey-admin-v3__section-kicker">REALTIME</span>
                  <h2>실시간 운영 통계</h2>
                  <p className="matey-admin-v3__panel-sub">
                    최근 활동량을 실시간으로 보여줘요.
                  </p>
                </div>

                <button
                  type="button"
                  className="matey-admin-v3__ghost-button"
                  onClick={handleRefreshRealtime}
                >
                  실시간 지표 새로고침
                </button>
              </div>

              <div className="matey-admin-v3__chart-grid">
                <article className="matey-admin-v3__chart-card">
                  <div className="matey-admin-v3__chart-head">
                    <div>
                      <h3>활성 사용자 추이</h3>
                      <p>최근 구간별 동시 접속 사용자</p>
                    </div>
                    <strong>{userLast}</strong>
                  </div>

                  <div className="matey-admin-v3__line-chart">
                    <svg
                      className="matey-admin-v3__line-svg"
                      viewBox="0 0 620 220"
                      preserveAspectRatio="none"
                    >
                      <path className="matey-admin-v3__line-area" d={userLine.areaPath} />
                      <path className="matey-admin-v3__line-stroke" d={userLine.linePath} />
                      {userLine.points.map((p, i) => (
                        <circle
                          key={`u-${i}`}
                          cx={p.x}
                          cy={p.y}
                          r="4.5"
                          className="matey-admin-v3__line-dot"
                        />
                      ))}
                    </svg>
                  </div>

                  <div className="matey-admin-v3__chart-labels">
                    {liveUserSeries.map((it, i) => (
                      <span key={`ul-${i}`}>{it.label}</span>
                    ))}
                  </div>
                </article>

                <article className="matey-admin-v3__chart-card">
                  <div className="matey-admin-v3__chart-head">
                    <div>
                      <h3>채팅 세션 추이</h3>
                      <p>활성 세션 수</p>
                    </div>
                    <strong>{chatLast}</strong>
                  </div>

                  <div className="matey-admin-v3__line-chart">
                    <svg
                      className="matey-admin-v3__line-svg"
                      viewBox="0 0 620 220"
                      preserveAspectRatio="none"
                    >
                      <path
                        className="matey-admin-v3__line-area matey-admin-v3__line-area--blue"
                        d={chatLine.areaPath}
                      />
                      <path
                        className="matey-admin-v3__line-stroke matey-admin-v3__line-stroke--blue"
                        d={chatLine.linePath}
                      />
                      {chatLine.points.map((p, i) => (
                        <circle
                          key={`c-${i}`}
                          cx={p.x}
                          cy={p.y}
                          r="4.5"
                          className="matey-admin-v3__line-dot matey-admin-v3__line-dot--blue"
                        />
                      ))}
                    </svg>
                  </div>

                  <div className="matey-admin-v3__chart-labels">
                    {liveChatSeries.map((it, i) => (
                      <span key={`cl-${i}`}>{it.label}</span>
                    ))}
                  </div>
                </article>

                <article className="matey-admin-v3__chart-card">
                  <div className="matey-admin-v3__chart-head">
                    <div>
                      <h3>주요 감정 분포</h3>
                      <p>누적 집계</p>
                    </div>
                    <strong>{maxEmotionCount}</strong>
                  </div>

                  <div className="matey-admin-v3__bar-list">
                    {emotionStats.map((item) => (
                      <div className="matey-admin-v3__bar-row" key={item.emotion_code}>
                        <div className="matey-admin-v3__bar-meta">
                          <span>{item.emotion_name}</span>
                          <strong>{item.count}건</strong>
                        </div>
                        <div className="matey-admin-v3__bar-track">
                          <div
                            className={`matey-admin-v3__bar-fill ${item.color || 'violet'}`}
                            style={{
                              width: `${Math.round(
                                (item.count / maxEmotionCount) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="matey-admin-v3__chart-card">
                  <div className="matey-admin-v3__chart-head">
                    <div>
                      <h3>상담봇 인기 순위</h3>
                    </div>
                    <strong>{bots.length}</strong>
                  </div>

                  <div className="matey-admin-v3__bot-rank-list">
                    {bots
                      .slice()
                      .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
                      .map((bot, idx) => (
                        <div className="matey-admin-v3__bot-rank-row" key={bot.bot_id}>
                          <span className={`matey-admin-v3__bot-rank-badge rank-${idx + 1}`}>
                            {idx + 1}
                          </span>
                          <div className="matey-admin-v3__bot-rank-meta">
                            <strong>{bot.name}</strong>
                            <small>👍 {bot.like_count} · 👎 {bot.dislike_count}</small>
                          </div>
                          <span className="matey-admin-v3__bot-rank-score">
                            {bot.popularity_score?.toFixed(1)}점
                          </span>
                        </div>
                      ))}
                  </div>
                </article>
              </div>
            </section>

            <section className="matey-admin-v3__panel">
              <div className="matey-admin-v3__panel-head">
                <div>
                  <span className="matey-admin-v3__section-kicker">INSIGHT</span>
                  <h2>운영 인사이트</h2>
                  <p className="matey-admin-v3__panel-sub">
                    DB 기반 핵심 운영 지표를 빠르게 점검할 수 있어요.
                  </p>
                </div>
              </div>

              <div className="matey-admin-v3__split-grid">
                <div className="matey-admin-v3__notice">
                  <strong>권한 분포 요약</strong>
                  <div className="matey-admin-v3__divider" />
                  <div className="matey-admin-v3__stat-inline">
                    <span className="matey-admin-v3__stat-chip">
                      <span className="matey-admin-v3__stat-dot is-violet" />총 관리자{' '}
                      {stats.adminCount}명
                    </span>
                    <span className="matey-admin-v3__stat-chip">
                      <span className="matey-admin-v3__stat-dot is-blue" />서브 관리자{' '}
                      {stats.subAdminCount}명
                    </span>
                    <span className="matey-admin-v3__stat-chip">
                      <span className="matey-admin-v3__stat-dot is-mint" />활성 사용자{' '}
                      {stats.activeUsers}명
                    </span>
                    <span className="matey-admin-v3__stat-chip">
                      <span className="matey-admin-v3__stat-dot is-pink" />정지 {stats.bannedUsers}
                      명
                    </span>
                  </div>
                </div>

                <div className="matey-admin-v3__notice">
                  <strong>최근 처리 현황</strong>
                  <div className="matey-admin-v3__divider" />
                  <p className="matey-admin-v3__muted">
                    대기 중 문의·신고 <strong>{stats.pendingSupports}건</strong>, 그 중 신고{' '}
                    <strong>{stats.reportCount}건</strong>, 일반 문의{' '}
                    <strong>{stats.inquiryCount}건</strong>이 누적되어 있어요.
                  </p>
                  <div className="matey-admin-v3__divider" />
                  <p className="matey-admin-v3__muted">
                    상담봇 누적 좋아요 <strong>{stats.totalLikes}</strong>, 싫어요{' '}
                    <strong>{stats.totalDislikes}</strong>로 사용자 만족도가 비교적 높게 유지되고
                    있어요.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ----------------- 사용자 관리 탭 ----------------- */}
        {activeTab === 'users' && (
          <>
            <section className="matey-admin-v3__panel matey-admin-v3__panel--users-wide matey-admin-v3__panel--users-dense">
              <div className="matey-admin-v3__panel-head matey-admin-v3__panel-head--users">
                <div>
                  <p className="matey-admin-v3__panel-breadcrumb">관리자 / 사용자</p>
                  <h2>사용자 관리</h2>
                  <p className="matey-admin-v3__panel-sub">
                    목록에서 계정을 조회한 뒤, 상세·관리 화면에서 권한과 상태를 수정할 수 있어요.
                  </p>
                </div>
              </div>

              <div
                className="matey-admin-v3__user-summary-strip"
                role="region"
                aria-label="사용자 요약 지표"
              >
                <div className="matey-admin-v3__user-summary-card">
                  <span className="matey-admin-v3__user-summary-value">
                    {Number(userDirectoryMetrics.total).toLocaleString('ko-KR')}
                  </span>
                  <span className="matey-admin-v3__user-summary-label">전체 사용자</span>
                </div>
                <div className="matey-admin-v3__user-summary-card">
                  <span className="matey-admin-v3__user-summary-value">
                    {Number(userDirectoryMetrics.active).toLocaleString('ko-KR')}
                  </span>
                  <span className="matey-admin-v3__user-summary-label">활성</span>
                </div>
                <div className="matey-admin-v3__user-summary-card">
                  <span className="matey-admin-v3__user-summary-value">
                    {Number(userDirectoryMetrics.banned).toLocaleString('ko-KR')}
                  </span>
                  <span className="matey-admin-v3__user-summary-label">정지</span>
                </div>
                <div className="matey-admin-v3__user-summary-card">
                  <span className="matey-admin-v3__user-summary-value">
                    {Number(userDirectoryMetrics.staff).toLocaleString('ko-KR')}
                  </span>
                  <span className="matey-admin-v3__user-summary-label">운영 권한</span>
                </div>
              </div>

              <div className="matey-admin-v3__toolbar matey-admin-v3__toolbar--users matey-admin-v3__toolbar--users-inline">
                <div className="matey-admin-v3__search-wrap">
                  <input
                    type="text"
                    value={userKeyword}
                    onChange={(e) => setUserKeyword(e.target.value)}
                    placeholder="이메일·닉네임 검색"
                  />
                </div>
                <select
                  id="admin-users-filter-role"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  aria-label="권한 필터"
                >
                  <option value="ALL">전체 권한</option>
                  <option value="ADMIN">총 관리자</option>
                  <option value="SUBADMIN">서브 관리자</option>
                  <option value="USER">일반 사용자</option>
                </select>
                <select
                  id="admin-users-filter-status"
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  aria-label="상태 필터"
                >
                  <option value="ALL">전체 상태</option>
                  <option value="ACTIVE">활성</option>
                  <option value="BANNED">정지</option>
                  <option value="DELETED">탈퇴</option>
                </select>
              </div>

              <div className="matey-admin-v3__table-wrap matey-admin-v3__table-wrap--users-fit">
                <table className="matey-admin-v3__table matey-admin-v3__table--users-compact matey-admin-v3__table--users-list-only">
                  <thead>
                    <tr>
                      <th className="matey-admin-v3__th-user">사용자</th>
                      <th className="matey-admin-v3__th-role">권한</th>
                      <th className="matey-admin-v3__th-status">상태</th>
                      <th className="matey-admin-v3__th-manage">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((item) => {
                      const role = getUserRoleCode(item);
                      const manageLabel = manageButtonLabelForRole(role);

                      return (
                        <tr key={item.user_id}>
                          <td className="matey-admin-v3__td-user">
                            <div className="matey-admin-v3__user-cell matey-admin-v3__user-cell--compact">
                              <span className="matey-admin-v3__user-avatar matey-admin-v3__user-avatar--sm">
                                {String(item.nickname || '?').charAt(0)}
                              </span>
                              <div className="matey-admin-v3__user-cell-text">
                                <strong>{item.nickname}</strong>
                                <small title={item.email}>{item.email}</small>
                              </div>
                            </div>
                          </td>

                          <td className="matey-admin-v3__td-role">
                            <span className="matey-admin-v3__role-plain">
                              {formatRoleLabelForTable(role)}
                            </span>
                          </td>

                          <td className="matey-admin-v3__td-status">
                            <span
                              className={`matey-admin-v3__user-status-pill matey-admin-v3__user-status-pill--${String(
                                item.status || 'ACTIVE'
                              ).toLowerCase()}`}
                            >
                              {USER_STATUS_LABELS[item.status] || item.status || '—'}
                            </span>
                          </td>

                          <td className="matey-admin-v3__td-manage">
                            <button
                              type="button"
                              className={
                                manageLabel === '상세'
                                  ? 'matey-admin-v3__user-manage-btn matey-admin-v3__user-manage-btn--detail'
                                  : 'matey-admin-v3__user-manage-btn matey-admin-v3__user-manage-btn--manage'
                              }
                              onClick={() => setUserManageId(item.user_id)}
                            >
                              {manageLabel}
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          <div className="matey-admin-v3__empty">
                            조건에 맞는 사용자가 없어요. 검색어 또는 필터를 조정해 주세요.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {userManageId != null && userManageRow && (
              <div
                className="matey-admin-v3__drawer-overlay"
                role="presentation"
                onClick={() => setUserManageId(null)}
              >
                <aside
                  className="matey-admin-v3__user-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={userDrawerTitleId}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="matey-admin-v3__user-drawer-head">
                    <div>
                      <p className="matey-admin-v3__user-drawer-eyebrow">
                        {manageButtonLabelForRole(getUserRoleCode(userManageRow)) === '상세'
                          ? '사용자 상세'
                          : '계정 관리'}
                      </p>
                      <h3 className="matey-admin-v3__user-drawer-title" id={userDrawerTitleId}>
                        {userManageRow.nickname || '이름 없음'}
                      </h3>
                      <p className="matey-admin-v3__user-drawer-email">{userManageRow.email}</p>
                    </div>
                    <button
                      type="button"
                      className="matey-admin-v3__modal-close"
                      onClick={() => setUserManageId(null)}
                      aria-label="닫기"
                    >
                      ×
                    </button>
                  </div>

                  {userManageLoading && (
                    <p className="matey-admin-v3__user-drawer-banner">최신 정보를 불러오는 중…</p>
                  )}
                  {userManageFetchError && (
                    <p className="matey-admin-v3__user-drawer-banner matey-admin-v3__user-drawer-banner--warn">
                      {userManageFetchError}
                    </p>
                  )}

                  <div className="matey-admin-v3__user-drawer-section">
                    <h4 className="matey-admin-v3__user-drawer-section-title">계정 정보</h4>
                    <dl className="matey-admin-v3__user-drawer-dl">
                      <div>
                        <dt>이메일</dt>
                        <dd>{userManageRow.email || '—'}</dd>
                      </div>
                      <div>
                        <dt>가입일</dt>
                        <dd>{formatDateTime(userManageRow.created_at)}</dd>
                      </div>
                      <div>
                        <dt>최근 로그인</dt>
                        <dd>{formatDateTime(userManageRow.last_login_at)}</dd>
                      </div>
                      <div>
                        <dt>로그인 유형</dt>
                        <dd>{formatLoginTypeLabel(userManageRow.login_type)}</dd>
                      </div>
                      <div>
                        <dt>담당 상담봇</dt>
                        <dd>{userManageRow.assigned_bot_name || '—'}</dd>
                      </div>
                      <div>
                        <dt>상담(대화) 건수</dt>
                        <dd>{userManageRow.chat_count ?? 0}</dd>
                      </div>
                      <div>
                        <dt>신고 접수</dt>
                        <dd>{userManageRow.report_count ?? 0}</dd>
                      </div>
                      <div>
                        <dt>문의·신고 접수</dt>
                        <dd>{userManageRow.support_count ?? 0}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="matey-admin-v3__user-drawer-section">
                    <h4 className="matey-admin-v3__user-drawer-section-title">권한·상태</h4>
                    <div className="matey-admin-v3__user-drawer-controls">
                      <div className="matey-admin-v3__user-drawer-field">
                        <label htmlFor={userDrawerRoleFieldId}>권한</label>
                        {userDrawerRoleEditable ? (
                          <select
                            id={userDrawerRoleFieldId}
                            className="matey-admin-v3__row-select"
                            value={userDrawerRoleDraft}
                            onChange={(e) => setUserDrawerRoleDraft(e.target.value)}
                            aria-label="권한 변경"
                            disabled={userDrawerSaving}
                          >
                            {(getUserRoleCode(userManageRow) === 'ADMIN' ||
                              getUserRoleCode(userManageRow) === 'SUPER_ADMIN') && (
                              <option value={getUserRoleCode(userManageRow)}>
                                {ROLE_LABELS.ADMIN}
                              </option>
                            )}
                            <option value="SUBADMIN">{ROLE_LABELS.SUBADMIN}</option>
                            <option value="USER">{ROLE_LABELS.USER}</option>
                          </select>
                        ) : (
                          <p className="matey-admin-v3__user-drawer-readonly">
                            {formatRoleLabelForTable(getUserRoleCode(userManageRow))}
                          </p>
                        )}
                      </div>

                      <div className="matey-admin-v3__user-drawer-field">
                        <label htmlFor={userDrawerStatusFieldId}>상태</label>
                        {userDrawerStatusEditable ? (
                          <select
                            id={userDrawerStatusFieldId}
                            className="matey-admin-v3__row-select"
                            value={userDrawerStatusDraft}
                            onChange={(e) => setUserDrawerStatusDraft(e.target.value)}
                            aria-label="상태 변경"
                            disabled={userDrawerSaving}
                          >
                            <option value="ACTIVE">{USER_STATUS_LABELS.ACTIVE}</option>
                            <option value="BANNED">{USER_STATUS_LABELS.BANNED}</option>
                            <option value="DELETED">{USER_STATUS_LABELS.DELETED}</option>
                          </select>
                        ) : (
                          <p className="matey-admin-v3__user-drawer-readonly">
                            {USER_STATUS_LABELS[userManageRow.status] || userManageRow.status}
                          </p>
                        )}
                      </div>

                      {(userDrawerRoleEditable || userDrawerStatusEditable) && (
                        <div className="matey-admin-v3__user-drawer-actions">
                          <button
                            type="button"
                            className="matey-admin-v3__user-drawer-action-btn matey-admin-v3__user-drawer-action-btn--cancel"
                            onClick={handleUserDrawerCancel}
                            disabled={
                              userDrawerSaving || !userDrawerHasPendingChanges
                            }
                          >
                            변경 취소
                          </button>
                          <button
                            type="button"
                            className="matey-admin-v3__user-drawer-action-btn matey-admin-v3__user-drawer-action-btn--save"
                            onClick={handleUserDrawerSave}
                            disabled={
                              userDrawerSaving || !userDrawerHasPendingChanges
                            }
                          >
                            {userDrawerSaving ? '저장 중…' : '저장'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}

        {/* ----------------- 문의/신고 관리 탭 ----------------- */}
        {activeTab === 'supports' && (
          <section className="matey-admin-v3__panel">
            <div className="matey-admin-v3__panel-head">
              <div>
                <span className="matey-admin-v3__section-kicker">SUPPORT</span>
                <h2>
                  {supportTypeFilter === 'REPORT' ? '신고 처리' : '문의 처리'}
                </h2>
                <p className="matey-admin-v3__panel-sub">
                  {supportTypeFilter === 'REPORT'
                    ? '접수된 신고를 검토하고, 처리 상태와 회신을 관리해요.'
                    : '접수된 문의를 확인하고, 답변 등록과 처리 상태를 관리해요.'}
                </p>
              </div>

              <div className="matey-admin-v3__support-filter">
                <div
                  className="matey-admin-v3__support-type-tabs"
                  role="tablist"
                  aria-label="유형 선택"
                >
                  <button
                    type="button"
                    className={`matey-admin-v3__support-type-btn ${
                      supportTypeFilter === 'INQUIRY' ? 'is-active' : ''
                    }`}
                    onClick={() => setSupportTypeFilter('INQUIRY')}
                  >
                    문의
                  </button>
                  <button
                    type="button"
                    className={`matey-admin-v3__support-type-btn ${
                      supportTypeFilter === 'REPORT' ? 'is-active' : ''
                    }`}
                    onClick={() => setSupportTypeFilter('REPORT')}
                  >
                    신고
                  </button>
                </div>

                <select
                  value={supportStatusFilter}
                  onChange={(e) => setSupportStatusFilter(e.target.value)}
                >
                  <option value="ALL">전체 상태</option>
                  <option value="PENDING">대기</option>
                  <option value="DONE">완료</option>
                </select>
              </div>
            </div>

            <div className="matey-admin-v3__support-grid">
              {filteredSupports.length > 0 ? (
                <div className="matey-admin-v3__support-list">
                  {filteredSupports.map((item) => (
                    <article
                      key={item.support_id}
                      data-matey-support-card={item.support_id}
                      className={`matey-admin-v3__support-card ${
                        selectedSupport?.support_id === item.support_id ? 'is-active' : ''
                      }`}
                      onClick={() => openSupportModal(item.support_id)}
                    >
                      <div className="matey-admin-v3__support-card-row">
                        <div className="matey-admin-v3__support-card-main">
                          <h3>{displaySupportTicketTitle(item.title)}</h3>
                          <p className="matey-admin-v3__support-card-preview">
                            {(() => {
                              const c = String(item.content || '');
                              return c.length > 88 ? `${c.slice(0, 88)}…` : c;
                            })()}
                          </p>
                        </div>
                        <div className="matey-admin-v3__support-card-aside">
                          <div className="matey-admin-v3__support-card-pills">
                            <span
                              className={`matey-admin-v3__pill ${
                                item.reason_type === 'REPORT' ? 'is-high' : 'is-medium'
                              }`}
                            >
                              {REASON_TYPE_LABELS[item.reason_type]}
                            </span>
                            <span
                              className={`matey-admin-v3__pill ${
                                SUPPORT_STATUS_PILL_CLASS[item.status]
                              }`}
                            >
                              {SUPPORT_STATUS_LABELS[item.status]}
                            </span>
                          </div>
                          <div className="matey-admin-v3__support-card-aside-meta">
                            <span>
                              {formatDateTime(item.created_at)} ·{' '}
                              {item.user_nickname || item.userNickname || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="matey-admin-v3__support-list-empty-text">
                  {(() => {
                    const typeLabel = supportTypeFilter === 'REPORT' ? '신고' : '문의';
                    if (supportStatusFilter === 'PENDING') {
                      return `대기 중인 ${typeLabel}가 없어요.`;
                    }
                    if (supportStatusFilter === 'DONE') {
                      return `처리 완료된 ${typeLabel}가 없어요.`;
                    }
                    return `아직 들어온 ${typeLabel}가 없어요.`;
                  })()}
                </p>
              )}
            </div>

            {supportModalOpen ? (
              <div className="matey-admin-v3__support-detail-full">
                {supportDetailLoading ? (
                  <>
                    <div className="matey-admin-v3__support-detail-full-head">
                      <button
                        type="button"
                        className="matey-admin-v3__ghost-button"
                        onClick={closeSupportModal}
                      >
                        닫기
                      </button>
                    </div>
                    <div className="matey-admin-v3__empty">불러오는 중…</div>
                  </>
                ) : supportDetailError ? (
                  <>
                    <div className="matey-admin-v3__support-detail-full-head">
                      <button
                        type="button"
                        className="matey-admin-v3__ghost-button"
                        onClick={closeSupportModal}
                      >
                        닫기
                      </button>
                    </div>
                    <div className="matey-admin-v3__empty">{supportDetailError}</div>
                  </>
                ) : (
                  <>
                    <div className="matey-admin-v3__support-detail-body">
                      <header className="matey-admin-v3__support-detail-header">
                        <span
                          className={`matey-admin-v3__pill ${
                            supportDetailIsReport ? 'is-high' : 'is-medium'
                          }`}
                        >
                          {supportDetailIsReport
                            ? REASON_TYPE_LABELS.REPORT
                            : REASON_TYPE_LABELS.INQUIRY}
                        </span>
                        <div className="matey-admin-v3__support-detail-header-actions">
                          <span
                            className={`matey-admin-v3__pill ${
                              SUPPORT_STATUS_PILL_CLASS[
                                String(supportDetail?.status || '').toUpperCase() === 'DONE'
                                  ? 'DONE'
                                  : 'PENDING'
                              ]
                            }`}
                          >
                            {
                              SUPPORT_STATUS_LABELS[
                                String(supportDetail?.status || '').toUpperCase() === 'DONE'
                                  ? 'DONE'
                                  : 'PENDING'
                              ]
                            }
                          </span>
                          <button
                            type="button"
                            className="matey-admin-v3__ghost-button matey-admin-v3__support-detail-close"
                            onClick={closeSupportModal}
                          >
                            닫기
                          </button>
                        </div>
                      </header>

                      <div className="matey-admin-v3__support-detail-hero">
                        <p className="matey-admin-v3__support-detail-eyebrow">제목</p>
                        <h2 className="matey-admin-v3__support-detail-heading">
                          {displaySupportTicketTitle(supportDetail?.title)}
                        </h2>
                        <div className="matey-admin-v3__support-detail-meta-row">
                          <span className="matey-admin-v3__support-detail-meta-item matey-admin-v3__support-detail-meta-item--time">
                            {formatDateTime(supportDetail?.createdAt)}
                          </span>
                          <span className="matey-admin-v3__support-detail-meta-dot" aria-hidden />
                          <span className="matey-admin-v3__support-detail-meta-item matey-admin-v3__support-detail-meta-item--user">
                            {supportDetail?.userNickname || '—'}
                          </span>
                        </div>
                      </div>

                      <section className="matey-admin-v3__support-detail-panel matey-admin-v3__support-detail-panel--message">
                        <div className="matey-admin-v3__support-detail-panel-head">
                          <h4 className="matey-admin-v3__support-detail-panel-title">
                            {supportDetailIsReport ? '신고 내용' : '문의 내용'}
                          </h4>
                        </div>
                        <div className="matey-admin-v3__support-content matey-admin-v3__support-content--inset">
                          {supportDetail?.content || ''}
                        </div>
                      </section>

                      <section className="matey-admin-v3__support-detail-panel matey-admin-v3__support-detail-panel--reply">
                        <div className="matey-admin-v3__support-detail-panel-head">
                          <h4 className="matey-admin-v3__support-detail-panel-title">
                            {supportHasExistingAnswer
                              ? '관리자 답변 (수정)'
                              : '관리자 답변 (등록)'}
                          </h4>
                        </div>
                        <div className="matey-admin-v3__support-reply">
                          <textarea
                            className="matey-admin-v3__support-reply-textarea"
                            rows={5}
                            placeholder={
                              supportHasExistingAnswer
                                ? '등록된 답변을 수정해 주세요.'
                                : '답변 내용을 입력해 주세요.'
                            }
                            value={supportAnswerDraft}
                            onChange={(e) => setSupportAnswerDraft(e.target.value)}
                            disabled={supportAnswerSaving}
                          />
                          <p className="matey-admin-v3__support-detail-reply-footnote">
                            {formatDateTime(supportDetail?.answerCreatedAt)} ·{' '}
                            {supportDetail?.answerAdminNickname || '—'}
                          </p>
                          <div className="matey-admin-v3__support-reply-actions">
                            <button
                              type="button"
                              className="matey-admin-v3__ghost-button"
                              onClick={() =>
                                handleSupportStatusChange(selectedSupportId, 'PENDING')
                              }
                              disabled={supportAnswerSaving}
                            >
                              대기로 표시
                            </button>
                            <button
                              type="button"
                              className="matey-admin-v3__primary-button"
                              onClick={handleSupportAnswerSave}
                              disabled={
                                supportAnswerSaving ||
                                !String(supportAnswerDraft || '').trim()
                              }
                            >
                              {supportAnswerSaving
                                ? supportHasExistingAnswer
                                  ? '수정 중…'
                                  : '등록 중…'
                                : supportHasExistingAnswer
                                  ? '답변 수정'
                                  : '답변 등록'}
                            </button>
                            {selectedSupportId == null ? (
                              <p className="matey-admin-v3__hint-text">
                                먼저 목록에서 문의/신고를 클릭해 선택한 뒤 답변을 등록하거나 수정해
                                주세요.
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </section>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </section>
        )}

        {/* ----------------- 상담봇 관리 탭 ----------------- */}
        {activeTab === 'bots' && (
          <section className="matey-admin-v3__panel">
            <div className="matey-admin-v3__panel-head">
              <div>
                <span className="matey-admin-v3__section-kicker">BOT</span>
                <h2>상담봇 운영 현황</h2>
                <p className="matey-admin-v3__panel-sub">
                  인기, 좋아요/싫어요, 랭킹을 확인해요.
                </p>
              </div>
            </div>

            <div className="matey-admin-v3__bot-grid">
              {bots.map((bot) => (
                <article className="matey-admin-v3__bot-card" key={bot.bot_id}>
                  <div className="matey-admin-v3__bot-card-head">
                    <span className="matey-admin-v3__bot-rank-badge rank-1">
                      #{bot.ranking ?? '-'}
                    </span>
                    <strong>{bot.name}</strong>
                  </div>

                  <p className="matey-admin-v3__bot-desc">{bot.description}</p>

                  <div className="matey-admin-v3__bot-stat-row">
                    <div className="matey-admin-v3__bot-stat">
                      <span>좋아요</span>
                      <strong>👍 {bot.like_count}</strong>
                    </div>
                    <div className="matey-admin-v3__bot-stat">
                      <span>싫어요</span>
                      <strong>👎 {bot.dislike_count}</strong>
                    </div>
                    <div className="matey-admin-v3__bot-stat">
                      <span>인기 점수</span>
                      <strong>{bot.popularity_score?.toFixed(1)}</strong>
                    </div>
                  </div>

                  <div className="matey-admin-v3__bar-track">
                    <div
                      className="matey-admin-v3__bar-fill violet"
                      style={{
                        width: `${Math.min(100, Math.round(bot.popularity_score || 0))}%`,
                      }}
                    />
                  </div>
                </article>
              ))}

              {bots.length === 0 && (
                <div className="matey-admin-v3__empty">
                  등록된 상담봇이 없어요.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ----------------- 활동 로그 탭 ----------------- */}
        {activeTab === 'logs' && (
          <section className="matey-admin-v3__panel">
            <div className="matey-admin-v3__panel-head">
              <div>
                <span className="matey-admin-v3__section-kicker">ACTIVITY LOG</span>
                <h2>관리자 활동 로그</h2>
                <p className="matey-admin-v3__panel-sub">
                  누가, 언제, 어떤 작업을 했는지 기록해 운영 이력을 투명하게 보관해요.
                  (브라우저 임시 보관)
                </p>
              </div>

              <div className="matey-admin-v3__support-filter" style={{ alignItems: 'flex-start' }}>
                <input
                  type="text"
                  value={logKeyword}
                  onChange={(e) => setLogKeyword(e.target.value)}
                  placeholder="작업/대상/태그 검색"
                  style={{ flex: 1 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '160px', flexShrink: 0 }}>
                  <select
                    value={logCategoryFilter}
                    onChange={(e) => setLogCategoryFilter(e.target.value)}
                    style={{ height: '48px' }}
                  >
                    <option value="ALL">전체 카테고리</option>
                    <option value="대시보드">대시보드</option>
                    <option value="사용자 관리">사용자 관리</option>
                    <option value="권한 관리">권한 관리</option>
                    <option value="문의·신고 관리">문의·신고 관리</option>
                  </select>
                  <button
                    type="button"
                    className="matey-admin-v3__mini-btn is-danger"
                    onClick={handleClearLogs}
                    disabled={logs.length === 0}
                    style={{ width: '100%', height: '48px', minHeight: '48px' }}
                  >
                    로그 전체 삭제
                  </button>
                </div>
              </div>
            </div>

            <div className="matey-admin-v3__activity-list">
              {filteredLogs.map((item) => (
                <article key={item.id} className="matey-admin-v3__activity-item">
                  <div className="matey-admin-v3__activity-content">
                    <div className="matey-admin-v3__activity-top">
                      <strong>
                        {item.actor} · {item.action}
                      </strong>
                      <span>{formatDateTime(item.created_at)}</span>
                    </div>

                    <div className="matey-admin-v3__activity-body">
                      <strong>{item.category}</strong> · 대상: {item.target}
                      <br />
                      {item.detail}
                    </div>

                    <div className="matey-admin-v3__activity-tags">
                      <span className="matey-admin-v3__tag">{item.actor_role}</span>
                      {(item.tags || []).map((tag, i) => (
                        <span key={`${item.id}-${i}`} className="matey-admin-v3__tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}

              {filteredLogs.length === 0 && (
                <div className="matey-admin-v3__empty">
                  표시할 활동 로그가 없어요. 작업을 수행하면 여기에 기록돼요.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
