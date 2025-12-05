import React from "react";
import "../../css/review/CourseReviewWrite.css";

// 인터랙티브 별점 (0.5 단위, 왼쪽 = 반개, 오른쪽 = 한 개)
const InteractiveStarRating = ({
  value,
  onChange,
  disabled,
}) => {
  const safe = Math.max(0, Math.min(5, value ?? 0));

  const handleStarClick = (index, event) => {
    if (disabled || !onChange) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const isHalf = clickX < rect.width / 2;

    const newValue = isHalf ? index - 0.5 : index;
    onChange(newValue);
  };

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let fillPercent = 0;
    if (safe >= i) fillPercent = 100;
    else if (safe >= i - 0.5) fillPercent = 50;

    stars.push(
      <button
        key={i}
        type="button"
        className="course-star-button"
        onClick={(e) => handleStarClick(i, e)}
        disabled={disabled}
      >
        <span className="course-star">
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
      </button>
    );
  }

  return <div className="course-star-row">{stars}</div>;
};

export default function CourseReviewWrite({
  rating,
  onRatingChange,
  content,
  onContentChange,
  hasMyReview,
}) {
  const disabled = hasMyReview;

  return (
    <section className="course-review-write-section">
      <h2 className="course-review-write-title">강의평 쓰기</h2>

      <div className="course-review-write-box">
        <textarea
          className="course-review-write-textarea"
          placeholder="내용을 입력해주세요"
          value={content}
          onChange={(e) =>
            onContentChange && onContentChange(e.target.value)
          }
          disabled={disabled}
          maxLength={1000}
        />

        <div className="course-review-write-bottom-row">
          <div className="course-review-write-stars">
            <InteractiveStarRating
              value={rating}
              onChange={onRatingChange}
              disabled={disabled}
            />
            <span className="course-review-write-rating-text">
              {rating > 0 ? `${rating.toFixed(1)} / 5` : "0.0 / 5"}
            </span>
          </div>

          {hasMyReview && (
            <p className="course-review-write-info">
              한 개의 강의평만 작성 가능합니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
