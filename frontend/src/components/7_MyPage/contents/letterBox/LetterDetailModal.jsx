import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './LetterDetailModal.module.css';

function LetterDetailModal({ isOpen, onClose, letter }) {
  // 모달이 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !letter) return null;

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <h3>메이티의 편지</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.letterTop}>
            <span className={styles.letterSender}>{letter.sender || '메이티'}</span>
            {letter.date && <span className={styles.letterDate}>{letter.date}</span>}
          </div>
          <h2 className={styles.letterTitle}>{letter.title}</h2>
          
          <div className={styles.letterBody}>
            {/* content가 있으면 content를, 없으면 preview를 보여줌 */}
            {letter.content ? (
              <p className={styles.letterText}>{letter.content}</p>
            ) : (
              <p className={styles.letterText}>{letter.preview}</p>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.closeActionBtn} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default LetterDetailModal;
