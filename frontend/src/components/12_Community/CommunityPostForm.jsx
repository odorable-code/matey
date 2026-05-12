import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../contexts/AuthContext';
import { communityAPI } from 'utils/api';
import { canSelectCategoryForWriting } from 'utils/communityWriteAccess';
import styles from './CommunityPage.module.css';

function resolveUserId(user) {
  if (!user) return null;
  return user.userId ?? user.id ?? user.user_id ?? null;
}

function categoryOptionSuffix(c) {
  return '';
}

/** CATEGORY.notification — 0 이면 공지·이벤트 슬롯 */
function isNoticeSlotCategory(c) {
  const n = c?.notification;
  if (n === null || n === undefined) return false;
  return n === 0 || n === '0';
}

// Quill size whitelist (numeric)
const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = ['12px', '14px', '16px', '18px', '20px', '24px', '28px'];
Quill.register(SizeStyle, true);

const QUILL_MODULES = {
  toolbar: [
    // 1줄: 폰트/크기 + 강조 + 글자색/배경색 (화면이 좁아도 색상은 항상 보이게)
    [{ font: [] }, { size: SizeStyle.whitelist }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    // 2줄: 정렬/목록/링크
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'clean'],
  ],
};

const QUILL_FORMATS = [
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'indent',
  'align',
  'link',
];

// Quill font whitelist (site-friendly)
const Font = Quill.import('formats/font');
Font.whitelist = ['system', 'pretendard', 'noto', 'nanum', 'serif', 'mono'];
Quill.register(Font, true);

function CommunityPostForm() {
  const { postId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, authLoading } = useAuth();
  const isEdit = Boolean(postId);

  const writeMode = location?.state?.writeMode || '';
  const fromPath = location?.state?.fromPath || '';
  const isNoticeEventWrite = writeMode === 'NOTICE_EVENT' && !isEdit;
  const backPath = isNoticeEventWrite ? '/community/notices' : '/community';

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryLoadHint, setCategoryLoadHint] = useState('');

  const myId = useMemo(() => resolveUserId(user), [user]);

  const categoryOptions = useMemo(() => {
    let allowed = (categories || []).filter((c) => canSelectCategoryForWriting(user, c));
    if (isNoticeEventWrite) {
      allowed = allowed.filter((c) => isNoticeSlotCategory(c));
    } else {
      // 커뮤니티 글쓰기는 공지/이벤트(notification=0)를 숨김 (공지에서만 작성 가능)
      allowed = allowed.filter((c) => !isNoticeSlotCategory(c));
    }
    if (isEdit && categoryId) {
      const cur = (categories || []).find((c) => String(c.categoryId) === String(categoryId));
      if (cur && !allowed.some((c) => String(c.categoryId) === String(categoryId))) {
        return [...allowed, cur];
      }
    }
    return allowed;
  }, [categories, user, isEdit, categoryId, isNoticeEventWrite]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCategoryLoadHint('');
      try {
        const list = await communityAPI.getCategories();
        const arr = Array.isArray(list) ? list : [];
        if (!cancelled) {
          setCategories(arr);
          if (arr.length === 0) {
            setCategoryLoadHint(
              '서버가 카테고리 0건을 돌려줬어요. Workbench 등에 넣은 DB 이름이 spring.datasource.jdbc-url 과 같은지, 다른 스키마에 넣지 않았는지 확인해 주세요. 서버 로그에 getCategories 오류가 있으면 CATEGORY 테이블·권한을 봐 주세요.'
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          setCategories([]);
          setCategoryLoadHint(
            e?.message || '카테고리를 불러오지 못했어요. 서버 주소와 로그인 상태를 확인해 주세요.'
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      const fallbackFrom =
        isEdit ? `/community/posts/${postId}/edit` : (fromPath || (isNoticeEventWrite ? '/community/notices' : '/community/write'));
      navigate('/login', { state: { from: fallbackFrom } });
    }
  }, [authLoading, isAuthenticated, isEdit, navigate, postId, fromPath, isNoticeEventWrite]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await communityAPI.getPostDetail(postId);
        const p = data?.post;
        if (!p) {
          if (!cancelled) setError('글을 찾을 수 없어요.');
          return;
        }
        if (myId != null && Number(p.userId) !== Number(myId)) {
          if (!cancelled) setError('본인이 작성한 글만 수정할 수 있어요.');
          return;
        }
        if (!cancelled) {
          setTitle(p.title || '');
          setContent(p.content || '');
          setCategoryId(p.categoryId != null ? String(p.categoryId) : '');
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || '불러오지 못했어요.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, myId, postId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) return;
    setError('');
    const tid = title.trim();
    const body = String(content || '').trim();
    if (!tid || !body) {
      setError('제목과 내용을 모두 입력해 주세요.');
      return;
    }
    if (!categoryId) {
      setError('카테고리를 선택해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: tid,
        content: body,
        categoryId: Number(categoryId),
      };
      if (isEdit) {
        await communityAPI.updatePost(postId, payload);
        navigate(`/community/posts/${postId}`);
      } else {
        const res = await communityAPI.createPost(payload);
        const newId = res?.postId;
        if (newId) {
          navigate(`/community/posts/${newId}`);
        } else {
          navigate('/community');
        }
      }
    } catch (e) {
      setError(e?.message || '저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <p className={styles.hint}>로그인 확인 중…</p>;
  }

  if (loading) {
    return <p className={styles.hint}>불러오는 중이에요…</p>;
  }

  return (
    <div>
      <div className={styles.subPageBar}>
        <Link to={backPath} className={styles.backLink}>
          ← {isNoticeEventWrite ? '공지' : '커뮤니티'}
        </Link>
      </div>
      <div className={styles.rowActions} style={{ marginBottom: 16 }}>
        <Link to={isEdit ? `/community/posts/${postId}` : backPath} className={styles.ghostBtn}>
          취소
        </Link>
      </div>
      <h1 className={styles.pageTitle}>
        {isEdit ? '게시글 수정' : isNoticeEventWrite ? '공지·이벤트 작성' : '게시글 작성'}
      </h1>
      <p className={styles.pageSubtitle} style={{ marginBottom: 20 }}>
        {isNoticeEventWrite
          ? '공지·이벤트 소식을 정확하게 작성해 주세요. 욕설·개인정보 노출·불법 내용은 제재될 수 있어요.'
          : '다른 사용자를 존중하는 마음으로 작성해 주세요. 욕설·개인정보 노출·불법 내용은 제재될 수 있어요.'}
      </p>

      {error ? <p className={styles.errorText}>{error}</p> : null}
      {categoryLoadHint ? <p className={styles.errorText}>{categoryLoadHint}</p> : null}

      <form onSubmit={handleSubmit}>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="comm-cat">
            카테고리
          </label>
          <select
            id="comm-cat"
            className={styles.select}
            style={{ width: '100%', maxWidth: 360 }}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">선택</option>
            {categoryOptions.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
                {categoryOptionSuffix(c)}
              </option>
            ))}
          </select>
          {!categoryLoadHint &&
          categories.length > 0 &&
          categoryOptions.length === 0 ? (
            <p className={styles.hint} style={{ marginTop: 8 }}>
              {isNoticeEventWrite
                ? '이 계정으로 선택할 수 있는 공지·이벤트 카테고리가 없어요. 운영 권한과 CATEGORY.notification 값을 확인해 주세요.'
                : '일반 회원이 쓸 수 있는 카테고리가 없어요. 공지·이벤트만 남았거나 권한이 맞지 않을 수 있어요.'}
            </p>
          ) : null}
        </div>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="comm-title">
            제목
          </label>
          <input
            id="comm-title"
            className={styles.input}
            style={{ width: '100%', display: 'block' }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="comm-body">
            내용
          </label>
          <div className={styles.richEditor}>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              placeholder="내용을 입력해 주세요."
            />
          </div>
        </div>
        <div className={styles.rowActions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? '저장 중…' : isEdit ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommunityPostForm;
