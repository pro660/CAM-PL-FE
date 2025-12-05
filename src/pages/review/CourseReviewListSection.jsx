// src/pages/review/CourseReviewListSection.jsx
import React, { useMemo } from "react";
import "../../css/review/CourseReviewListSection.css";

/** 별점 표시용 (읽기 전용, 0.5 단위, width + overflow 방식) */
function StarRatingDisplay({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(5, value || 0));
  const stars = [];

  for (let i = 1; i <= 5; i += 1) {
    let fill = 0;
    const diff = safeValue - (i - 1);

    if (diff >= 1) fill = 100;      // 꽉 찬 별
    else if (diff >= 0.5) fill = 50; // 반 별
    else fill = 0;                  // 빈 별

    stars.push(
      <span key={i} className="cr-list-star">
        <span className="cr-list-star-base">★</span>
        <span
          className="cr-list-star-fill"
          style={{ width: `${fill}%` }}
        >
          ★
        </span>
      </span>
    );
  }

  return <div className="cr-list-star-row">{stars}</div>;
}

const formatSemesterLabel = (semesterCode) => {
  if (!semesterCode) return "";
  const [yearStr, semStr] = semesterCode.split("-");
  if (!yearStr || !semStr) return "";
  const shortYear = yearStr.slice(2); // 2025 -> 25
  const semLabel =
    semStr === "1"
      ? "1학기"
      : semStr === "2"
      ? "2학기"
      : `${semStr}학기`;
  return `${shortYear}년 ${semLabel} 수강자`;
};

export default function CourseReviewListSection({
  reviews = [],
  semesterCode,
}) {
  const semesterLabel = useMemo(
    () => formatSemesterLabel(semesterCode),
    [semesterCode]
  );

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime; // 최신순
    });
  }, [reviews]);

  return (
    <section className="cr-list-wrapper">
      <h3 className="cr-section-title">강의평</h3>

      {sortedReviews.length === 0 ? (
        <p className="cr-list-empty-text">
          아직 등록된 강의평이 없어요.
        </p>
      ) : (
        <div className="cr-review-list">
          {sortedReviews.map((review) => (
            <article
              key={review.id || review.createdAt}
              className="cr-review-card"
            >
              <div className="cr-review-rating-row">
                <StarRatingDisplay value={review.rating || 0} />
              </div>
              {semesterLabel && (
                <div className="cr-review-semester">
                  {semesterLabel}
                </div>
              )}
              <p className="cr-review-content">
                {review.content || ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
