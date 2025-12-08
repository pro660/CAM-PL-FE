import React from "react";
import "../../css/review/CourseReviewWriteSection.css";

/** 입력용 별점 (0.5 단위 클릭) */
function StarRatingInput({ value = 0, onChange }) {
  const safeValue = Math.max(0, Math.min(5, value || 0));

  const handleClick = (index, e) => {
    if (!onChange) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x <= rect.width / 2;

    const half = isLeftHalf ? 0.5 : 1;
    const newValue = index - 1 + half; // 1번째 별: 0.5 또는 1.0

    onChange(newValue);
  };

  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    let fill = 0;
    const diff = safeValue - (i - 1);

    if (diff >= 1) fill = 100;       // 꽉 찬 별
    else if (diff >= 0.5) fill = 50; // 반 별
    else fill = 0;                   // 빈 별

    stars.push(
      <button
        key={i}
        type="button"
        className="cr-star-input"
        onClick={(e) => handleClick(i, e)}
      >
        {/* 리스트와 동일한 구조: 베이스 + 필 레이어 */}
        <span className="cr-star-input-base">★</span>
        <span
          className="cr-star-input-fill"
          style={{ width: `${fill}%` }}
        >
          ★
        </span>
      </button>
    );
  }

  return <div className="cr-star-input-row">{stars}</div>;
}

export default function CourseReviewWriteSection({
  content,
  onContentChange,
  rating,
  onRatingChange,
}) {
  const handleTextChange = (e) => {
    onContentChange?.(e.target.value);
  };

  const safeRating = typeof rating === "number" ? rating : 0;
  const ratingText = `${safeRating.toFixed(1)} / 5.0`;

  return (
    <section className="cr-write-wrapper">
      <h3 className="cr-section-title">강의평쓰기</h3>

      <div className="cr-write-textarea-wrap">
        <textarea
          className="cr-write-textarea"
          placeholder="내용을 입력해주세요"
          value={content}
          onChange={handleTextChange}
          maxLength={1000}
        />
      </div>

      <div className="cr-write-rating-row">
        <StarRatingInput
          value={rating}
          onChange={onRatingChange}
        />
        <span className="cr-write-rating-text">{ratingText}</span>
      </div>
    </section>
  );
}
