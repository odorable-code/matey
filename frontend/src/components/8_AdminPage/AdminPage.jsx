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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../utils/api';
import { displaySupportTicketTitle } from '../../utils/supportReportDisplay';
import './AdminPage.css';

/* =========================================================
   상수 / 라벨 매핑 코드
========================================================= */
const ADMIN_LOG_STORAGE_KEY = 'matey_admin_activity_logs_v4';

const ROLE_LABELS = {
  ADMIN: '총 관리자',
  SUBADMIN: '서브 관리자',
  USER: '일반 사용자',
};

const ROLE_PILL_CLASS = {
  ADMIN: 'is-super',
  SUBADMIN: 'is-admin',
  USER: 'is-user',
};

const USER_STATUS_LABELS = {
  ACTIVE: '활성',
  BANNED: '정지',
  DELETED: '탈퇴',
};

const USER_STATUS_PILL_CLASS = {
  ACTIVE: 'is-active',
  BANNED: 'is-suspended',
  DELETED: 'is-deleted',
};

const LOGIN_TYPE_LABELS = {
  LOCAL: '이메일',
  KAKAO: '카카오',
  NAVER: '네이버',
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
  return code === 'ADMIN' || code === 'SUBADMIN';
}

function isSuperAdmin(roleCode) {
  return String(roleCode || '').toUpperCase() === 'ADMIN';
}

function getUserRoleCode(targetUser) {
  return (
    targetUser?.role_code ||
    targetUser?.role ||
    targetUser?.roles?.[0]?.role_code ||
    targetUser?.roles?.[0] ||
    'USER'
  );
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

function nowTimeLabel(offsetMinutes = 0) {
  const date = new Date(Date.now() + offsetMinutes * 60000);
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${hh}:${mm}`;
}

function createInitialRealtimeSeries(base, variance) {
  return Array.from({ length: 8 }, (_, index) => {
    const offset = (index - 7) * 10;
    const wave = Math.sin(index * 1.2) * variance * 0.4;
    const noise = Math.round((Math.random() - 0.5) * variance);

    return {
      label: nowTimeLabel(offset),
      value: Math.max(8, Math.round(base + wave + noise + index * 2)),
    };
  });
}

function mutateSeries(prev, stepMin, stepMax, floorValue = 10) {
  const lastValue = prev[prev.length - 1]?.value || floorValue;
  const delta = Math.round(Math.random() * (stepMax - stepMin) + stepMin);
  const direction = Math.random() > 0.45 ? 1 : -1;
  const nextValue = Math.max(floorValue, lastValue + delta * direction);

  return [...prev.slice(1), { label: nowTimeLabel(), value: nextValue }];
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
  const { user, isAuthenticated, authLoading } = useAuth();

  /* =========================================================
     탭 상태
  ========================================================= */
  const [activeTab, setActiveTab] = useState('overview');

  /* =========================================================
     데이터 상태
  ========================================================= */
  const [users, setUsers] = useState([]);
  const [supports, setSupports] = useState([]);
  const [bots, setBots] = useState([]);
  const [emotionStats, setEmotionStats] = useState([]);
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* =========================================================
     실시간 차트 데이터
  ========================================================= */
  const [liveUserSeries, setLiveUserSeries] = useState(() =>
    createInitialRealtimeSeries(142, 12)
  );
  const [liveChatSeries, setLiveChatSeries] = useState(() =>
    createInitialRealtimeSeries(87, 18)
  );

  /* =========================================================
     사용자 관리 필터
  ========================================================= */
  const [userKeyword, setUserKeyword] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userLoginFilter, setUserLoginFilter] = useState('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  /* =========================================================
     문의/신고 필터
  ========================================================= */
  const [supportTypeFilter, setSupportTypeFilter] = useState('ALL');
  const [supportStatusFilter, setSupportStatusFilter] = useState('ALL');
  const [selectedSupportId, setSelectedSupportId] = useState(null);

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

        const [usersData, feedbacksData, emotionData] = await Promise.all([
          adminAPI.getUsers().catch(() => []),
          adminAPI.getFeedbacks({ status: 'ALL' }).catch(() => []),
          adminAPI.getEmotionStats().catch(() => []),
        ]);

        const usersArr = Array.isArray(usersData) ? usersData : [];
        const feedbacksArr = Array.isArray(feedbacksData) ? feedbacksData : [];
        const emotionArr = Array.isArray(emotionData) ? emotionData : [];

        setUsers(usersArr.map(normalizeAdminUser).filter(Boolean));
        setSupports(feedbacksArr.map(normalizeAdminFeedback).filter(Boolean));
        setBots([]);
        setEmotionStats(
          emotionArr.map(normalizeEmotionStat).filter(Boolean)
        );
        setLogs(loadLogs());
      } catch (err) {
        console.error('관리자 데이터 로드 실패:', err);
        setError(err?.message || '데이터를 불러오지 못했어요.');
        setUsers([]);
        setSupports([]);
        setBots([]);
        setEmotionStats([]);
        setLogs(loadLogs());
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated && !authLoading) {
      fetchAdminData();
    }
  }, [isAuthenticated, authLoading]);

  /* =========================================================
     실시간 차트 30초마다 갱신
  ========================================================= */
  useEffect(() => {
    const interval = window.setInterval(() => {
      setLiveUserSeries((prev) => mutateSeries(prev, 1, 5, 90));
      setLiveChatSeries((prev) => mutateSeries(prev, 2, 8, 40));
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  /* =========================================================
     선택된 사용자가 목록에서 사라지면 정리
  ========================================================= */
  useEffect(() => {
    setSelectedUserIds((prev) =>
      prev.filter((id) => users.some((item) => item.user_id === id))
    );
  }, [users]);

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
      const matchesLogin =
        userLoginFilter === 'ALL' || item.login_type === userLoginFilter;

      return matchesKeyword && matchesRole && matchesStatus && matchesLogin;
    });
  }, [users, userKeyword, userRoleFilter, userStatusFilter, userLoginFilter]);

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

  /* =========================================================
     실시간 지표 새로고침
  ========================================================= */
  const handleRefreshRealtime = () => {
    setLiveUserSeries((prev) => mutateSeries(prev, 2, 6, 90));
    setLiveChatSeries((prev) => mutateSeries(prev, 3, 9, 40));
    pushAdminLog(
      '대시보드',
      '실시간 지표 새로고침',
      '운영 대시보드',
      '활성 사용자 / 채팅 세션 지표를 수동으로 새로고침했습니다.',
      ['실시간 통계']
    );
  };

  /* =========================================================
     사용자 선택 토글
  ========================================================= */
  const handleToggleUserSelect = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const allVisibleSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((item) => selectedUserIds.includes(item.user_id));

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedUserIds((prev) =>
        prev.filter((id) => !filteredUsers.some((u) => u.user_id === id))
      );
      return;
    }

    setSelectedUserIds((prev) => {
      const merged = new Set([...prev, ...filteredUsers.map((u) => u.user_id)]);
      return Array.from(merged);
    });
  };

  /* =========================================================
     사용자 상태 일괄 변경
  ========================================================= */
  const handleBulkStatus = (nextStatus) => {
    const targets = filteredUsers
      .filter((u) => selectedUserIds.includes(u.user_id))
      .filter((u) => canManageStatus(u));

    if (targets.length === 0) return;

    const ids = targets.map((u) => u.user_id);

    setUsers((prev) =>
      prev.map((u) => (ids.includes(u.user_id) ? { ...u, status: nextStatus } : u))
    );

    pushAdminLog(
      '사용자 관리',
      '일괄 상태 변경',
      `${ids.length}명 사용자`,
      `선택한 ${ids.length}명의 상태를 ${USER_STATUS_LABELS[nextStatus]}(으)로 변경했습니다.`,
      ['일괄 작업', nextStatus]
    );

    setSelectedUserIds([]);
  };

  /* =========================================================
     사용자 권한 일괄 변경 (총 관리자만 가능)
  ========================================================= */
  const handleBulkRole = (nextRole) => {
    if (!currentAdminIsSuper) return;

    const targets = filteredUsers
      .filter((u) => selectedUserIds.includes(u.user_id))
      .filter((u) => canManageRole(u));

    if (targets.length === 0) return;

    const ids = targets.map((u) => u.user_id);

    setUsers((prev) =>
      prev.map((u) => (ids.includes(u.user_id) ? { ...u, role_code: nextRole } : u))
    );

    pushAdminLog(
      '권한 관리',
      '일괄 권한 변경',
      `${ids.length}명 사용자`,
      `선택한 ${ids.length}명의 권한을 ${ROLE_LABELS[nextRole]}(으)로 변경했습니다.`,
      ['권한 변경', nextRole]
    );

    setSelectedUserIds([]);
  };

  /* =========================================================
     단일 사용자 상태/권한 변경
  ========================================================= */
  const handleUserStatusChange = (userId, nextStatus) => {
    const target = users.find((u) => u.user_id === userId);
    if (!target || !canManageStatus(target) || target.status === nextStatus) return;

    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, status: nextStatus } : u))
    );

    pushAdminLog(
      '사용자 관리',
      '사용자 상태 변경',
      target.nickname,
      `${target.nickname} 사용자의 상태를 ${USER_STATUS_LABELS[nextStatus]}(으)로 변경했습니다.`,
      ['상태 변경', nextStatus]
    );
  };

  const handleUserRoleChange = (userId, nextRole) => {
    const target = users.find((u) => u.user_id === userId);
    if (!target || !canManageRole(target) || getUserRoleCode(target) === nextRole) return;

    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role_code: nextRole } : u))
    );

    pushAdminLog(
      '권한 관리',
      '사용자 권한 변경',
      target.nickname,
      `${target.nickname} 사용자의 권한을 ${ROLE_LABELS[nextRole]}(으)로 변경했습니다.`,
      ['권한 변경', nextRole]
    );
  };

  /* =========================================================
     문의/신고 상태 변경
  ========================================================= */
  const handleSupportStatusChange = (supportId, nextStatus) => {
    const target = supports.find((s) => s.support_id === supportId);
    if (!target || target.status === nextStatus) return;

    setSupports((prev) =>
      prev.map((s) =>
        s.support_id === supportId ? { ...s, status: nextStatus } : s
      )
    );

    pushAdminLog(
      '문의·신고 관리',
      `${REASON_TYPE_LABELS[target.reason_type]} 상태 변경`,
      `티켓 #${supportId}`,
      `"${target.title}" 티켓 상태를 ${SUPPORT_STATUS_LABELS[nextStatus]}(으)로 변경했습니다.`,
      [REASON_TYPE_LABELS[target.reason_type], nextStatus]
    );
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
    return <Navigate to="/login" replace />;
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
          <strong>{stats.totalUsers}</strong>
          <p>USER 테이블 전체 계정 수</p>
        </article>

        <article className="matey-admin-v3__summary-card accent-blue">
          <span>활성 사용자</span>
          <strong>{stats.activeUsers}</strong>
          <p>
            정지 {stats.bannedUsers}명 · 탈퇴 {stats.deletedUsers}명
          </p>
        </article>

        <article className="matey-admin-v3__summary-card accent-orange">
          <span>대기 중 문의·신고</span>
          <strong>{stats.pendingSupports}</strong>
          <p>
            신고 {stats.reportCount}건 · 문의 {stats.inquiryCount}건
          </p>
        </article>

        <article className="matey-admin-v3__summary-card accent-mint">
          <span>관리자 권한 계정</span>
          <strong>{stats.adminCount + stats.subAdminCount}</strong>
          <p>
            총 {stats.adminCount}명 · 서브 {stats.subAdminCount}명
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
                    USER, CHAT_ROOM, MESSAGE 테이블의 최근 활동량을 실시간으로 보여줘요.
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
                      <p>CHAT_ROOM 활성 세션 수</p>
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
                      <p>EMOTION_SCORE 누적 집계</p>
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
                      <p>BOT_POPULARITY_STAT 기준</p>
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
          <section className="matey-admin-v3__panel">
            <div className="matey-admin-v3__panel-head">
              <div>
                <span className="matey-admin-v3__section-kicker">USER</span>
                <h2>사용자 검색 · 권한 · 상태 관리</h2>
                <p className="matey-admin-v3__panel-sub">
                  USER + USER_ROLE 테이블 기준으로 검색, 필터링, 일괄 작업을 처리해요.
                </p>
              </div>
            </div>

            <div className="matey-admin-v3__toolbar">
              <div className="matey-admin-v3__search-wrap">
                <input
                  type="text"
                  value={userKeyword}
                  onChange={(e) => setUserKeyword(e.target.value)}
                  placeholder="이메일, 닉네임, 실명으로 검색"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="ALL">전체 권한</option>
                <option value="ADMIN">총 관리자</option>
                <option value="SUBADMIN">서브 관리자</option>
                <option value="USER">일반 사용자</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
              >
                <option value="ALL">전체 상태</option>
                <option value="ACTIVE">활성</option>
                <option value="BANNED">정지</option>
                <option value="DELETED">탈퇴</option>
              </select>

              <select
                value={userLoginFilter}
                onChange={(e) => setUserLoginFilter(e.target.value)}
              >
                <option value="ALL">전체 로그인</option>
                <option value="LOCAL">이메일</option>
                <option value="KAKAO">카카오</option>
                <option value="NAVER">네이버</option>
              </select>
            </div>

            <div className="matey-admin-v3__bulk-bar">
              <div className="matey-admin-v3__bulk-info">
                <label className="matey-admin-v3__checkbox">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleSelectAllVisible}
                  />
                  현재 목록 전체 선택
                </label>
                <strong>선택된 사용자 {selectedUserIds.length}명</strong>
              </div>

              <div className="matey-admin-v3__bulk-actions">
                <button
                  type="button"
                  className="matey-admin-v3__mini-btn is-primary-soft"
                  disabled={selectedUserIds.length === 0}
                  onClick={() => handleBulkStatus('ACTIVE')}
                >
                  일괄 활성화
                </button>
                <button
                  type="button"
                  className="matey-admin-v3__mini-btn is-danger"
                  disabled={selectedUserIds.length === 0}
                  onClick={() => handleBulkStatus('BANNED')}
                >
                  일괄 정지
                </button>
                <button
                  type="button"
                  className="matey-admin-v3__mini-btn"
                  disabled={selectedUserIds.length === 0 || !currentAdminIsSuper}
                  onClick={() => handleBulkRole('SUBADMIN')}
                >
                  서브 관리자 지정
                </button>
                <button
                  type="button"
                  className="matey-admin-v3__mini-btn"
                  disabled={selectedUserIds.length === 0 || !currentAdminIsSuper}
                  onClick={() => handleBulkRole('ADMIN')}
                >
                  총 관리자 지정
                </button>
                <button
                  type="button"
                  className="matey-admin-v3__mini-btn"
                  disabled={selectedUserIds.length === 0 || !currentAdminIsSuper}
                  onClick={() => handleBulkRole('USER')}
                >
                  일반 사용자 전환
                </button>
              </div>
            </div>

            <div className="matey-admin-v3__table-wrap">
              <table className="matey-admin-v3__table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>선택</th>
                    <th>사용자</th>
                    <th>권한</th>
                    <th>상태</th>
                    <th>로그인</th>
                    <th>가입일</th>
                    <th>최근 로그인</th>
                    <th>상담수</th>
                    <th>신고당함</th>
                    <th>권한 변경</th>
                    <th>상태 변경</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => {
                    const role = getUserRoleCode(item);

                    return (
                      <tr key={item.user_id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(item.user_id)}
                            onChange={() => handleToggleUserSelect(item.user_id)}
                          />
                        </td>

                        <td>
                          <div className="matey-admin-v3__user-cell">
                            <span className="matey-admin-v3__user-avatar">
                              {String(item.nickname || '?').charAt(0)}
                            </span>
                            <div>
                              <strong>{item.nickname}</strong>
                              <small>{item.email}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`matey-admin-v3__pill ${ROLE_PILL_CLASS[role] || 'is-user'}`}
                          >
                            {ROLE_LABELS[role] || '일반 사용자'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`matey-admin-v3__pill ${
                              USER_STATUS_PILL_CLASS[item.status] || ''
                            }`}
                          >
                            {USER_STATUS_LABELS[item.status] || '-'}
                          </span>
                        </td>

                        <td className="matey-admin-v3__meta-text">
                          {LOGIN_TYPE_LABELS[item.login_type] || item.login_type}
                        </td>

                        <td className="matey-admin-v3__meta-text">
                          {formatDate(item.created_at)}
                        </td>

                        <td className="matey-admin-v3__meta-text">
                          {formatDateTime(item.last_login_at)}
                        </td>

                        <td>{item.chat_count ?? 0}건</td>
                        <td>{item.report_count ?? 0}건</td>

                        <td>
                          <select
                            className="matey-admin-v3__row-select"
                            value={role}
                            onChange={(e) =>
                              handleUserRoleChange(item.user_id, e.target.value)
                            }
                            disabled={!canManageRole(item)}
                          >
                            <option value="ADMIN">총 관리자</option>
                            <option value="SUBADMIN">서브 관리자</option>
                            <option value="USER">일반 사용자</option>
                          </select>
                        </td>

                        <td>
                          <select
                            className="matey-admin-v3__row-select"
                            value={item.status}
                            onChange={(e) =>
                              handleUserStatusChange(item.user_id, e.target.value)
                            }
                            disabled={!canManageStatus(item)}
                          >
                            <option value="ACTIVE">활성</option>
                            <option value="BANNED">정지</option>
                            <option value="DELETED">탈퇴</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={11}>
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
        )}

        {/* ----------------- 문의/신고 관리 탭 ----------------- */}
        {activeTab === 'supports' && (
          <section className="matey-admin-v3__panel">
            <div className="matey-admin-v3__panel-head">
              <div>
                <span className="matey-admin-v3__section-kicker">SUPPORT</span>
                <h2>문의 · 신고 처리</h2>
                <p className="matey-admin-v3__panel-sub">
                  SUPPORT + SUPPORT_REASON 테이블 기준으로 신고와 문의를 한 곳에서 처리해요.
                </p>
              </div>

              <div className="matey-admin-v3__support-filter">
                <select
                  value={supportTypeFilter}
                  onChange={(e) => setSupportTypeFilter(e.target.value)}
                >
                  <option value="ALL">전체 유형</option>
                  <option value="REPORT">신고</option>
                  <option value="INQUIRY">문의</option>
                </select>

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
              <div className="matey-admin-v3__support-list">
                {filteredSupports.map((item) => (
                  <article
                    key={item.support_id}
                    className={`matey-admin-v3__support-card ${
                      selectedSupport?.support_id === item.support_id ? 'is-active' : ''
                    }`}
                    onClick={() => setSelectedSupportId(item.support_id)}
                  >
                    <div className="matey-admin-v3__support-card-head">
                      <div>
                        <h3>{displaySupportTicketTitle(item.title)}</h3>
                        <p>{item.user_nickname || item.userNickname || '—'}</p>
                      </div>
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

                    <p className="matey-admin-v3__support-card-preview">
                      {(() => {
                        const c = String(item.content || '');
                        return c.length > 88 ? `${c.slice(0, 88)}…` : c;
                      })()}
                    </p>

                    <div className="matey-admin-v3__support-card-meta">
                      <span>#{item.support_id}</span>
                      <span>{item.user_nickname}</span>
                      <span>{item.reason_name}</span>
                    </div>
                  </article>
                ))}

                {filteredSupports.length === 0 && (
                  <div className="matey-admin-v3__empty">
                    조건에 맞는 문의/신고가 없어요.
                  </div>
                )}
              </div>

              <div className="matey-admin-v3__support-detail">
                {selectedSupport ? (
                  <>
                    <div className="matey-admin-v3__support-detail-head">
                      <div>
                        <h3>{displaySupportTicketTitle(selectedSupport.title)}</h3>
                        <div className="matey-admin-v3__support-detail-info">
                          <span className="matey-admin-v3__pill is-user">
                            #{selectedSupport.support_id}
                          </span>
                          <span
                            className={`matey-admin-v3__pill ${
                              selectedSupport.reason_type === 'REPORT' ? 'is-high' : 'is-medium'
                            }`}
                          >
                            {REASON_TYPE_LABELS[selectedSupport.reason_type]}
                          </span>
                          <span className="matey-admin-v3__pill is-user">
                            {selectedSupport.reason_name}
                          </span>
                          <span
                            className={`matey-admin-v3__pill ${
                              SUPPORT_STATUS_PILL_CLASS[selectedSupport.status]
                            }`}
                          >
                            {SUPPORT_STATUS_LABELS[selectedSupport.status]}
                          </span>
                        </div>
                      </div>

                      <div className="matey-admin-v3__meta-text">
                        작성자: {selectedSupport.user_nickname}
                        <br />
                        접수 일시: {formatDateTime(selectedSupport.created_at)}
                      </div>
                    </div>

                    <div className="matey-admin-v3__support-content">
                      {selectedSupport.content}
                    </div>

                    <div className="matey-admin-v3__support-actions">
                      <button
                        type="button"
                        className="matey-admin-v3__ghost-button"
                        onClick={() =>
                          handleSupportStatusChange(selectedSupport.support_id, 'PENDING')
                        }
                      >
                        대기로 표시
                      </button>
                      <button
                        type="button"
                        className="matey-admin-v3__primary-button"
                        onClick={() =>
                          handleSupportStatusChange(selectedSupport.support_id, 'DONE')
                        }
                      >
                        처리 완료
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="matey-admin-v3__empty">
                    상세하게 볼 문의/신고를 선택해 주세요.
                  </div>
                )}
              </div>
            </div>
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
                  BOT + BOT_POPULARITY_STAT 기준 인기, 좋아요/싫어요, 랭킹을 확인해요.
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

              <div className="matey-admin-v3__support-filter">
                <input
                  type="text"
                  value={logKeyword}
                  onChange={(e) => setLogKeyword(e.target.value)}
                  placeholder="작업/대상/태그 검색"
                />
                <select
                  value={logCategoryFilter}
                  onChange={(e) => setLogCategoryFilter(e.target.value)}
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
                >
                  로그 전체 삭제
                </button>
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
