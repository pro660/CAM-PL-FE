// src/components/map/TodayPlacesList.jsx
import React from "react";
import "../../css/map/TodayPlaces.css";

export default function TodayPlaces({
  items = [],
  loading,
  selectedPlace,
  onSelectPlace,
}) {
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
            <button
              key={item.place}
              type="button"
              className={`map-today-place-chip ${
                selectedPlace === item.place ? "active" : ""
              }`}
              onClick={() => onSelectPlace && onSelectPlace(item.place)}
            >
              {item.place} ({item.count})
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
