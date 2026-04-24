import React, { useMemo } from "react";
import styles from "./AttendanceCalendar.module.css";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const formatDate = (year, month, day) => {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
};

function AttendanceCalendar({
  year = 2026,
  month = 4,
  attendanceDates = [],
  today = "2026-04-23",
}) {
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();

    const cells = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push({
        key: `empty-start-${i}`,
        type: "empty",
        label: "",
      });
    }

    for (let day = 1; day <= lastDate; day += 1) {
      const dateString = formatDate(year, month, day);
      const isToday = dateString === today;
      const isAttended = attendanceDates.includes(dateString);
      const isFuture = dateString > today;

      cells.push({
        key: dateString,
        type: "date",
        label: day,
        isToday,
        isAttended,
        isFuture,
      });
    }

    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const fillCount = 7 - remainder;
      for (let i = 0; i < fillCount; i += 1) {
        cells.push({
          key: `empty-end-${i}`,
          type: "empty",
          label: "",
        });
      }
    }

    return cells;
  }, [attendanceDates, month, today, year]);

  return (
    <div className={styles.calendar}>
      <div className={styles.weekHeader}>
        {WEEK_DAYS.map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {calendarCells.map((cell) => {
          if (cell.type === "empty") {
            return <div key={cell.key} className={styles.emptyCell} />;
          }

          let cellClassName = styles.dayCell;

          if (cell.isFuture) {
            cellClassName = `${styles.dayCell} ${styles.futureCell}`;
          } else if (cell.isToday) {
            cellClassName = `${styles.dayCell} ${styles.todayCell}`;
          } else if (cell.isAttended) {
            cellClassName = `${styles.dayCell} ${styles.attendedCell}`;
          } else {
            cellClassName = `${styles.dayCell} ${styles.defaultCell}`;
          }

          return (
            <div
              key={cell.key}
              className={cellClassName}
              aria-current={cell.isToday ? "date" : undefined}
            >
              {cell.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AttendanceCalendar;
