import React from "react";
import "../../css/review/CourseReviewList.css";

// 별 표시 (리뷰별 점수)
const StarRatingDisplay = ({ value }) => {
  const safe = Math.max(0, Math.min(5, value ?? 0));
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    let fillPercent = 0;
    if (safe >= i) fillPercent = 100;
    else if (safe >= i - 0.5) fillPercent = 50;

    stars.push(
      <span className="course-star" key={i}>
        <span className="course-star-text course-star-base">
          ★
        </span>
        <span
          className="course-star-fill"
          style={{ width: `${fillPercent}%` }}
        >
          <span className="course-star-text course-star-fill-text">
            ★
          </span>
        </span>
      </span>
    );
  }

  return <div className="course-star-row">{stars}</div>;
};

const formatSemesterLabel = (semesterCode) => {
  if (!semesterCode) return "";
  const [year, term] = semesterCode.split("-");
  let termText = "";
  if (term === "1") termText = "1학기";
  else if (term === "2") termText = "2학기";
  else termText = `${term}학기`;
  return `${year}년 ${termText}`;
};

const formatDate = (isoStr) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
};

export default function CourseReviewList({
  reviews = [],
  semesterCode,
  onDeleteReview,
}) {
  const semesterLabel = formatSemesterLabel(semesterCode);

  return (
    <section className="course-review-list-section">
      <h2 className="course-review-list-title">강의평</h2>

      {reviews.length === 0 ? (
        <p className="course-review-list-empty">
          아직 등록된 강의평이 없습니다.
        </p>
      ) : (
        <div className="course-review-list-items">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="course-review-item"
            >
              <div className="course-review-item-header">
                <div className="course-review-item-rating">
                  <StarRatingDisplay value={review.rating} />
                  <span className="course-review-item-rating-value">
                    {review.rating?.toFixed(1)}점
                  </span>
                </div>

                <button
                  type="button"
                  className="course-review-item-delete-btn"
                  onClick={() =>
                    onDeleteReview && onDeleteReview(review.id)
                  }
                >
                  {/* 여기 안에 SVG 아이콘 넣으면 됨 */}
                  <span className="visually-hidden">
                    강의평 삭제
                  </span>
                </button>
              </div>

              <div className="course-review-item-meta">
                {semesterLabel && (
                  <span className="course-review-item-meta-text">
                    {semesterLabel} 수강자
                  </span>
                )}
                {review.createdAt && semesterLabel && (
                  <span className="course-review-item-meta-dot">
                    ·
                  </span>
                )}
                {review.createdAt && (
                  <span className="course-review-item-meta-text">
                    {formatDate(review.createdAt)}
                  </span>
                )}
              </div>

              <p className="course-review-item-content">
                {review.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
