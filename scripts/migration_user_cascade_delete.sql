-- =============================================================================
-- USER 하드 삭제(탈퇴) 지원: USER 삭제 시 연관 데이터가 연쇄(ON DELETE CASCADE) 삭제되도록
-- USER 하위 의존성 트리 전체의 FK를 CASCADE로 전환한다.
--
-- ⚠️ 운영 DB에 직접 실행해야 한다 (앱 배포로는 적용되지 않음).
-- ⚠️ 복구 불가능. 실행 전 반드시 백업(mysqldump).
--
-- FK 제약이 익명(자동생성 이름: <table>_ibfk_N)이라 information_schema에서
-- 실제 이름을 찾아 DROP한 뒤 ON DELETE CASCADE로 다시 ADD 한다.
-- 이미 CASCADE인 FK(user_post_reaction/user_comment_like/COMMENT_MODERATION_BLOCK_LOG/
-- BOT_RECOMMEND_EVENT/WORRY_SPOTLIGHT.post_id, 분석세션 등)는 건드리지 않는다.
-- =============================================================================

USE matey;

-- (table, column) -> 참조 USER 또는 트리 상위 테이블. CASCADE로 재설정.
-- 헬퍼 프로시저: 주어진 테이블/컬럼의 (참조테이블 기준) FK를 찾아 DROP 후 CASCADE로 ADD
DROP PROCEDURE IF EXISTS recreate_fk_cascade;
DELIMITER //
CREATE PROCEDURE recreate_fk_cascade(
    IN p_table     VARCHAR(64),
    IN p_column    VARCHAR(64),
    IN p_ref_table VARCHAR(64),
    IN p_ref_col   VARCHAR(64)
)
BEGIN
    DECLARE v_fk VARCHAR(64);

    SELECT CONSTRAINT_NAME INTO v_fk
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND COLUMN_NAME = p_column
      AND REFERENCED_TABLE_NAME = p_ref_table
      AND REFERENCED_COLUMN_NAME = p_ref_col
    LIMIT 1;

    IF v_fk IS NOT NULL THEN
        SET @drop_sql = CONCAT('ALTER TABLE `', p_table, '` DROP FOREIGN KEY `', v_fk, '`');
        PREPARE s1 FROM @drop_sql; EXECUTE s1; DEALLOCATE PREPARE s1;
    END IF;

    SET @add_sql = CONCAT(
        'ALTER TABLE `', p_table, '` ADD FOREIGN KEY (`', p_column, '`) ',
        'REFERENCES `', p_ref_table, '`(`', p_ref_col, '`) ON DELETE CASCADE'
    );
    PREPARE s2 FROM @add_sql; EXECUTE s2; DEALLOCATE PREPARE s2;
END //
DELIMITER ;

-- ── USER 직속 자식 ────────────────────────────────────────────────
CALL recreate_fk_cascade('EXCLUSIVE',                 'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('SUPPORT',                   'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('NOTIFICATION',              'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('SUPPORT_ANSWER',            'admin_user_id', 'USER', 'user_id');
CALL recreate_fk_cascade('EMOTION_SCORE',             'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('USER_SETTING',              'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('PASSWORD_RESET_TOKEN',      'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('USER_ROLE',                 'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('AUTO_LOGIN',                'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('POST',                      'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('USER_INVENTORY',            'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('COMMENT',                   'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('USER_BOT_RECOMMEND',        'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('USER_NOTIFICATION_SETTING', 'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('REACTION',                  'user_id',       'USER', 'user_id');
CALL recreate_fk_cascade('SOCIAL_LOGIN',              'user_id',       'USER', 'user_id');

-- ── EXCLUSIVE 하위 (USER → EXCLUSIVE 가 지워지므로 그 자식도 연쇄) ──
CALL recreate_fk_cascade('CHAT_ROOM',                 'exclusive_id',  'EXCLUSIVE', 'exclusive_id');
CALL recreate_fk_cascade('BOT_LETTER',                'exclusive_id',  'EXCLUSIVE', 'exclusive_id');
CALL recreate_fk_cascade('SATISFACTION',              'exclusive_id',  'EXCLUSIVE', 'exclusive_id');
CALL recreate_fk_cascade('USER_BOT_RELATION',         'exclusive_id',  'EXCLUSIVE', 'exclusive_id');

-- ── CHAT_ROOM 하위 ────────────────────────────────────────────────
CALL recreate_fk_cascade('MESSAGE',                   'chat_room_id',  'CHAT_ROOM', 'chat_room_id');
CALL recreate_fk_cascade('SATISFACTION',              'chat_room_id',  'CHAT_ROOM', 'chat_room_id');
CALL recreate_fk_cascade('COUNSEL_SUMMARY',           'chat_room_id',  'CHAT_ROOM', 'chat_room_id');

-- ── MESSAGE 하위 (COUNSEL_SUMMARY 가 message 참조) ─────────────────
CALL recreate_fk_cascade('COUNSEL_SUMMARY',           'start_message_id', 'MESSAGE', 'message_id');
CALL recreate_fk_cascade('COUNSEL_SUMMARY',           'end_message_id',   'MESSAGE', 'message_id');

-- ── SUPPORT 하위 ──────────────────────────────────────────────────
CALL recreate_fk_cascade('SUPPORT_ANSWER',            'support_id',    'SUPPORT', 'support_id');

-- ── POST 하위 (타인 콘텐츠 포함) ──────────────────────────────────
CALL recreate_fk_cascade('POST_IMAGE',                'post_id',       'POST', 'post_id');
CALL recreate_fk_cascade('COMMENT',                   'post_id',       'POST', 'post_id');

-- ── COMMENT 하위 (대댓글 자기참조) ────────────────────────────────
CALL recreate_fk_cascade('COMMENT',                   'parent_comment_id', 'COMMENT', 'comment_id');

DROP PROCEDURE IF EXISTS recreate_fk_cascade;

-- 확인용: USER 트리에서 아직 CASCADE가 아닌 FK가 있는지 점검
-- SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, DELETE_RULE
-- FROM information_schema.REFERENTIAL_CONSTRAINTS rc
-- JOIN information_schema.KEY_COLUMN_USAGE k USING (CONSTRAINT_NAME, CONSTRAINT_SCHEMA)
-- WHERE rc.CONSTRAINT_SCHEMA = DATABASE() AND rc.DELETE_RULE <> 'CASCADE';
