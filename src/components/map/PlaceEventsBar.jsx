// src/components/map/PlaceEventsBar.jsx
import React from "react";
import "../../css/map/PlaceEventsBar.css";

/**
 * 지도 하단에 떠 있는 "건물별 일정 카드 슬라이더"
 * place: 선택된 건물명 (예: "건축관")
 * items: [{ id, category, title, timeText }]
 */
export default function PlaceEventsBar({ place, items = [], onClose }) {
  if (!place || items.length === 0) return null;

  return (
    <div className="place-events-bar">
      <div className="place-events-scroll">
        {items.map((item) => (
          <div key={item.id} className="place-event-card">
            <span className="place-event-pill">{item.category}</span>
            <div className="place-event-title">{item.title}</div>
            {item.timeText && (
              <div className="place-event-time">{item.timeText}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
