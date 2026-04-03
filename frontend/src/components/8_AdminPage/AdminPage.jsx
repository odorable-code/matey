/* src/components/8_AdminPage/AdminPage.jsx */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminPage.css';

const ADMIN_LOG_STORAGE_KEY = 'matey_admin_activity_logs_v3';

const INITIAL_USERS = [
  {
    id: 1,
    nickname: '김메이',
    email: 'mei.kim@matey.app',
    phone: '010-2145-8871',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    joinDate: '2025-11-12',
    lastLogin: '2026-04-02T08:42:00',
    attendance: 96,
    conversations: 148,
    reports: 34,
    feedbackCount: 6,
    tags: ['운영팀', '핵심 관리자'],
  },
  {
    id: 2,
    nickname: '박민수',
    email: 'minsu.park@matey.app',
    phone: '010-4312-9012',
    role: 'ADMIN',
    status: 'ACTIVE',
    joinDate: '2025-12-01',
    lastLogin: '2026-04-02T07:58:00',
    attendance: 91,
    conversations: 96,
    reports: 18,
    feedbackCount: 4,
    tags: ['상담 운영', '데이터 검수'],
  },
  {
    id: 3,
    nickname: '정다은',
    email: 'daeun.jung@matey.app',
    phone: '010-7802-1103',
    role: 'ADMIN',
    status: 'ACTIVE',
    joinDate: '2025-12-18',
    lastLogin: '2026-04-01T22:10:00',
    attendance: 89,
    conversations: 88,
    reports: 12,
    feedbackCount: 3,
    tags: ['피드백 관리'],
  },
  {
    id: 4,
    nickname: '이서윤',
    email: 'seoyoon.lee@example.com',
    phone: '010-3344-1278',
    role: 'USER',
    status: 'ACTIVE',
    joinDate: '2026-01-06',
    lastLogin: '2026-04-02T09:11:00',
    attendance: 82,
    conversations: 36,
    reports: 7,
    feedbackCount: 2,
    tags: ['주 3회 이용'],
  },
  {
    id: 5,
    nickname: '최현우',
    email: 'hyunwoo.choi@example.com',
    phone: '010-9931-2224',
    role: 'USER',
    status: 'SUSPENDED',
    joinDate: '2026-01-14',
    lastLogin: '2026-03-27T18:10:00',
    attendance: 41,
    conversations: 12,
    reports: 1,
    feedbackCount: 1,
    tags: ['휴면 위험'],
  },
  {
    id: 6,
    nickname: '한지민',
    email: 'jimin.han@example.com',
    phone: '010-4561-8830',
    role: 'USER',
    status: 'ACTIVE',
    joinDate: '2026-02-03',
    lastLogin: '2026-04-02T06:44:00',
    attendance: 87,
    conversations: 44,
    reports: 9,
    feedbackCount: 3,
    tags: ['리포트 자주 사용'],
  },
  {
    id: 7,
    nickname: '오세훈',
    email: 'sehun.oh@example.com',
    phone: '010-7884-1258',
    role: 'USER',
    status: 'ACTIVE',
    joinDate: '2026-02-19',
    lastLogin: '2026-04-01T20:20:00',
    attendance: 74,
    conversations: 29,
    reports: 3,
    feedbackCount: 0,
    tags: ['신규 활성 사용자'],
  },
  {
    id: 8,
    nickname: '유가영',
    email: 'gayoung.yu@example.com',
    phone: '010-6283-5501',
    role: 'USER',
    status: 'ACTIVE',
    joinDate: '2026-03-08',
    lastLogin: '2026-04-02T08:03:00',
    attendance: 79,
    conversations: 18,
    reports: 2,
    feedbackCount: 2,
    tags: ['피드백 제출자'],
  },
];

const INITIAL_FEEDBACKS = [
  {
    id: 101,
    userNickname: '이서윤',
    category: '상담 품질',
    title: '감정 분석 결과가 실제 체감과 조금 달라요',
    content:
      '최근 2주간의 상담 기록을 보면 제가 불안보다 무기력 쪽 비중이 더 큰데, 리포트에서는 불안 비중이 더 높게 나왔어요. 분석 기준을 조금 더 세분화해주면 좋겠습니다.',
    createdAt: '2026-04-01T17:12:00',
    status: 'PENDING',
    priority: 'HIGH',
  },
  {
    id: 102,
    userNickname: '한지민',
    category: '리포트',
    title: '주간 요약 리포트 PDF 다운로드가 있으면 좋겠어요',
    content:
      '상담 이력을 회사 복지 상담 기록으로 보관하려고 하는데 PDF로 바로 내려받는 기능이 있으면 편할 것 같아요.',
    createdAt: '2026-04-01T12:04:00',
    status: 'REVIEW',
    priority: 'MEDIUM',
  },
  {
    id: 103,
    userNickname: '오세훈',
    category: 'UI/UX',
    title: '모바일에서 필터 버튼이 조금 작게 느껴집니다',
    content:
      '상담 이력 필터 영역의 터치 영역이 작아서 모바일에서 누르기 어려워요. 버튼 높이나 간격을 조금 키워주시면 좋겠습니다.',
    createdAt: '2026-03-31T21:26:00',
    status: 'RESOLVED',
    priority: 'LOW',
  },
  {
    id: 104,
    userNickname: '유가영',
    category: '계정',
    title: '알림 설정이 저장되지 않는 경우가 있었어요',
    content:
      '주간 요약 알림을 껐는데 다음 로그인 후 다시 켜져 있었습니다. 설정 저장 로직을 확인해 주세요.',
    createdAt: '2026-04-02T08:09:00',
    status: 'PENDING',
    priority: 'HIGH',
  },
];

const EMOTION_STATS = [
  { label: '불안', value: 68, color: 'violet' },
  { label: '무기력', value: 49, color: 'pink' },
  { label: '스트레스', value: 82, color: 'blue' },
  { label: '관계 고민', value: 56, color: 'orange' },
  { label: '회복/안정', value: 71, color: 'mint' },
];

const CONCERN_STATS = [
  { label: '직장/진로', value: 76, color: 'violet' },
  { label: '대인관계', value: 63, color: 'blue' },
  { label: '가족', value: 42, color: 'pink' },
  { label: '자존감', value: 58, color: 'orange' },
  { label: '생활 루틴', value: 51, color: 'mint' },
];

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function isAdminUser(targetUser) {
  const role = String(targetUser?.role || targetUser?.roles?.[0] || '').toUpperCase();
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role.includes('ADMIN');
}

function isSuperAdminUser(targetUser) {
  const role = String(targetUser?.role || targetUser?.roles?.[0] || '').toUpperCase();
  return role === 'SUPER_ADMIN' || role.includes('SUPER');
}

function getRoleLabel(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return '슈퍼 관리자';
    case 'ADMIN':
      return '일반 관리자';
    default:
      return '일반 사용자';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'ACTIVE':
      return '활성';
    case 'SUSPENDED':
      return '정지';
    default:
      return '알 수 없음';
  }
}

function getFeedbackStatusLabel(status) {
  switch (status) {
    case 'PENDING':
      return '대기';
    case 'REVIEW':
      return '검토 중';
    case 'RESOLVED':
      return '해결 완료';
    default:
      return '상태 없음';
  }
}

function getPriorityLabel(priority) {
  switch (priority) {
    case 'HIGH':
      return '높음';
    case 'MEDIUM':
      return '보통';
    case 'LOW':
      return '낮음';
    default:
      return '일반';
  }
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

function seedLogsIfNeeded() {
  const existing = loadLogs();
  if (existing.length > 0) return existing;

  const seeded = [
    {
      id: 9001,
      actor: '김메이',
      actorRole: '슈퍼 관리자',
      category: '권한 관리',
      action: '관리자 승격',
      target: '박민수',
      detail: '사용자 권한을 일반 관리자 권한으로 변경했습니다.',
      tags: ['권한 변경', 'ADMIN'],
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: 9002,
      actor: '박민수',
      actorRole: '일반 관리자',
      category: '피드백 관리',
      action: '피드백 상태 변경',
      target: '티켓 #102',
      detail: 'PDF 다운로드 요청 피드백을 검토 중 상태로 변경했습니다.',
      tags: ['피드백', 'REVIEW'],
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    },
    {
      id: 9003,
      actor: '정다은',
      actorRole: '일반 관리자',
      category: '사용자 관리',
      action: '사용자 상태 복구',
      target: '오세훈',
      detail: '휴면 위험 사용자에게 안내 후 계정을 활성 상태로 유지했습니다.',
      tags: ['상태 변경', 'ACTIVE'],
      createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    },
    {
      id: 9004,
      actor: '김메이',
      actorRole: '슈퍼 관리자',
      category: '대시보드',
      action: '실시간 지표 새로고침',
      target: '운영 대시보드',
      detail: '운영 현황 점검을 위해 실시간 지표를 수동 새로고침했습니다.',
      tags: ['실시간 통계'],
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
  ];

  saveLogs(seeded);
  return seeded;
}

function buildLineGeometry(series, width = 620, height = 220, paddingX = 18, paddingY = 18) {
  if (!Array.isArray(series) || series.length === 0) {
    return {
      linePath: '',
      areaPath: '',
      points: [],
    };
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

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${
    points[0].x
  } ${height - paddingY} Z`;

  return {
    linePath,
    areaPath,
    points,
  };
}

function matchesLogPeriod(createdAt, period) {
  if (period === 'ALL') return true;

  const target = new Date(createdAt).getTime();
  const now = Date.now();
  const diff = now - target;

  if (period === 'TODAY') return diff <= 1000 * 60 * 60 * 24;
  if (period === 'WEEK') return diff <= 1000 * 60 * 60 * 24 * 7;

  return true;
}

function pillClassForRole(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'is-super';
    case 'ADMIN':
      return 'is-admin';
    default:
      return 'is-user';
  }
}

function pillClassForStatus(status) {
  switch (status) {
    case 'ACTIVE':
      return 'is-active';
    case 'SUSPENDED':
      return 'is-suspended';
    case 'PENDING':
      return 'is-pending';
    case 'REVIEW':
      return 'is-review';
    case 'RESOLVED':
      return 'is-resolved';
    case 'HIGH':
      return 'is-high';
    case 'MEDIUM':
      return 'is-medium';
    case 'LOW':
      return 'is-low';
    default:
      return '';
  }
}

export default function AdminPage() {
  const { user, isAuthenticated, authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');

  const [users, setUsers] = useState(INITIAL_USERS);
  const [feedbacks, setFeedbacks] = useState(INITIAL_FEEDBACKS);
  const [logs, setLogs] = useState(() =>
    typeof window !== 'undefined' ? seedLogsIfNeeded() : []
  );

  const [liveUserSeries, setLiveUserSeries] = useState(() => createInitialRealtimeSeries(142, 12));
  const [liveCounselSeries, setLiveCounselSeries] = useState(() =>
    createInitialRealtimeSeries(87, 18)
  );

  const [userKeyword, setUserKeyword] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userExtraFilter, setUserExtraFilter] = useState('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('ALL');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(INITIAL_FEEDBACKS[0]?.id ?? null);

  const [logKeyword, setLogKeyword] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState('ALL');
  const [logActorFilter, setLogActorFilter] = useState('ALL');
  const [logPeriodFilter, setLogPeriodFilter] = useState('ALL');

  const adminName = useMemo(() => {
    return (
      user?.nickname ||
      user?.name ||
      user?.username ||
      user?.email?.split('@')?.[0] ||
      '관리자'
    );
  }, [user]);

  const adminRole = useMemo(() => {
    const raw = String(user?.role || user?.roles?.[0] || '').toUpperCase();
    return raw || 'ADMIN';
  }, [user]);

  const currentAdminIsSuper = useMemo(() => isSuperAdminUser(user), [user]);

  const pushAdminLog = useCallback(
    (category, action, target, detail, tags = []) => {
      const nextItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        actor: adminName,
        actorRole: getRoleLabel(adminRole),
        category,
        action,
        target,
        detail,
        tags,
        createdAt: new Date().toISOString(),
      };

      setLogs((prev) => {
        const next = [nextItem, ...prev].slice(0, 120);
        saveLogs(next);
        return next;
      });
    },
    [adminName, adminRole]
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLiveUserSeries((prev) => mutateSeries(prev, 1, 5, 90));
      setLiveCounselSeries((prev) => mutateSeries(prev, 2, 8, 40));
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setSelectedUserIds((prev) => prev.filter((id) => users.some((item) => item.id === id)));
  }, [users]);

  const userCountGrowth = useMemo(() => {
    const first = liveUserSeries[0]?.value || 0;
    const last = liveUserSeries[liveUserSeries.length - 1]?.value || 0;
    return last - first;
  }, [liveUserSeries]);

  const counselCountGrowth = useMemo(() => {
    const first = liveCounselSeries[0]?.value || 0;
    const last = liveCounselSeries[liveCounselSeries.length - 1]?.value || 0;
    return last - first;
  }, [liveCounselSeries]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((item) => item.status === 'ACTIVE').length;
    const suspendedUsers = users.filter((item) => item.status === 'SUSPENDED').length;
    const adminUsers = users.filter((item) => item.role === 'ADMIN').length;
    const superAdmins = users.filter((item) => item.role === 'SUPER_ADMIN').length;
    const totalConversations = users.reduce((sum, item) => sum + item.conversations, 0);
    const totalReports = users.reduce((sum, item) => sum + item.reports, 0);
    const avgAttendance = Math.round(
      users.reduce((sum, item) => sum + item.attendance, 0) / Math.max(users.length, 1)
    );
    const pendingFeedbacks = feedbacks.filter((item) => item.status === 'PENDING').length;
    const reviewFeedbacks = feedbacks.filter((item) => item.status === 'REVIEW').length;
    const resolvedFeedbacks = feedbacks.filter((item) => item.status === 'RESOLVED').length;

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      superAdmins,
      totalConversations,
      totalReports,
      avgAttendance,
      pendingFeedbacks,
      reviewFeedbacks,
      resolvedFeedbacks,
    };
  }, [users, feedbacks]);

  const filteredUsers = useMemo(() => {
    const keyword = normalizeText(userKeyword);

    return users.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.nickname, item.email, item.phone, ...(item.tags || [])]
          .map(normalizeText)
          .some((value) => value.includes(keyword));

      const matchesRole = userRoleFilter === 'ALL' || item.role === userRoleFilter;
      const matchesStatus = userStatusFilter === 'ALL' || item.status === userStatusFilter;

      const matchesExtra =
        userExtraFilter === 'ALL' ||
        (userExtraFilter === 'HIGH_ACTIVITY' && item.conversations >= 40) ||
        (userExtraFilter === 'HAS_FEEDBACK' && item.feedbackCount > 0) ||
        (userExtraFilter === 'LOW_ATTENDANCE' && item.attendance < 60);

      return matchesKeyword && matchesRole && matchesStatus && matchesExtra;
    });
  }, [users, userKeyword, userRoleFilter, userStatusFilter, userExtraFilter]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      return feedbackStatusFilter === 'ALL' || item.status === feedbackStatusFilter;
    });
  }, [feedbacks, feedbackStatusFilter]);

  const selectedFeedback = useMemo(() => {
    return (
      filteredFeedbacks.find((item) => item.id === selectedFeedbackId) ||
      filteredFeedbacks[0] ||
      null
    );
  }, [filteredFeedbacks, selectedFeedbackId]);

  useEffect(() => {
    if (!selectedFeedback && filteredFeedbacks.length > 0) {
      setSelectedFeedbackId(filteredFeedbacks[0].id);
    }
  }, [selectedFeedback, filteredFeedbacks]);

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

      const matchesActor =
        logActorFilter === 'ALL' ||
        (logActorFilter === 'ME' && item.actor === adminName) ||
        (logActorFilter === 'SUPER' && item.actorRole === '슈퍼 관리자') ||
        (logActorFilter === 'ADMIN' && item.actorRole === '일반 관리자');

      const matchesPeriod = matchesLogPeriod(item.createdAt, logPeriodFilter);

      return matchesKeyword && matchesCategory && matchesActor && matchesPeriod;
    });
  }, [logs, logKeyword, logCategoryFilter, logActorFilter, logPeriodFilter, adminName]);

  const allVisibleSelected =
    filteredUsers.length > 0 && filteredUsers.every((item) => selectedUserIds.includes(item.id));

  const selectedCount = selectedUserIds.length;

  const canManageRole = useCallback(
    (targetUser) => {
      const isSelf = normalizeText(targetUser?.email) === normalizeText(user?.email);
      return currentAdminIsSuper && !isSelf;
    },
    [currentAdminIsSuper, user]
  );

  const canManageStatus = useCallback(
    (targetUser) => {
      const isSelf = normalizeText(targetUser?.email) === normalizeText(user?.email);
      if (isSelf) return false;
      if (currentAdminIsSuper) return true;
      return targetUser.role === 'USER';
    },
    [currentAdminIsSuper, user]
  );

  const handleRefreshRealtime = () => {
    setLiveUserSeries((prev) => mutateSeries(prev, 2, 6, 90));
    setLiveCounselSeries((prev) => mutateSeries(prev, 3, 9, 40));
    pushAdminLog(
      '대시보드',
      '실시간 지표 새로고침',
      '운영 대시보드',
      '사용자 증가 추이 및 상담 건수 지표를 수동 새로고침했습니다.',
      ['실시간 통계']
    );
  };

  const handleToggleUserSelect = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !filteredUsers.some((u) => u.id === id)));
      return;
    }

    setSelectedUserIds((prev) => {
      const merged = new Set([...prev, ...filteredUsers.map((item) => item.id)]);
      return Array.from(merged);
    });
  };

  const handleBulkStatus = (nextStatus) => {
    const manageableIds = filteredUsers
      .filter((item) => selectedUserIds.includes(item.id))
      .filter((item) => canManageStatus(item))
      .map((item) => item.id);

    if (manageableIds.length === 0) return;

    setUsers((prev) =>
      prev.map((item) =>
        manageableIds.includes(item.id) ? { ...item, status: nextStatus } : item
      )
    );

    pushAdminLog(
      '사용자 관리',
      '일괄 상태 변경',
      `${manageableIds.length}명 사용자`,
      `선택한 사용자 ${manageableIds.length}명의 상태를 ${getStatusLabel(nextStatus)}(으)로 변경했습니다.`,
      ['일괄 작업', nextStatus]
    );

    setSelectedUserIds([]);
  };

  const handleBulkRole = (nextRole) => {
    if (!currentAdminIsSuper) return;

    const manageableIds = filteredUsers
      .filter((item) => selectedUserIds.includes(item.id))
      .filter((item) => canManageRole(item))
      .map((item) => item.id);

    if (manageableIds.length === 0) return;

    setUsers((prev) =>
      prev.map((item) => (manageableIds.includes(item.id) ? { ...item, role: nextRole } : item))
    );

    pushAdminLog(
      '권한 관리',
      '일괄 권한 변경',
      `${manageableIds.length}명 사용자`,
      `선택한 사용자 ${manageableIds.length}명의 권한을 ${getRoleLabel(nextRole)}(으)로 변경했습니다.`,
      ['권한 변경', nextRole]
    );

    setSelectedUserIds([]);
  };

  const handleUserStatusChange = (targetId, nextStatus) => {
    const target = users.find((item) => item.id === targetId);
    if (!target || !canManageStatus(target) || target.status === nextStatus) return;

    setUsers((prev) =>
      prev.map((item) => (item.id === targetId ? { ...item, status: nextStatus } : item))
    );

    pushAdminLog(
      '사용자 관리',
      '사용자 상태 변경',
      target.nickname,
      `${target.nickname} 사용자의 상태를 ${getStatusLabel(nextStatus)}(으)로 변경했습니다.`,
      ['상태 변경', nextStatus]
    );
  };

  const handleUserRoleChange = (targetId, nextRole) => {
    const target = users.find((item) => item.id === targetId);
    if (!target || !canManageRole(target) || target.role === nextRole) return;

    setUsers((prev) =>
      prev.map((item) => (item.id === targetId ? { ...item, role: nextRole } : item))
    );

    pushAdminLog(
      '권한 관리',
      '사용자 권한 변경',
      target.nickname,
      `${target.nickname} 사용자의 권한을 ${getRoleLabel(nextRole)}(으)로 변경했습니다.`,
      ['권한 변경', nextRole]
    );
  };

  const handleFeedbackStatusChange = (feedbackId, nextStatus) => {
    const target = feedbacks.find((item) => item.id === feedbackId);
    if (!target || target.status === nextStatus) return;

    setFeedbacks((prev) =>
      prev.map((item) => (item.id === feedbackId ? { ...item, status: nextStatus } : item))
    );

    pushAdminLog(
      '피드백 관리',
      '피드백 상태 변경',
      `티켓 #${feedbackId}`,
      `피드백 "${target.title}"의 상태를 ${getFeedbackStatusLabel(nextStatus)}(으)로 변경했습니다.`,
      ['피드백', nextStatus]
    );
  };

  const userLine = useMemo(() => buildLineGeometry(liveUserSeries), [liveUserSeries]);
  const counselLine = useMemo(() => buildLineGeometry(liveCounselSeries), [liveCounselSeries]);

  if (authLoading) {
    return (
      <div className="matey-admin-v2 matey-admin-v2--state">
        <div className="matey-admin-v2__state-card">
          <div className="matey-admin-v2__spinner" />
          <h2>관리자 정보를 확인하고 있어요</h2>
          <p>권한 및 운영 데이터를 불러오는 중입니다. 잠시만 기다려 주세요.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminUser(user)) {
    return (
      <div className="matey-admin-v2 matey-admin-v2--state">
        <div className="matey-admin-v2__state-card">
          <h2>접근 권한이 없어요</h2>
          <p>
            이 페이지는 관리자 전용 대시보드입니다.
            <br />
            일반 사용자는 마이페이지에서 개인 정보와 상담 이력을 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="matey-admin-v2">
      <section className="matey-admin-v2__hero">
        <div className="matey-admin-v2__hero-copy">
          <span className="matey-admin-v2__eyebrow">ADMIN CONTROL CENTER</span>
          <h1>메이티 관리자 대시보드</h1>
          <p>
            실시간 운영 지표, 사용자 관리, 권한 제어, 피드백 처리, 활동 로그를 한 화면에서
            관리할 수 있도록 정리한 운영 콘솔입니다. 슈퍼 관리자와 일반 관리자의 역할을
            분리해 운영 안정성을 높이고, 주요 변경 내역을 투명하게 기록합니다.
          </p>

          <div className="matey-admin-v2__hero-actions">
            <button
              type="button"
              className="matey-admin-v2__primary-button"
              onClick={handleRefreshRealtime}
            >
              실시간 지표 새로고침
            </button>
            <button
              type="button"
              className="matey-admin-v2__ghost-button"
              onClick={() => setActiveTab('users')}
            >
              사용자 관리 바로가기
            </button>
            <button
              type="button"
              className="matey-admin-v2__ghost-button"
              onClick={() => setActiveTab('logs')}
            >
              활동 로그 보기
            </button>
          </div>
        </div>

        <div className="matey-admin-v2__hero-side">
          <div className="matey-admin-v2__hero-metric">
            <span>현재 접속 관리자</span>
            <strong>{adminName}</strong>
            <small>
              {getRoleLabel(adminRole)} · 오늘 처리 로그{' '}
              {logs.filter((item) => matchesLogPeriod(item.createdAt, 'TODAY')).length}건
            </small>
          </div>

          <div className="matey-admin-v2__hero-metric">
            <span>실시간 활성 사용자</span>
            <strong>{liveUserSeries[liveUserSeries.length - 1]?.value ?? 0}</strong>
            <small>
              직전 구간 대비 {userCountGrowth >= 0 ? '+' : ''}
              {userCountGrowth}명 변화
            </small>
          </div>

          <div className="matey-admin-v2__hero-metric">
            <span>실시간 상담 건수</span>
            <strong>{liveCounselSeries[liveCounselSeries.length - 1]?.value ?? 0}</strong>
            <small>
              직전 구간 대비 {counselCountGrowth >= 0 ? '+' : ''}
              {counselCountGrowth}건 변화
            </small>
          </div>
        </div>
      </section>

      <div className="matey-admin-v2__tabbar">
        <button
          type="button"
          className={`matey-admin-v2__tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          개요
        </button>
        <button
          type="button"
          className={`matey-admin-v2__tab-btn ${activeTab === 'users' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          사용자 관리
        </button>
        <button
          type="button"
          className={`matey-admin-v2__tab-btn ${activeTab === 'feedback' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          피드백 관리
        </button>
        <button
          type="button"
          className={`matey-admin-v2__tab-btn ${activeTab === 'logs' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          활동 로그
        </button>
      </div>

      <section className="matey-admin-v2__summary-grid">
        <article className="matey-admin-v2__summary-card accent-violet">
          <span>전체 사용자</span>
          <strong>{stats.totalUsers}</strong>
          <p>현재 등록된 전체 사용자 및 관리자 계정 수</p>
        </article>

        <article className="matey-admin-v2__summary-card accent-blue">
          <span>활성 사용자</span>
          <strong>{stats.activeUsers}</strong>
          <p>오늘 기준 정상 이용 가능한 계정 수</p>
        </article>

        <article className="matey-admin-v2__summary-card accent-orange">
          <span>대기 중 피드백</span>
          <strong>{stats.pendingFeedbacks}</strong>
          <p>우선 처리해야 할 신규 피드백 티켓 수</p>
        </article>

        <article className="matey-admin-v2__summary-card accent-mint">
          <span>관리자 권한 계정</span>
          <strong>{stats.superAdmins + stats.adminUsers}</strong>
          <p>
            슈퍼 관리자 {stats.superAdmins}명 · 일반 관리자 {stats.adminUsers}명
          </p>
        </article>
      </section>

      <div className="matey-admin-v2__content-grid">
        {activeTab === 'overview' && (
          <div className="matey-admin-v2__section-stack">
            <section className="matey-admin-v2__panel">
              <div className="matey-admin-v2__panel-head">
                <div>
                  <span className="matey-admin-v2__section-kicker">REALTIME ANALYTICS</span>
                  <h2>실시간 운영 통계</h2>
                  <p className="matey-admin-v2__panel-sub">
                    사용자 증가 추이, 상담 건수, 감정 분포, 주제 분포를 실시간으로 확인할 수
                    있습니다.
                  </p>
                </div>
              </div>

              <div className="matey-admin-v2__chart-grid">
                <article className="matey-admin-v2__chart-card">
                  <div className="matey-admin-v2__chart-head">
                    <div>
                      <h3>사용자 증가 추이</h3>
                      <p>최근 구간별 활성 사용자 변화</p>
                    </div>
                    <strong>{liveUserSeries[liveUserSeries.length - 1]?.value ?? 0}</strong>
                  </div>

                  <div className="matey-admin-v2__line-chart">
                    <svg
                      className="matey-admin-v2__line-svg"
                      viewBox="0 0 620 220"
                      preserveAspectRatio="none"
                    >
                      <path className="matey-admin-v2__line-area" d={userLine.areaPath} />
                      <path className="matey-admin-v2__line-stroke" d={userLine.linePath} />
                      {userLine.points.map((point, index) => (
                        <circle
                          key={`user-point-${index}`}
                          className="matey-admin-v2__line-dot"
                          cx={point.x}
                          cy={point.y}
                          r="4.5"
                        />
                      ))}
                    </svg>
                  </div>

                  <div className="matey-admin-v2__chart-labels">
                    {liveUserSeries.map((item, index) => (
                      <span key={`user-label-${index}`}>{item.label}</span>
                    ))}
                  </div>
                </article>

                <article className="matey-admin-v2__chart-card">
                  <div className="matey-admin-v2__chart-head">
                    <div>
                      <h3>상담 건수 추이</h3>
                      <p>최근 구간별 상담 세션 처리량</p>
                    </div>
                    <strong>{liveCounselSeries[liveCounselSeries.length - 1]?.value ?? 0}</strong>
                  </div>

                  <div className="matey-admin-v2__line-chart">
                    <svg
                      className="matey-admin-v2__line-svg"
                      viewBox="0 0 620 220"
                      preserveAspectRatio="none"
                    >
                      <path
                        className="matey-admin-v2__line-area matey-admin-v2__line-area--blue"
                        d={counselLine.areaPath}
                      />
                      <path
                        className="matey-admin-v2__line-stroke matey-admin-v2__line-stroke--blue"
                        d={counselLine.linePath}
                      />
                      {counselLine.points.map((point, index) => (
                        <circle
                          key={`counsel-point-${index}`}
                          className="matey-admin-v2__line-dot matey-admin-v2__line-dot--blue"
                          cx={point.x}
                          cy={point.y}
                          r="4.5"
                        />
                      ))}
                    </svg>
                  </div>

                  <div className="matey-admin-v2__chart-labels">
                    {liveCounselSeries.map((item, index) => (
                      <span key={`counsel-label-${index}`}>{item.label}</span>
                    ))}
                  </div>
                </article>

                <article className="matey-admin-v2__chart-card">
                  <div className="matey-admin-v2__chart-head">
                    <div>
                      <h3>주요 감정 분포</h3>
                      <p>최근 상담 세션 기준 감정 키워드 집계</p>
                    </div>
                    <strong>
                      {EMOTION_STATS.reduce((max, item) => Math.max(max, item.value), 0)}%
                    </strong>
                  </div>

                  <div className="matey-admin-v2__bar-list">
                    {EMOTION_STATS.map((item) => (
                      <div className="matey-admin-v2__bar-row" key={item.label}>
                        <div className="matey-admin-v2__bar-meta">
                          <span>{item.label}</span>
                          <strong>{item.value}%</strong>
                        </div>
                        <div className="matey-admin-v2__bar-track">
                          <div
                            className={`matey-admin-v2__bar-fill ${item.color}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="matey-admin-v2__chart-card">
                  <div className="matey-admin-v2__chart-head">
                    <div>
                      <h3>상담 주제 분포</h3>
                      <p>최근 상담에서 많이 다뤄진 이슈 비중</p>
                    </div>
                    <strong>
                      {CONCERN_STATS.reduce((max, item) => Math.max(max, item.value), 0)}%
                    </strong>
                  </div>

                  <div className="matey-admin-v2__bar-list">
                    {CONCERN_STATS.map((item) => (
                      <div className="matey-admin-v2__bar-row" key={item.label}>
                        <div className="matey-admin-v2__bar-meta">
                          <span>{item.label}</span>
                          <strong>{item.value}%</strong>
                        </div>
                        <div className="matey-admin-v2__bar-track">
                          <div
                            className={`matey-admin-v2__bar-fill ${item.color}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <section className="matey-admin-v2__panel">
              <div className="matey-admin-v2__panel-head">
                <div>
                  <span className="matey-admin-v2__section-kicker">OPERATION INSIGHT</span>
                  <h2>운영 인사이트</h2>
                  <p className="matey-admin-v2__panel-sub">
                    현재 관리자 권한 구조와 운영 품질 관련 핵심 요약입니다.
                  </p>
                </div>
              </div>

              <div className="matey-admin-v2__split-grid">
                <div className="matey-admin-v2__notice">
                  <strong>운영 요약</strong>
                  <div className="matey-admin-v2__divider" />
                  <div className="matey-admin-v2__stat-inline">
                    <span className="matey-admin-v2__stat-chip">
                      <span className="matey-admin-v2__stat-dot is-violet" />
                      슈퍼 관리자 {stats.superAdmins}명
                    </span>
                    <span className="matey-admin-v2__stat-chip">
                      <span className="matey-admin-v2__stat-dot is-blue" />
                      일반 관리자 {stats.adminUsers}명
                    </span>
                    <span className="matey-admin-v2__stat-chip">
                      <span className="matey-admin-v2__stat-dot is-mint" />
                      평균 출석률 {stats.avgAttendance}%
                    </span>
                    <span className="matey-admin-v2__stat-chip">
                      <span className="matey-admin-v2__stat-dot is-pink" />
                      누적 상담 {stats.totalConversations}건
                    </span>
                  </div>

                  <div className="matey-admin-v2__divider" />
                  <p className="matey-admin-v2__muted">
                    슈퍼 관리자는 관리자 권한 변경과 민감한 운영 정책 변경을 담당하고,
                    일반 관리자는 사용자 상태 관리와 피드백 처리 중심으로 업무를 수행하도록
                    설계했습니다.
                  </p>
                </div>

                <div className="matey-admin-v2__notice">
                  <strong>최근 처리 현황</strong>
                  <div className="matey-admin-v2__divider" />
                  <p className="matey-admin-v2__muted">
                    검토 중 피드백 <strong>{stats.reviewFeedbacks}건</strong>, 해결 완료 피드백{' '}
                    <strong>{stats.resolvedFeedbacks}건</strong>, 정지 계정{' '}
                    <strong>{stats.suspendedUsers}건</strong>이 집계되었습니다.
                  </p>
                  <div className="matey-admin-v2__divider" />
                  <p className="matey-admin-v2__muted">
                    우선순위가 높은 피드백과 저출석 사용자를 먼저 검토하면 운영 만족도를 더 빠르게
                    개선할 수 있습니다.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'users' && (
          <section className="matey-admin-v2__panel">
            <div className="matey-admin-v2__panel-head">
              <div>
                <span className="matey-admin-v2__section-kicker">USER MANAGEMENT</span>
                <h2>사용자 검색 · 필터링 · 일괄 작업</h2>
                <p className="matey-admin-v2__panel-sub">
                  사용자 상태, 활동량, 피드백 여부를 기준으로 검색하고 선택한 대상에 대해 일괄
                  작업을 수행할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="matey-admin-v2__toolbar">
              <div className="matey-admin-v2__search-wrap">
                <input
                  type="text"
                  value={userKeyword}
                  onChange={(event) => setUserKeyword(event.target.value)}
                  placeholder="닉네임, 이메일, 전화번호, 태그로 검색"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(event) => setUserRoleFilter(event.target.value)}
              >
                <option value="ALL">전체 권한</option>
                <option value="SUPER_ADMIN">슈퍼 관리자</option>
                <option value="ADMIN">일반 관리자</option>
                <option value="USER">일반 사용자</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(event) => setUserStatusFilter(event.target.value)}
              >
                <option value="ALL">전체 상태</option>
                <option value="ACTIVE">활성</option>
                <option value="SUSPENDED">정지</option>
              </select>

              <select
                value={userExtraFilter}
                onChange={(event) => setUserExtraFilter(event.target.value)}
              >
                <option value="ALL">추가 필터</option>
                <option value="HIGH_ACTIVITY">활동량 높은 사용자</option>
                <option value="HAS_FEEDBACK">피드백 제출 사용자</option>
                <option value="LOW_ATTENDANCE">출석률 낮은 사용자</option>
              </select>
            </div>

            <div className="matey-admin-v2__bulk-bar">
              <div className="matey-admin-v2__bulk-info">
                <label className="matey-admin-v2__checkbox">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleSelectAllVisible}
                  />
                  현재 목록 전체 선택
                </label>
                <strong>선택된 사용자 {selectedCount}명</strong>
              </div>

              <div className="matey-admin-v2__bulk-actions">
                <button
                  type="button"
                  className="matey-admin-v2__mini-btn is-primary-soft"
                  onClick={() => handleBulkStatus('ACTIVE')}
                  disabled={selectedCount === 0}
                >
                  일괄 활성화
                </button>
                <button
                  type="button"
                  className="matey-admin-v2__mini-btn is-danger"
                  onClick={() => handleBulkStatus('SUSPENDED')}
                  disabled={selectedCount === 0}
                >
                  일괄 정지
                </button>
                <button
                  type="button"
                  className="matey-admin-v2__mini-btn"
                  onClick={() => handleBulkRole('ADMIN')}
                  disabled={selectedCount === 0 || !currentAdminIsSuper}
                >
                  일반 관리자 지정
                </button>
                <button
                  type="button"
                  className="matey-admin-v2__mini-btn"
                  onClick={() => handleBulkRole('SUPER_ADMIN')}
                  disabled={selectedCount === 0 || !currentAdminIsSuper}
                >
                  슈퍼 관리자 지정
                </button>
                <button
                  type="button"
                  className="matey-admin-v2__mini-btn"
                  onClick={() => handleBulkRole('USER')}
                  disabled={selectedCount === 0 || !currentAdminIsSuper}
                >
                  일반 사용자 전환
                </button>
              </div>
            </div>

            <div className="matey-admin-v2__table-wrap">
              <table className="matey-admin-v2__table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>선택</th>
                    <th>사용자</th>
                    <th>권한</th>
                    <th>상태</th>
                    <th>가입일</th>
                    <th>최근 로그인</th>
                    <th>상담 수</th>
                    <th>리포트</th>
                    <th>피드백</th>
                    <th>출석률</th>
                    <th>권한 변경</th>
                    <th>상태 변경</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(item.id)}
                          onChange={() => handleToggleUserSelect(item.id)}
                        />
                      </td>

                      <td>
                        <div className="matey-admin-v2__user-cell">
                          <span className="matey-admin-v2__user-avatar">
                            {String(item.nickname || '?').charAt(0)}
                          </span>
                          <div>
                            <strong>{item.nickname}</strong>
                            <small>{item.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`matey-admin-v2__pill ${pillClassForRole(item.role)}`}>
                          {getRoleLabel(item.role)}
                        </span>
                      </td>

                      <td>
                        <span className={`matey-admin-v2__pill ${pillClassForStatus(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>

                      <td className="matey-admin-v2__meta-text">{formatDate(item.joinDate)}</td>
                      <td className="matey-admin-v2__meta-text">{formatDateTime(item.lastLogin)}</td>
                      <td>{item.conversations}건</td>
                      <td>{item.reports}건</td>
                      <td>{item.feedbackCount}건</td>
                      <td>{item.attendance}%</td>

                      <td>
                        <select
                          className="matey-admin-v2__row-select"
                          value={item.role}
                          onChange={(event) =>
                            handleUserRoleChange(item.id, event.target.value)
                          }
                          disabled={!canManageRole(item)}
                        >
                          <option value="SUPER_ADMIN">슈퍼 관리자</option>
                          <option value="ADMIN">일반 관리자</option>
                          <option value="USER">일반 사용자</option>
                        </select>
                      </td>

                      <td>
                        <select
                          className="matey-admin-v2__row-select"
                          value={item.status}
                          onChange={(event) =>
                            handleUserStatusChange(item.id, event.target.value)
                          }
                          disabled={!canManageStatus(item)}
                        >
                          <option value="ACTIVE">활성</option>
                          <option value="SUSPENDED">정지</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={12}>
                        <div className="matey-admin-v2__empty">
                          조건에 맞는 사용자가 없습니다. 검색어 또는 필터를 조정해 주세요.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'feedback' && (
          <section className="matey-admin-v2__panel">
            <div className="matey-admin-v2__panel-head">
              <div>
                <span className="matey-admin-v2__section-kicker">FEEDBACK MANAGEMENT</span>
                <h2>사용자 피드백 관리</h2>
                <p className="matey-admin-v2__panel-sub">
                  우선순위와 처리 상태를 빠르게 파악하고 상세 내용을 확인한 뒤 상태를 갱신할 수
                  있습니다.
                </p>
              </div>

              <select
                value={feedbackStatusFilter}
                onChange={(event) => setFeedbackStatusFilter(event.target.value)}
              >
                <option value="ALL">전체 상태</option>
                <option value="PENDING">대기</option>
                <option value="REVIEW">검토 중</option>
                <option value="RESOLVED">해결 완료</option>
              </select>
            </div>

            <div className="matey-admin-v2__feedback-grid">
              <div className="matey-admin-v2__feedback-list">
                {filteredFeedbacks.map((item) => (
                  <article
                    key={item.id}
                    className={`matey-admin-v2__feedback-card ${
                      selectedFeedbackId === item.id ? 'is-active' : ''
                    }`}
                    onClick={() => setSelectedFeedbackId(item.id)}
                  >
                    <div className="matey-admin-v2__feedback-card-head">
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.userNickname}</p>
                      </div>
                      <span
                        className={`matey-admin-v2__pill ${pillClassForStatus(item.priority)}`}
                      >
                        {getPriorityLabel(item.priority)}
                      </span>
                    </div>

                    <p>{item.content.slice(0, 88)}...</p>

                    <div className="matey-admin-v2__feedback-meta">
                      <span
                        className={`matey-admin-v2__pill ${pillClassForStatus(item.status)}`}
                      >
                        {getFeedbackStatusLabel(item.status)}
                      </span>
                      <span className="matey-admin-v2__pill is-user">{item.category}</span>
                    </div>
                  </article>
                ))}

                {filteredFeedbacks.length === 0 && (
                  <div className="matey-admin-v2__empty">
                    현재 선택한 상태에 해당하는 피드백이 없습니다.
                  </div>
                )}
              </div>

              <div className="matey-admin-v2__feedback-detail">
                {selectedFeedback ? (
                  <>
                    <div className="matey-admin-v2__feedback-detail-head">
                      <div>
                        <h3>{selectedFeedback.title}</h3>
                        <div className="matey-admin-v2__feedback-detail-info">
                          <span className="matey-admin-v2__pill is-user">
                            {selectedFeedback.userNickname}
                          </span>
                          <span className="matey-admin-v2__pill is-user">
                            {selectedFeedback.category}
                          </span>
                          <span
                            className={`matey-admin-v2__pill ${pillClassForStatus(
                              selectedFeedback.priority
                            )}`}
                          >
                            {getPriorityLabel(selectedFeedback.priority)}
                          </span>
                          <span
                            className={`matey-admin-v2__pill ${pillClassForStatus(
                              selectedFeedback.status
                            )}`}
                          >
                            {getFeedbackStatusLabel(selectedFeedback.status)}
                          </span>
                        </div>
                      </div>

                      <div className="matey-admin-v2__meta-text">
                        접수 일시: {formatDateTime(selectedFeedback.createdAt)}
                      </div>
                    </div>

                    <div className="matey-admin-v2__feedback-content">
                      {selectedFeedback.content}
                    </div>

                    <div className="matey-admin-v2__feedback-actions">
                      <button
                        type="button"
                        className="matey-admin-v2__ghost-button"
                        onClick={() =>
                          handleFeedbackStatusChange(selectedFeedback.id, 'PENDING')
                        }
                      >
                        대기
                      </button>
                      <button
                        type="button"
                        className="matey-admin-v2__ghost-button"
                        onClick={() =>
                          handleFeedbackStatusChange(selectedFeedback.id, 'REVIEW')
                        }
                      >
                        검토 중
                      </button>
                      <button
                        type="button"
                        className="matey-admin-v2__primary-button"
                        onClick={() =>
                          handleFeedbackStatusChange(selectedFeedback.id, 'RESOLVED')
                        }
                      >
                        해결 완료
                      </button>
                    </div>

                    <div className="matey-admin-v2__divider" />

                    <div className="matey-admin-v2__notice">
                      <strong>처리 메모 가이드</strong>
                      <div className="matey-admin-v2__divider" />
                      <p className="matey-admin-v2__muted">
                        우선순위가 높은 피드백은 상태를 먼저 <strong>검토 중</strong>으로 전환하고,
                        원인 분석 또는 개선 일정이 확정되면 <strong>해결 완료</strong>로 업데이트하는
                        방식으로 운영하면 좋습니다.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="matey-admin-v2__empty">
                    상세하게 볼 피드백을 선택해 주세요.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'logs' && (
          <section className="matey-admin-v2__panel">
            <div className="matey-admin-v2__panel-head">
              <div>
                <span className="matey-admin-v2__section-kicker">ACTIVITY LOG</span>
                <h2>관리자 활동 로그</h2>
                <p className="matey-admin-v2__panel-sub">
                  누가, 언제, 어떤 작업을 수행했는지 기록하여 운영 이력을 투명하게 관리합니다.
                </p>
              </div>
            </div>

            <div className="matey-admin-v2__log-filter">
              <input
                type="text"
                value={logKeyword}
                onChange={(event) => setLogKeyword(event.target.value)}
                placeholder="작업 내용, 대상, 태그 검색"
              />

              <select
                value={logCategoryFilter}
                onChange={(event) => setLogCategoryFilter(event.target.value)}
              >
                <option value="ALL">전체 카테고리</option>
                <option value="대시보드">대시보드</option>
                <option value="사용자 관리">사용자 관리</option>
                <option value="권한 관리">권한 관리</option>
                <option value="피드백 관리">피드백 관리</option>
              </select>

              <select
                value={logActorFilter}
                onChange={(event) => setLogActorFilter(event.target.value)}
              >
                <option value="ALL">전체 수행자</option>
                <option value="ME">내 작업</option>
                <option value="SUPER">슈퍼 관리자</option>
                <option value="ADMIN">일반 관리자</option>
              </select>

              <select
                value={logPeriodFilter}
                onChange={(event) => setLogPeriodFilter(event.target.value)}
              >
                <option value="ALL">전체 기간</option>
                <option value="TODAY">최근 24시간</option>
                <option value="WEEK">최근 7일</option>
              </select>
            </div>

            <div className="matey-admin-v2__timeline">
              <div className="matey-admin-v2__activity-list">
                {filteredLogs.map((item) => (
                  <article key={item.id} className="matey-admin-v2__activity-item">
                    <div className="matey-admin-v2__activity-content">
                      <div className="matey-admin-v2__activity-top">
                        <strong>
                          {item.actor} · {item.action}
                        </strong>
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>

                      <div className="matey-admin-v2__activity-body">
                        <strong>{item.category}</strong> · 대상: {item.target}
                        <br />
                        {item.detail}
                      </div>

                      <div className="matey-admin-v2__activity-tags">
                        <span className="matey-admin-v2__tag">{item.actorRole}</span>
                        {(item.tags || []).map((tag, index) => (
                          <span key={`${item.id}-tag-${index}`} className="matey-admin-v2__tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}

                {filteredLogs.length === 0 && (
                  <div className="matey-admin-v2__empty">
                    조건에 맞는 활동 로그가 없습니다. 검색어나 필터를 변경해 주세요.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
