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
 * - 상담봇  : BOT (상담봇 관리 탭에서 목록만 — 개요에서 인기·감정 카드는 제거)
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) ROLE_LABELS / STATUS_* : 라벨 표시 코드
 * 2) handleUser*            : 사용자 권한/상태 변경 로직
 * 3) handleSupport*         : 문의/신고 처리 로직
 * =========================================================
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI, communityAPI, getStoredToken } from 'utils/api';
import { displaySupportTicketTitle } from 'utils/supportReportDisplay';
import { getDefaultCardStatsForMateKey, resolveMateDisplayName } from '../../constants/mates';
import './AdminPage.css';

/* =========================================================
   상수 / 라벨 매핑 코드
========================================================= */
const ADMIN_LOG_STORAGE_KEY = 'matey_admin_activity_logs_v4';
const VALID_ADMIN_TABS = new Set(['overview', 'users', 'supports', 'bots', 'logs']);

/** 목록·카드 제목: DB display_name → 알려진 키면 한글 기본명 → 그 외 name */
function adminBotListDisplayTitle(bot) {
  const id = bot?.botId ?? bot?.bot_id;
  const fromApi = String(bot?.displayName ?? bot?.display_name ?? '').trim();
  if (fromApi) return fromApi;
  return resolveMateDisplayName(bot?.name ?? '', id) || String(bot?.name ?? '').trim() || '상담봇';
}

/** 상담봇 관리 카드용 프로필 이미지 (API avatarImage 우선, 없으면 name 기반 public 경로) */
function resolveAdminBotAvatarUrl(bot) {
  const raw = String(bot?.avatarImage ?? bot?.avatar_image ?? '').trim();
  if (raw) {
    if (raw.startsWith('data:')) return raw;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  const key = String(bot?.name ?? '').trim().toLowerCase();
  const byKey = {
    dog: '/images/mascots/dog/dog.png',
    bear: '/images/mascots/bear/bear.png',
    cat: '/images/mascots/cat/cat.png',
  };
  return byKey[key] || '/images/mascots/dog/dog.png';
}

const ADMIN_BOT_MASCOT_NAMES = new Set(['dog', 'bear', 'cat']);

const ADMIN_BOT_FORM_NEUTRAL_PREVIEW = '/images/mypage/bot/matey-base.png';

/** 봇 수정 폼 기본 능력치 라벨 */
const DEFAULT_ADMIN_CARD_STATS_TEMPLATE = [
  { label: '공감력', value: 80 },
  { label: '친근함', value: 80 },
  { label: '분석력', value: 80 },
  { label: '명확함', value: 80 },
];

function parseCardStatsJsonFromAdminApi(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  try {
    const arr = JSON.parse(s);
    if (!Array.isArray(arr)) return null;
    const out = [];
    for (const x of arr.slice(0, 8)) {
      if (!x || typeof x !== 'object') continue;
      const label = String(x.label ?? '').trim();
      let v = Number(x.value);
      if (!label || !Number.isFinite(v)) continue;
      v = Math.max(0, Math.min(100, Math.round(v)));
      out.push({ label: label.slice(0, 30), value: v });
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

/** 상담봇 카드 미리보기용 능력치 — DB JSON 우선, 없으면 dog/bear 등 기본 상수 */
function getAdminBotCardStatsPreview(bot) {
  const fromDb = parseCardStatsJsonFromAdminApi(bot?.cardStatsJson ?? bot?.card_stats_json);
  if (fromDb && fromDb.length) return fromDb.slice(0, 8);
  const fb = getDefaultCardStatsForMateKey(String(bot?.name ?? '').trim());
  if (fb.length) return fb.slice(0, 4);
  return normalizeAdminBotCardStats(DEFAULT_ADMIN_CARD_STATS_TEMPLATE);
}

/** 상담봇 수정 폼: 능력치 4슬롯 — 항목명은 고정, 수치만 편집 */
function normalizeAdminBotCardStats(source) {
  const labels = ['공감력', '친근함', '분석력', '명확함'];
  const base = Array.isArray(source) && source.length ? source : DEFAULT_ADMIN_CARD_STATS_TEMPLATE;
  const out = [];
  for (let i = 0; i < 4; i++) {
    const x = base[i] || {};
    let v = Number(x.value);
    if (!Number.isFinite(v)) v = 80;
    v = Math.max(0, Math.min(100, Math.round(v)));
    out.push({ label: labels[i], value: v });
  }
  return out;
}

/**
 * 상담봇 카드 나열 순서: 강이·곰이·냥이(bot.name) 우선,
 * 냥이 카드 바로 다음에「봇 추가」슬롯, 나머지는 bot_id 오름차순.
 */
function buildAdminBotCarouselItems(botList) {
  const list = Array.isArray(botList) ? [...botList] : [];
  const idOf = (b) => Number(b?.botId ?? b?.bot_id);
  const nameOf = (b) => String(b?.name ?? '').trim().toLowerCase();
  const byKey = new Map();
  for (const b of list) {
    const k = nameOf(b);
    if (k) byKey.set(k, b);
  }
  const primaryKeys = ['dog', 'bear', 'cat'];
  const primary = [];
  const used = new Set();
  for (const key of primaryKeys) {
    const b = byKey.get(key);
    if (b) {
      primary.push(b);
      used.add(idOf(b));
    }
  }
  const rest = list
    .filter((b) => !used.has(idOf(b)))
    .sort((a, b) => idOf(a) - idOf(b));

  const items = [];
  let addAfterCat = false;
  for (const b of primary) {
    items.push({ kind: 'bot', bot: b });
    if (nameOf(b) === 'cat') {
      items.push({ kind: 'add' });
      addAfterCat = true;
    }
  }
  if (!addAfterCat) {
    items.push({ kind: 'add' });
  }
  for (const b of rest) {
    items.push({ kind: 'bot', bot: b });
  }
  return items;
}

/** 상담봇 모달 미리보기: 신규 추가에서 아직 정해지지 않은 상태는 중립 이미지로 표시 */
function resolveBotFormAvatarPreview(form, formMode) {
  const raw = String(form?.avatarImage ?? '').trim();
  if (raw) {
    return resolveAdminBotAvatarUrl(form);
  }
  if (formMode === 'create') {
    const name = String(form?.name ?? '').trim().toLowerCase();
    if (!name || !ADMIN_BOT_MASCOT_NAMES.has(name)) {
      return ADMIN_BOT_FORM_NEUTRAL_PREVIEW;
    }
  }
  return resolveAdminBotAvatarUrl(form);
}

/** 상담봇 아바타: 파일 → JPEG data URL (DB·서버 clamp 길이 이하). */
function compressImageFileToDataUrl(file, maxLen = 7800) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrlIn = fr.result;
      if (typeof dataUrlIn !== 'string') {
        reject(new Error('read failed'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;
          if (!iw || !ih) {
            resolve(null);
            return;
          }
          let maxSide = Math.min(512, Math.max(iw, ih));
          for (let attempt = 0; attempt < 32; attempt += 1) {
            let cw = iw >= ih ? maxSide : Math.max(1, Math.round((iw / ih) * maxSide));
            let ch = ih >= iw ? maxSide : Math.max(1, Math.round((ih / iw) * maxSide));
            cw = Math.max(1, cw);
            ch = Math.max(1, ch);
            canvas.width = cw;
            canvas.height = ch;
            ctx.clearRect(0, 0, cw, ch);
            ctx.drawImage(img, 0, 0, cw, ch);
            for (let q = 0.85; q >= 0.1; q -= 0.05) {
              const out = canvas.toDataURL('image/jpeg', q);
              if (out.length <= maxLen) {
                resolve(out);
                return;
              }
            }
            maxSide = Math.max(24, Math.floor(maxSide * 0.84));
          }
          resolve(null);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('image decode'));
      img.src = dataUrlIn;
    };
    fr.onerror = () => reject(fr.error || new Error('read'));
    fr.readAsDataURL(file);
  });
}

function emptyBotFormState() {
  return {
    name: '',
    displayName: '',
    avatarImage: '',
    description: '',
    selectionPreview: '',
    cardStats: normalizeAdminBotCardStats(DEFAULT_ADMIN_CARD_STATS_TEMPLATE),
  };
}

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
    assigned_bot_name: (() => {
      const s = String(raw.assignedBotName ?? raw.assigned_bot_name ?? '').trim();
      if (!s) return '';
      return resolveMateDisplayName(s, null) || s;
    })(),
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
  /** 상담봇 탭 API 메타(집계 기간 라벨 등) */
  const [botStatsMeta, setBotStatsMeta] = useState(null);
  const [botsLoading, setBotsLoading] = useState(false);
  const botCarouselItems = useMemo(() => buildAdminBotCarouselItems(bots), [bots]);
  const [logs, setLogs] = useState([]);
  const [dbOverview, setDbOverview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** 일부 API만 실패했을 때(데이터는 일부 표시) 상단 안내 */
  const [loadWarning, setLoadWarning] = useState(null);

  /** 커뮤니티 고민 스포트라이트 (관리자 추첨 + 운영 답변 공개) */
  const [worrySpotlightDraft, setWorrySpotlightDraft] = useState(null);
  const [worrySpotlightAnswer, setWorrySpotlightAnswer] = useState('');
  const [worrySpotlightBusy, setWorrySpotlightBusy] = useState(false);
  const [worrySpotlightPublished, setWorrySpotlightPublished] = useState(null);

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

  const [botFormOpen, setBotFormOpen] = useState(false);
  const [botFormMode, setBotFormMode] = useState('create');
  const [botFormBotId, setBotFormBotId] = useState(null);
  const [botForm, setBotForm] = useState(() => emptyBotFormState());
  const [botFormSaving, setBotFormSaving] = useState(false);
  const botAvatarFileInputRef = useRef(null);
  const [botAvatarCompressing, setBotAvatarCompressing] = useState(false);
  const botFormTitleId = useId();

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

  const openBotFormCreate = useCallback(() => {
    setBotFormMode('create');
    setBotFormBotId(null);
    setBotForm(emptyBotFormState());
    setBotFormOpen(true);
  }, []);

  const openBotFormEdit = useCallback((bot) => {
    const id = bot?.botId ?? bot?.bot_id;
    if (id == null || Number.isNaN(Number(id))) return;
    setBotFormMode('edit');
    setBotFormBotId(Number(id));
    const rawJson = bot?.cardStatsJson ?? bot?.card_stats_json ?? '';
    const parsed = parseCardStatsJsonFromAdminApi(rawJson);
    const fromMate = getDefaultCardStatsForMateKey(bot?.name);
    const merged = parsed && parsed.length ? parsed : fromMate.length ? fromMate : null;
    setBotForm({
      name: String(bot?.name ?? ''),
      displayName: String(bot?.displayName ?? bot?.display_name ?? ''),
      avatarImage: String(bot?.avatarImage ?? bot?.avatar_image ?? ''),
      description: String(bot?.description ?? ''),
      selectionPreview: String(bot?.selectionPreview ?? bot?.selection_preview ?? ''),
      cardStats: normalizeAdminBotCardStats(merged),
    });
    setBotFormOpen(true);
  }, []);

  const closeBotForm = useCallback(() => {
    if (botFormSaving) return;
    setBotFormOpen(false);
  }, [botFormSaving]);

  const handleBotAvatarFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) {
      window.alert('이미지 파일만 선택할 수 있어요.');
      return;
    }
    setBotAvatarCompressing(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 7800);
      if (!dataUrl) {
        window.alert(
          '이미지를 저장할 수 있을 만큼 줄이지 못했어요. 다른 사진을 선택해 주세요.'
        );
        return;
      }
      setBotForm((p) => ({ ...p, avatarImage: dataUrl }));
    } catch (err) {
      console.error(err);
      window.alert('이미지를 불러오지 못했어요.');
    } finally {
      setBotAvatarCompressing(false);
    }
  }, []);

  const handleBotAvatarClear = useCallback(() => {
    setBotForm((p) => ({ ...p, avatarImage: '' }));
  }, []);

  const handleBotFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const name = String(botForm.name || '').trim();
      if (!name) {
        window.alert('시스템 키(영문 식별자)를 입력해 주세요. 예: dog, bear');
        return;
      }
      setBotFormSaving(true);
      try {
        const payload = {
          name,
          displayName: String(botForm.displayName || '').trim() || undefined,
          avatarImage: String(botForm.avatarImage || '').trim() || undefined,
          description: String(botForm.description || '').trim() || undefined,
          selectionPreview: String(botForm.selectionPreview || '').trim() || undefined,
          cardStatsJson: JSON.stringify(normalizeAdminBotCardStats(botForm.cardStats)),
        };
        if (botFormMode === 'create') {
          await adminAPI.createBot(payload);
          pushAdminLog('상담봇', '등록', payload.displayName || name, 'BOT 테이블에 신규 행을 추가했습니다.', ['bot']);
        } else {
          await adminAPI.updateBot(botFormBotId, payload);
          pushAdminLog('상담봇', '수정', String(botFormBotId), payload.displayName || name, ['bot']);
        }
        setBotFormOpen(false);
        setBotsLoading(true);
        try {
          const data = await adminAPI.getBotStats();
          setBots(Array.isArray(data?.bots) ? data.bots : []);
          setBotStatsMeta({ periodLabel: data?.periodLabel ?? '' });
        } catch (err) {
          console.error('상담봇 통계 재로드 실패:', err);
        } finally {
          setBotsLoading(false);
        }
      } catch (err) {
        window.alert(err?.message || '처리에 실패했어요.');
      } finally {
        setBotFormSaving(false);
      }
    },
    [botForm, botFormMode, botFormBotId, pushAdminLog]
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

  useEffect(() => {
    if (activeTab !== 'overview') return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await communityAPI.getWorryFeatured();
        if (!cancelled) setWorrySpotlightPublished(res?.spotlight ?? null);
      } catch {
        if (!cancelled) setWorrySpotlightPublished(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'bots' || !isAuthenticated || authLoading) return undefined;
    let cancelled = false;
    (async () => {
      setBotsLoading(true);
      try {
        const data = await adminAPI.getBotStats();
        if (cancelled) return;
        const list = Array.isArray(data?.bots) ? data.bots : [];
        setBots(list);
        setBotStatsMeta({
          periodLabel: data?.periodLabel ?? '',
        });
      } catch (e) {
        console.error('상담봇 통계 로드 실패:', e);
        if (!cancelled) {
          setBots([]);
          setBotStatsMeta(null);
        }
      } finally {
        if (!cancelled) setBotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isAuthenticated, authLoading]);

  const handleWorrySpotlightDraw = useCallback(async () => {
    setWorrySpotlightBusy(true);
    try {
      const res = await adminAPI.drawWorrySpotlightCandidate();
      const post = res?.post;
      const pid = post?.postId ?? post?.post_id;
      if (pid != null) {
        setWorrySpotlightDraft(post);
        setWorrySpotlightAnswer('');
      } else {
        window.alert(res?.message || '추첨할 고민 글이 없어요.');
      }
    } catch (e) {
      window.alert(e?.message || '추첨에 실패했어요.');
    } finally {
      setWorrySpotlightBusy(false);
    }
  }, []);

  const handleWorrySpotlightPublish = useCallback(async () => {
    const pid = worrySpotlightDraft?.postId ?? worrySpotlightDraft?.post_id;
    if (pid == null) {
      window.alert('먼저 「고민 글 무작위 추첨」으로 글을 골라 주세요.');
      return;
    }
    const ans = worrySpotlightAnswer.trim();
    if (!ans) {
      window.alert('운영 답변을 입력해 주세요.');
      return;
    }
    setWorrySpotlightBusy(true);
    try {
      const res = await adminAPI.publishWorrySpotlight({
        postId: Number(pid),
        answerContent: ans,
      });
      setWorrySpotlightPublished(res?.spotlight ?? null);
      const publishedTitle =
        String(worrySpotlightDraft?.title || res?.spotlight?.post?.title || '').trim() ||
        '(제목 없음)';
      pushAdminLog(
        '커뮤니티',
        '고민 PICK 공개',
        `게시글 #${Number(pid)} · ${publishedTitle}`,
        '커뮤니티 상단 고민 PICK에 게시글과 운영 답변을 공개했습니다.',
        ['고민 PICK', '커뮤니티']
      );
      setWorrySpotlightDraft(null);
      setWorrySpotlightAnswer('');
      window.alert('커뮤니티 상단에 공개했어요.');
    } catch (e) {
      window.alert(e?.message || '저장에 실패했어요.');
    } finally {
      setWorrySpotlightBusy(false);
    }
  }, [worrySpotlightAnswer, worrySpotlightDraft, pushAdminLog]);

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
    };
  }, [users, supports]);

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

      const reasonKey =
        String(supportDetail?.reasonType ?? supportDetail?.reason_type ?? '')
          .toUpperCase() === 'REPORT'
          ? 'REPORT'
          : 'INQUIRY';
      const reasonLabel = REASON_TYPE_LABELS[reasonKey] || '문의';
      const titleShown =
        displaySupportTicketTitle(String(supportDetail?.title || '').trim()) ||
        '(제목 없음)';
      pushAdminLog(
        '문의·신고 관리',
        wasEdit ? '답변 수정' : '답변 등록',
        `#${ticketId} · ${titleShown}`,
        `${reasonLabel} 티켓에 ${wasEdit ? '답변을 수정' : '답변을 등록'}했습니다.`,
        [reasonLabel, wasEdit ? '답변 수정' : '답변 등록']
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

      const titleShown =
        displaySupportTicketTitle(String(target.title || '').trim()) || '(제목 없음)';
      pushAdminLog(
        '문의·신고 관리',
        `${REASON_TYPE_LABELS[target.reason_type]} 상태 변경`,
        `#${supportId} · ${titleShown}`,
        `${REASON_TYPE_LABELS[target.reason_type]} 티켓 상태를 ${SUPPORT_STATUS_LABELS[nextStatus]}(으)로 변경했습니다.`,
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
    const ok = window.confirm(
      '저장된 활동 로그를 모두 삭제할까요?\n이 작업은 되돌릴 수 없어요.'
    );
    if (!ok) return;
    setLogs([]);
    saveLogs([]);
  };

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
      {botFormOpen ? (
        <div
          className="matey-admin-v3__modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeBotForm();
          }}
        >
          <div
            className="matey-admin-v3__modal matey-admin-v3__modal--bot-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby={botFormTitleId}
          >
            <div className="matey-admin-v3__modal-head">
              <div>
                <p className="matey-admin-v3__modal-eyebrow">BOT</p>
                <h2 id={botFormTitleId} className="matey-admin-v3__modal-title">
                  {botFormMode === 'create' ? '상담봇 추가' : '상담봇 수정'}
                </h2>
              </div>
              <button
                type="button"
                className="matey-admin-v3__modal-close"
                onClick={closeBotForm}
                disabled={botFormSaving}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <form className="matey-admin-v3__bot-form" onSubmit={handleBotFormSubmit}>
              <label className="matey-admin-v3__bot-form-field">
                <span className="matey-admin-v3__bot-form-label">시스템 키 (영문)</span>
                <input
                  type="text"
                  className="matey-admin-v3__bot-form-input"
                  value={botForm.name}
                  onChange={(e) => setBotForm((p) => ({ ...p, name: e.target.value }))}
                  maxLength={50}
                  autoComplete="off"
                  disabled={botFormSaving}
                  required
                  placeholder={botFormMode === 'create' ? '예: dog, bear, cat' : ''}
                />
                <span className="matey-admin-v3__bot-form-hint">
                  채팅·URL 등에서 쓰는 내부 식별자예요. 기본 메이트는 dog / bear / cat 로 맞추면 채팅·마이페이지와 연결돼요. 이후 추가되는 봇은 자유로운 키를 쓸 수 있어요.
                </span>
              </label>
              <label className="matey-admin-v3__bot-form-field">
                <span className="matey-admin-v3__bot-form-label">화면에 보일 이름</span>
                <input
                  type="text"
                  className="matey-admin-v3__bot-form-input"
                  value={botForm.displayName}
                  onChange={(e) => setBotForm((p) => ({ ...p, displayName: e.target.value }))}
                  maxLength={50}
                  autoComplete="off"
                  disabled={botFormSaving}
                  placeholder="예: 강이, 곰이, 냥이"
                />
                <span className="matey-admin-v3__bot-form-hint">
                  관리자 목록·마이페이지 담당봇 선택 등에 보이는 이름이에요. 비우면 dog→강이 처럼 기본 표시명이 들어가요.
                </span>
              </label>
              <label className="matey-admin-v3__bot-form-field">
                <span className="matey-admin-v3__bot-form-label">프로필 이미지</span>
                <div className="matey-admin-v3__bot-avatar-row">
                  <div className="matey-admin-v3__bot-avatar-frame">
                    <img
                      src={resolveBotFormAvatarPreview(botForm, botFormMode)}
                      alt=""
                      decoding="async"
                      onError={(ev) => {
                        ev.currentTarget.onerror = null;
                        ev.currentTarget.src = ADMIN_BOT_FORM_NEUTRAL_PREVIEW;
                      }}
                    />
                  </div>
                  <div className="matey-admin-v3__bot-avatar-actions">
                    <input
                      ref={botAvatarFileInputRef}
                      type="file"
                      accept="image/*"
                      className="matey-admin-v3__visually-hidden"
                      onChange={handleBotAvatarFileChange}
                      disabled={botFormSaving || botAvatarCompressing}
                      aria-label="상담봇 프로필 이미지 파일 선택"
                    />
                    <button
                      type="button"
                      className="matey-admin-v3__primary-button"
                      onClick={() => botAvatarFileInputRef.current?.click()}
                      disabled={botFormSaving || botAvatarCompressing}
                    >
                      {botAvatarCompressing ? '이미지 처리 중…' : '이미지 선택'}
                    </button>
                    <button
                      type="button"
                      className="matey-admin-v3__ghost-button"
                      onClick={handleBotAvatarClear}
                      disabled={botFormSaving || botAvatarCompressing || !String(botForm.avatarImage || '').trim()}
                    >
                      기본 이미지 사용
                    </button>
                    <p className="matey-admin-v3__bot-form-hint matey-admin-v3__bot-avatar-hint">
                      이미지 선택으로 봇 프로필 사진을 넣을 수 있어요.
                    </p>
                  </div>
                </div>
              </label>
              <label className="matey-admin-v3__bot-form-field">
                <span className="matey-admin-v3__bot-form-label">소개 문구 (설명)</span>
                <textarea
                  className="matey-admin-v3__bot-form-textarea"
                  value={botForm.description}
                  onChange={(e) => setBotForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  disabled={botFormSaving}
                  placeholder={
                    botFormMode === 'create'
                      ? '이 봇이 어떤 성격·역할인지 짧게 적어 주세요'
                      : ''
                  }
                />
              </label>
              <label className="matey-admin-v3__bot-form-field">
                <span className="matey-admin-v3__bot-form-label">능력치 (4항목)</span>
                <span className="matey-admin-v3__bot-form-hint">
                  공감력·친근함·분석력·명확함 네 가지는 이름이 고정이에요. 슬라이더로 0~100만 조절하면 돼요.
                </span>
                <div className="matey-admin-v3__bot-card-stat-rows">
                  {normalizeAdminBotCardStats(botForm.cardStats).map((row, idx) => (
                    <div className="matey-admin-v3__bot-card-stat-row" key={`card-stat-${idx}`}>
                      <span className="matey-admin-v3__bot-card-stat-label-fixed" id={`bot-card-stat-lbl-${idx}`}>
                        {row.label}
                      </span>
                      <div className="matey-admin-v3__bot-card-stat-slider-row">
                        <input
                          type="range"
                          className="matey-admin-v3__bot-form-range"
                          min={0}
                          max={100}
                          step={1}
                          value={row.value}
                          onChange={(e) => {
                            const num = Math.max(
                              0,
                              Math.min(100, Math.round(Number(e.target.value)))
                            );
                            setBotForm((p) => {
                              const next = normalizeAdminBotCardStats(p.cardStats);
                              next[idx] = { ...next[idx], value: num };
                              return { ...p, cardStats: next };
                            });
                          }}
                          disabled={botFormSaving}
                          aria-labelledby={`bot-card-stat-lbl-${idx}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={row.value}
                          aria-valuetext={`${row.value}점`}
                        />
                        <span className="matey-admin-v3__bot-card-stat-value" title="현재 수치">
                          {row.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </label>
              <label className="matey-admin-v3__bot-form-field">
                <span className="matey-admin-v3__bot-form-label">선택 화면 한 줄 소개</span>
                <input
                  type="text"
                  className="matey-admin-v3__bot-form-input"
                  value={botForm.selectionPreview}
                  onChange={(e) => setBotForm((p) => ({ ...p, selectionPreview: e.target.value }))}
                  autoComplete="off"
                  disabled={botFormSaving}
                  placeholder={
                    botFormMode === 'create'
                      ? '비워 두면 저장 시 이름·소개에서 한 줄이 자동으로 채워져요'
                      : ''
                  }
                />
              </label>
              <div className="matey-admin-v3__bot-form-actions">
                <button
                  type="button"
                  className="matey-admin-v3__ghost-button"
                  onClick={closeBotForm}
                  disabled={botFormSaving}
                >
                  취소
                </button>
                <button type="submit" className="matey-admin-v3__primary-button" disabled={botFormSaving}>
                  {botFormSaving ? '저장 중…' : '저장'}
                </button>
              </div>
            </form>
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
            사용자 권한, 문의·신고, 커뮤니티 고민 스포트라이트까지 메이티 운영에 필요한 흐름을 한
            화면에서 다룰 수 있어요.
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
                  <span className="matey-admin-v3__section-kicker">COMMUNITY</span>
                  <h2>고민 스포트라이트</h2>
                  <p className="matey-admin-v3__panel-sub">
                    고민 글을 추첨하고 운영 답변을 저장하면 커뮤니티 목록 맨 위에 크게 보여요.
                  </p>
                </div>
                <button
                  type="button"
                  className="matey-admin-v3__ghost-button"
                  disabled={worrySpotlightBusy}
                  onClick={handleWorrySpotlightDraw}
                >
                  고민 글 무작위 추첨
                </button>
              </div>

              {worrySpotlightPublished?.post?.title ? (
                <p className="matey-admin-v3__panel-sub" style={{ marginTop: 0 }}>
                  지금 공개 중인 글:{' '}
                  <strong>{worrySpotlightPublished.post.title}</strong>
                </p>
              ) : (
                <p className="matey-admin-v3__panel-sub" style={{ marginTop: 0 }}>
                  아직 공개된 스포트라이트가 없어요. 추첨 후 답변을 입력하고 공개해 보세요.
                </p>
              )}

              {worrySpotlightDraft ? (
                <div style={{ marginTop: 18 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: '#5b5470' }}>
                    추첨된 고민 글
                  </p>
                  <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900, color: '#2a2238' }}>
                    {worrySpotlightDraft.title}
                  </p>
                  <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.55, color: '#6b6285' }}>
                    {String(worrySpotlightDraft.content || '')
                      .replace(/<[^>]*>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim()
                      .slice(0, 260)}
                    {String(worrySpotlightDraft.content || '').length > 260 ? '…' : ''}
                  </p>
                  <label className="matey-admin-v3__panel-sub" style={{ display: 'block', marginBottom: 8 }}>
                    운영 답변 (전체 회원에게 공개)
                  </label>
                  <textarea
                    className="matey-admin-v3__support-reply-textarea"
                    rows={7}
                    placeholder="따뜻하고 명확한 답변을 남겨 주세요. 글 본문과 함께 커뮤니티 상단에 크게 표시돼요."
                    value={worrySpotlightAnswer}
                    onChange={(e) => setWorrySpotlightAnswer(e.target.value)}
                    disabled={worrySpotlightBusy}
                  />
                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="matey-admin-v3__primary-button"
                      disabled={worrySpotlightBusy}
                      onClick={handleWorrySpotlightPublish}
                    >
                      커뮤니티에 공개하기
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

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
                </article>

                <article className="matey-admin-v3__chart-card">
                  <div className="matey-admin-v3__chart-head">
                    <div>
                      <h3>채팅 세션 추이</h3>
                      <p>활성 세션 수</p>
                    </div>
                    <strong>{chatLast}</strong>
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
                  {botStatsMeta?.periodLabel
                    ? `${botStatsMeta.periodLabel} 동안의 인기 순위와, 그 달에 모인 좋아요·싫어요(이벤트 누적)를 함께 볼 수 있어요. 여기서 저장한 내용은 마이페이지 담당 메이트·채팅 목록에 바로 반영돼요.`
                    : '직전 달 인기 순위와 봇별 좋아요·싫어요(월간 누적)를 확인할 수 있어요. 저장한 설정은 마이페이지와 채팅에서 같은 목록으로 이어져요.'}
                </p>
              </div>
            </div>

            {botsLoading && bots.length === 0 ? (
              <div className="matey-admin-v3__empty">상담봇 통계를 불러오는 중이에요…</div>
            ) : (
              <div className="matey-admin-v3__bot-carousel">
                {bots.length === 0 && !botsLoading ? (
                  <p className="matey-admin-v3__bot-carousel-hint">
                    등록된 상담봇이 없어요. 옆 카드에서 새 봇을 추가할 수 있어요.
                  </p>
                ) : null}
                <div className="matey-admin-v3__bot-carousel-track">
                {botCarouselItems.map((entry) => {
                  if (entry.kind === 'add') {
                    return (
                      <button
                        key="admin-bot-add-card"
                        type="button"
                        className="matey-admin-v3__bot-card matey-admin-v3__bot-card--add"
                        onClick={openBotFormCreate}
                      >
                        <span className="matey-admin-v3__bot-card-add-icon" aria-hidden="true">
                          +
                        </span>
                        <span className="matey-admin-v3__bot-card-add-title">봇 추가</span>
                        <p className="matey-admin-v3__bot-card-add-copy">
                          새 상담봇을 등록하면 메인·채팅·마이페이지 목록에 바로 반영돼요.
                        </p>
                        <span className="matey-admin-v3__bot-card-add-cta">등록하기</span>
                      </button>
                    );
                  }
                  const bot = entry.bot;
                  const abilityRows = getAdminBotCardStatsPreview(bot);
                  return (
                  <article
                    className="matey-admin-v3__bot-card"
                    key={bot.botId ?? bot.bot_id}
                  >
                    <div className="matey-admin-v3__bot-card-head">
                      <img
                        className="matey-admin-v3__bot-avatar"
                        src={resolveAdminBotAvatarUrl(bot)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/mascots/dog/dog.png';
                        }}
                      />
                      <div className="matey-admin-v3__bot-card-head-main">
                        <strong>{adminBotListDisplayTitle(bot)}</strong>
                      </div>
                    </div>

                    <p className="matey-admin-v3__bot-desc">{bot.description}</p>

                    {abilityRows.length > 0 ? (
                      <div className="matey-admin-v3__bot-card-abilities">
                        <p className="matey-admin-v3__bot-section-label">능력치</p>
                        <ul className="matey-admin-v3__bot-card-ability-list">
                          {abilityRows.slice(0, 4).map((row, idx) => (
                            <li key={`${bot.botId ?? bot.bot_id}-ab-${idx}`} className="matey-admin-v3__bot-card-ability-row">
                              <span className="matey-admin-v3__bot-card-ability-label">{row.label}</span>
                              <div className="matey-admin-v3__bot-card-ability-track" aria-hidden>
                                <div
                                  className="matey-admin-v3__bot-card-ability-fill"
                                  style={{ width: `${Math.max(0, Math.min(100, row.value))}%` }}
                                />
                              </div>
                              <span className="matey-admin-v3__bot-card-ability-value">{row.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <p className="matey-admin-v3__bot-section-label">누적 (BOT 테이블)</p>
                    <div className="matey-admin-v3__bot-stat-row matey-admin-v3__bot-stat-row--two">
                      <div className="matey-admin-v3__bot-stat">
                        <span>좋아요</span>
                        <strong>
                          👍{' '}
                          {Number(bot.cumulativeLikeCount ?? bot.cumulative_like_count ?? 0) || 0}
                        </strong>
                      </div>
                      <div className="matey-admin-v3__bot-stat">
                        <span>싫어요</span>
                        <strong>
                          👎{' '}
                          {Number(bot.cumulativeDislikeCount ?? bot.cumulative_dislike_count ?? 0) || 0}
                        </strong>
                      </div>
                    </div>

                    <div className="matey-admin-v3__bot-prev-month">
                      <p className="matey-admin-v3__bot-prev-rank-line">
                        전월 인기순위{' '}
                        <strong>
                          {bot.prevMonthRank != null && Number.isFinite(Number(bot.prevMonthRank))
                            ? `${Number(bot.prevMonthRank)}위`
                            : '—'}
                        </strong>
                      </p>
                      <p className="matey-admin-v3__bot-prev-month-counts">
                        좋아요 <strong>{bot.prevMonthRecommendEvents ?? 0}</strong>개 · 싫어요{' '}
                        <strong>{bot.prevMonthDislikeEvents ?? 0}</strong>개
                      </p>
                    </div>
                    <div className="matey-admin-v3__bot-card-actions">
                      <button
                        type="button"
                        className="matey-admin-v3__ghost-button"
                        onClick={() => openBotFormEdit(bot)}
                      >
                        내용 수정
                      </button>
                    </div>
                  </article>
                  );
                })}
                </div>
              </div>
            )}
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
