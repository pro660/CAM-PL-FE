// src/pages/StudyPlaceList.jsx
import React from "react";

function formatDistance(distanceMeters) {
  if (distanceMeters == null) {
    return "거리 정보 없음";
  }

  if (distanceMeters < 1000) {
    return `약 ${distanceMeters}m`;
  }

  const km = distanceMeters / 1000;
  return `약 ${km.toFixed(1)}km`;
}

const StudyPlaceList = ({ places = [], loading, onPlaceClick }) => {
  const hasPlaces = places.length > 0;

  return (
    <section className="home-section home-studyplace-section">
      <h2 className="home-section-title">과제하기 좋아요!</h2>

      {loading ? (
        <p className="home-card-time" style={{ marginTop: "0.3rem" }}>
          추천 장소를 불러오는 중이에요...
        </p>
      ) : !hasPlaces ? (
        <p className="home-card-time" style={{ marginTop: "0.3rem" }}>
          아직 추천할 만한 장소를 찾지 못했어요.
        </p>
      ) : (
        <div className="home-studyplace-scroll">
          {places.map((place) => (
            <article
              key={place.id}
              className="home-studyplace-card"
              onClick={() => onPlaceClick?.(place.id)}
            >
              <div className="home-studyplace-image-wrap">
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  className="home-studyplace-image"
                />
              </div>
              <div className="home-studyplace-info">
                <h3 className="home-studyplace-name">{place.name}</h3>
                <div className="home-studyplace-meta">
                  <span className="home-studyplace-distance">
                    {formatDistance(place.distanceMeters)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default StudyPlaceList;
