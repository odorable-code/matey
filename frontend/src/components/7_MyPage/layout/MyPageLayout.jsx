import React from "react";
import styles from "./MyPageLayout.module.css";

function MyPageLayout({ sidebar, content }) {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <aside className={styles.sidebar}>{sidebar}</aside>
        <section className={styles.content}>{content}</section>
      </div>
    </main>
  );
}

export default MyPageLayout;
