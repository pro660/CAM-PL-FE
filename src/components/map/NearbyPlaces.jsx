// src/components/map/NearbyPlaces.jsx
import React from "react";
import "../../css/map/NearbyPlaces.css";

export default function NearbyPlaces({ places = [], onClickAdd }) {
  return (
    <section className="map-section map-nearby-section">
      <h2 className="map-section-title">주변 시설</h2>

      <div className="map-nearby-card">
        {places.length === 0 ? (
          <p className="map-section-description">
            등록된 주변 시설 정보가 없습니다.
          </p>
        ) : (
          <ul className="map-nearby-list">
            {places.map((place) => (
              <li key={place.id} className="map-nearby-item">
                <div className="map-nearby-thumb-wrap">
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="map-nearby-thumb"
                  />
                </div>
                <div className="map-nearby-info">
                  <div className="map-nearby-name">{place.name}</div>
                  <div className="map-nearby-category">
                    {place.category}
                  </div>
                </div>
                <button
                  type="button"
                  className="map-nearby-add-btn"
                  onClick={() => onClickAdd && onClickAdd(place)}
                >
                  +
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
