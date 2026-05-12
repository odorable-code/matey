-- 먹이 주기(경험치) 일 1회 제한용 — 기존 last_fed_at 은 모든 상호작용에서 갱신되던 이력이 있어 분리합니다.
ALTER TABLE `USER_BOT_RELATION`
  ADD COLUMN `last_feed_reward_at` TIMESTAMP NULL DEFAULT NULL
  AFTER `last_fed_at`;
