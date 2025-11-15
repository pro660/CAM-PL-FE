import React from "react";

const StudyPlaceList = ({ places }) => {
  return (
    <section className="home-section home-studyplace-section">
      <h2 className="home-section-title">과제하기 좋아요!</h2>

      <div className="home-studyplace-scroll">
        {places.map((place) => (
          <article key={place.id} className="home-studyplace-card">
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
                <span className="home-studyplace-rating">
                  ⭐ {place.rating.toFixed(1)}
                </span>
                <span className="home-studyplace-distance">
                  {place.distanceText}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default StudyPlaceList;
