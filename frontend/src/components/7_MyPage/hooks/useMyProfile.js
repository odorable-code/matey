import { useCallback, useEffect, useMemo, useState } from 'react';
import * as profileApi from '../services/profileApi';
import * as mappers from '../utils/mappers';

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const safeObject = (value, fallback = {}) => (isObject(value) ? value : fallback);

const parseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const readLocalProfile = () => {
  if (typeof window === 'undefined') return {};

  const candidates = ['myProfile', 'profile', 'user', 'authUser'];

  for (const key of candidates) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    const parsed = parseJson(raw);
    if (isObject(parsed)) return parsed;
  }

  return {};
};

const getApiNamespaces = () => {
  const namespaces = [profileApi];

  if (isObject(profileApi?.default)) {
    namespaces.push(profileApi.default);
  }

  return namespaces.filter(Boolean);
};

const extractProfilePayload = (response) => {
  if (!response) return {};

  if (Array.isArray(response)) {
    return safeObject(response[0], {});
  }

  if (!isObject(response)) {
    return {};
  }

  return safeObject(
    pickFirst(
      response.profile,
      response.data,
      response.result,
      response.user,
      response.member,
      response.payload,
      response
    ),
    {}
  );
};

const applyProfileMapper = (payload) => {
  const candidates = [
    mappers.mapProfile,
    mappers.mapMyProfile,
    mappers.toProfileModel,
    mappers.profileMapper,
    mappers.normalizeProfile,
  ].filter((fn) => typeof fn === 'function');

  if (!candidates.length) return safeObject(payload, {});

  for (const mapper of candidates) {
    try {
      const mapped = mapper(payload);
      if (isObject(mapped) && Object.keys(mapped).length > 0) {
        return mapped;
      }
    } catch (error) {
      /* noop */
    }
  }

  return safeObject(payload, {});
};

const normalizeProfile = (payload) => {
  const raw = safeObject(payload, {});
  const mapped = applyProfileMapper(raw);

  return {
    id: pickFirst(mapped.id, mapped.userId, mapped.memberId, raw.id, raw.userId, ''),
    nickname: pickFirst(
      mapped.nickname,
      mapped.name,
      mapped.displayName,
      mapped.userName,
      mapped.username,
      raw.nickname,
      raw.name,
      raw.displayName,
      raw.userName,
      raw.username,
      ''
    ),
    name: pickFirst(
      mapped.name,
      mapped.nickname,
      mapped.displayName,
      raw.name,
      raw.nickname,
      raw.displayName,
      ''
    ),
    displayName: pickFirst(
      mapped.displayName,
      mapped.nickname,
      mapped.name,
      raw.displayName,
      raw.nickname,
      raw.name,
      ''
    ),
    email: pickFirst(mapped.email, raw.email, ''),
    phone: pickFirst(mapped.phone, mapped.phoneNumber, raw.phone, raw.phoneNumber, ''),
    bio: pickFirst(mapped.bio, mapped.introduction, mapped.description, raw.bio, raw.introduction, ''),
    status: pickFirst(mapped.status, mapped.accountStatus, raw.status, raw.accountStatus, '정상 이용 중'),
    subscriptionName: pickFirst(
      mapped.subscriptionName,
      mapped.membership,
      mapped.planName,
      raw.subscriptionName,
      raw.membership,
      raw.planName,
      'Premium Care'
    ),
    points: pickFirst(mapped.points, mapped.pointBalance, raw.points, raw.pointBalance, 0),
    totalSessions: pickFirst(
      mapped.totalSessions,
      mapped.sessionCount,
      raw.totalSessions,
      raw.sessionCount,
      0
    ),
    lastLogin: pickFirst(mapped.lastLogin, mapped.lastLoginAt, raw.lastLogin, raw.lastLoginAt, ''),
    lastLoginAt: pickFirst(mapped.lastLoginAt, mapped.lastLogin, raw.lastLoginAt, raw.lastLogin, ''),
    updatedAt: pickFirst(mapped.updatedAt, raw.updatedAt, ''),
    settings: safeObject(
      pickFirst(mapped.settings, mapped.preferences, mapped.profileSettings, raw.settings, raw.preferences),
      {}
    ),
    raw: raw,
  };
};

const callProfileApi = async () => {
  const namespaces = getApiNamespaces();
  const methodNames = [
    'getMyProfile',
    'getProfile',
    'fetchMyProfile',
    'fetchProfile',
    'requestMyProfile',
    'requestProfile',
    'loadMyProfile',
    'loadProfile',
  ];

  for (const namespace of namespaces) {
    for (const methodName of methodNames) {
      const fn = namespace?.[methodName];
      if (typeof fn !== 'function') continue;

      const response = await fn();
      const payload = extractProfilePayload(response);

      if (isObject(payload) && Object.keys(payload).length > 0) {
        return payload;
      }
    }
  }

  return {};
};

function useMyProfile(options = {}) {
  const {
    enabled = true,
    autoFetch = true,
    initialData = {},
  } = safeObject(options, {});

  const initialProfile = useMemo(() => {
    const source =
      isObject(initialData) && Object.keys(initialData).length > 0
        ? initialData
        : readLocalProfile();

    return normalizeProfile(source);
  }, [initialData]);

  const [profile, setProfileState] = useState(initialProfile);
  const [loading, setLoading] = useState(Boolean(enabled && autoFetch));
  const [error, setError] = useState('');

  const setProfile = useCallback((nextValue) => {
    setProfileState((prev) => {
      const resolved =
        typeof nextValue === 'function' ? nextValue(prev) : nextValue;

      return normalizeProfile(isObject(resolved) ? resolved : prev);
    });
  }, []);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return normalizeProfile(profile);
    }

    setLoading(true);
    setError('');

    try {
      const remotePayload = await callProfileApi();
      const fallbackPayload =
        isObject(remotePayload) && Object.keys(remotePayload).length > 0
          ? remotePayload
          : readLocalProfile();

      const normalized = normalizeProfile(fallbackPayload);

      setProfileState(normalized);
      setLoading(false);

      return normalized;
    } catch (err) {
      const fallbackProfile = normalizeProfile(readLocalProfile());

      setProfileState((prev) =>
        Object.keys(fallbackProfile.raw || {}).length > 0 ? fallbackProfile : prev
      );
      setError(
        err instanceof Error
          ? err.message
          : '프로필 정보를 불러오는 중 문제가 발생했습니다.'
      );
      setLoading(false);

      return fallbackProfile;
    }
  }, [enabled, profile]);

  useEffect(() => {
    let mounted = true;

    if (!enabled || !autoFetch) {
      setLoading(false);
      return undefined;
    }

    (async () => {
      setLoading(true);
      setError('');

      try {
        const remotePayload = await callProfileApi();
        const fallbackPayload =
          isObject(remotePayload) && Object.keys(remotePayload).length > 0
            ? remotePayload
            : readLocalProfile();

        const normalized = normalizeProfile(fallbackPayload);

        if (!mounted) return;

        setProfileState(normalized);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;

        const fallbackProfile = normalizeProfile(readLocalProfile());

        setProfileState((prev) =>
          Object.keys(fallbackProfile.raw || {}).length > 0 ? fallbackProfile : prev
        );
        setError(
          err instanceof Error
            ? err.message
            : '프로필 정보를 불러오는 중 문제가 발생했습니다.'
        );
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enabled, autoFetch]);

  const updateProfile = useCallback((patch) => {
    setProfileState((prev) => {
      const nextPatch = typeof patch === 'function' ? patch(prev) : patch;
      return normalizeProfile({
        ...safeObject(prev.raw, {}),
        ...safeObject(prev, {}),
        ...safeObject(nextPatch, {}),
      });
    });
  }, []);

  return {
    profile,
    data: profile,
    user: profile,
    result: profile,
    loading,
    error,
    setProfile,
    updateProfile,
    refetch,
  };
}

export default useMyProfile;
