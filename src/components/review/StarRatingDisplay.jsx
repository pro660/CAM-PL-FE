import React from "react";

/**
 * 공용 별점 표시 컴포넌트 (읽기 전용, 0.5 단위)
 *
 * props:
 *  - value: 숫자(0~5)
 *  - rowClass: 바깥 래퍼(별 줄) 클래스명
 *  - starClass: 개별 별 래퍼 클래스명
 *  - baseClass: 빈 별 클래스명
 *  - fillClass: 채운 별 클래스명
 *
 * 기본값은 강의평 리스트 스타일에 맞춰져 있음.
 */
export default function StarRatingDisplay({
  value = 0,
  rowClass = "cr-list-star-row",
  starClass = "cr-list-star",
  baseClass = "cr-list-star-base",
  fillClass = "cr-list-star-fill",
}) {
  const safeValue = Math.max(0, Math.min(5, value || 0));
  const stars = [];

  for (let i = 1; i <= 5; i += 1) {
    let fill = 0;
    const diff = safeValue - (i - 1);

    if (diff >= 1) fill = 100;        // 꽉 찬 별
    else if (diff >= 0.5) fill = 50;  // 반 별
    else fill = 0;                    // 빈 별

    stars.push(
      <span key={i} className={starClass}>
        <span className={baseClass}>★</span>
        <span
          className={fillClass}
          style={{ width: `${fill}%` }}
        >
          ★
        </span>
      </span>
    );
  }

  return <div className={rowClass}>{stars}</div>;
}
