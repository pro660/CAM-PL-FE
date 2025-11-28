// src/components/map/ScheduleList.jsx
import React from "react";
import "../../css/map/ScheduleList.css";

export default function ScheduleList({ title, items = [], emptyText }) {
  // 🔥 제목에 따라 pill 색상 클래스 분기
  const pillClassName =
    title === "지난 일정"
      ? "map-schedule-pill map-schedule-pill-prev"
      : title === "다음 일정"
      ? "map-schedule-pill map-schedule-pill-next"
      : "map-schedule-pill";

  return (
    <section className="map-section">
      <h2 className="map-section-title">{title}</h2>

      {items.length === 0 ? (
        <p className="map-section-description">
          {emptyText || "등록된 일정이 없습니다."}
        </p>
      ) : (
        <ul className="map-schedule-list">
          {items.map((item) => (
            <li key={item.id} className="map-schedule-item">
              <span className={pillClassName}>{item.category}</span>
              <span className="map-schedule-title">{item.title}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
