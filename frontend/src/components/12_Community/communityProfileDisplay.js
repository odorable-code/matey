export const COMMUNITY_DEFAULT_AVATAR = '/images/mypage/bot/matey-profile.png';

export function resolveCommunityAvatarUrl(url) {
  if (url == null) return COMMUNITY_DEFAULT_AVATAR;
  const s = String(url).trim();
  return s === '' ? COMMUNITY_DEFAULT_AVATAR : s;
}

export function isCommunityUserSelf(viewerUserId, authorUserId) {
  if (viewerUserId == null || authorUserId == null) return false;
  return Number(viewerUserId) === Number(authorUserId);
}
