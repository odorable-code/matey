import React, { useState } from 'react';
import styles from './LetterArchiveModal.module.css';

function LetterArchiveModal({ isOpen, onClose, archivedItems = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 한 페이지에 보여줄 개수

  if (!isOpen) return null;

  // 페이지네이션 계산
  const totalPages = Math.ceil(archivedItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = archivedItems.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <h3>내 쪽지 보관함</h3>
            <span className={styles.count}>총 {archivedItems.length}통</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </header>

        <div className={styles.content}>
          {archivedItems.length > 0 ? (
            <div className={styles.list}>
              {currentItems.map((item) => (
                <div key={item.id} className={styles.archiveItem}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemSender}>{item.sender}</span>
                    <span className={styles.itemDate}>{item.date}</span>
                  </div>
                  <h4 className={styles.itemTitle}>{item.title}</h4>
                  <p className={styles.itemPreview}>{item.preview}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>보관된 쪽지가 아직 없어요.</div>
          )}
        </div>

        {totalPages > 1 && (
          <footer className={styles.footer}>
            <button 
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >이전</button>
            <span className={styles.pageInfo}><b>{currentPage}</b> / {totalPages}</span>
            <button 
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >다음</button>
          </footer>
        )}
      </div>
    </div>
  );
}

export default LetterArchiveModal;