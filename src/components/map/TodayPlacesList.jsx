// src/components/map/TodayPlacesList.jsx
import React from "react";
import "../../css/map/TodayPlaces.css";

export default function TodayPlaces({ items = [], loading }) {
  return (
    <section className="map-section map-today-section">
      <h2 className="map-section-title">오늘의 일정</h2>

      {loading ? (
        <p className="map-section-description">
          오늘의 일정을 불러오는 중입니다...
        </p>
      ) : items.length === 0 ? (
        <p className="map-section-description">
          오늘은 등록된 일정이 없어요.
        </p>
      ) : (
        <div className="map-today-places-chips">
          {items.map((item) => (
            <div key={item.place} className="map-today-place-chip">
              <span className="map-today-place-name">{item.place}</span>
              <span className="map-today-place-count">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
