-- 기존 DB에 적용: SUPPORT_ANSWER에 처리 방법 컬럼 추가
ALTER TABLE `SUPPORT_ANSWER`
    ADD COLUMN `handling_method` VARCHAR(500) NULL COMMENT '처리 방법' AFTER `content`;

-- 적용 후 코드 연동(선택): 컬럼을 실제로 조회·저장하려면
-- 1) SupportMapper.xml 의 answerHandlingMethod 를 NULL 리터럴 대신 handling_method 서브쿼리로 교체
-- 2) AdminMapper.xml insertSupportAnswer 에 handling_method 컬럼 복구 + AdminDAO/AdminService 시그니처 맞춤
