import React from "react";

const TodayLectureList = ({ lectures = [] }) => {
  const hasLectures = lectures.length > 0;

  return (
    <section className="home-section home-lecture-section">
      <h2 className="home-section-title">오늘의 강의</h2>

      {hasLectures ? (
        <div className="home-section-card-list">
          {lectures.map((lecture) => (
            <article key={lecture.id} className="home-card home-lecture-card">
              <div className="home-card-header">
                <span className="home-pill home-pill-building">
                  {lecture.buildingLabel}
                </span>
              </div>
              <div className="home-card-body">
                <h3 className="home-card-title">{lecture.title}</h3>
                <p className="home-card-subtext">{lecture.locationDetail}</p>
                <p className="home-card-time">{lecture.timeRange}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="home-card-time" style={{ marginTop: "0.3rem" }}>
          오늘은 예정된 강의가 없어요.
        </p>
      )}
    </section>
  );
};

export default TodayLectureList;
