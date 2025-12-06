import React from "react";

const TodayScheduleList = ({ schedules = [], loading }) => {
  const hasSchedules = schedules.length > 0;

  return (
    <section className="home-section home-schedule-section">
      <h2 className="home-section-title">오늘의 일정</h2>

      {loading ? (
        <p className="home-card-time" style={{ marginTop: "0.3rem" }}>
          오늘의 일정을 불러오는 중이에요...
        </p>
      ) : hasSchedules ? (
        <div className="home-section-card-list">
          {schedules.map((schedule) => (
            <article
              key={schedule.id}
              className="home-card home-schedule-card"
            >
              {/* 왼쪽 카테고리 Pill */}
              <div className="home-card-header">
                <span className="home-pill home-pill-category">
                  {schedule.category}
                </span>
              </div>

              {/* 오른쪽 텍스트 묶음 */}
              <div className="home-card-body">
                <h3 className="home-card-title">{schedule.title}</h3>
                <p className="home-card-subtext">{schedule.place}</p>
                {/* 🔥 시간 값이 있을 때만 표시 (00:00~00:00 → "" 로 들어오면 숨김) */}
                {schedule.timeRange && (
                  <p className="home-card-time">{schedule.timeRange}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="home-card-time" style={{ marginTop: "0.3rem" }}>
          오늘은 등록된 일정이 없어요.
        </p>
      )}
    </section>
  );
};

export default TodayScheduleList;
