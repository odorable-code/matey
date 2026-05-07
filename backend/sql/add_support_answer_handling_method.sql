-- 기존 DB에 적용: SUPPORT_ANSWER에 처리 방법 컬럼 추가
ALTER TABLE `SUPPORT_ANSWER`
    ADD COLUMN `handling_method` VARCHAR(500) NULL COMMENT '처리 방법' AFTER `content`;
