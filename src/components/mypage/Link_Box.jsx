import React from "react";
import "../../css/mypage/Link_Box.css";

export default function LinkBox({
  label,
  iconSrc,
  iconAlt,
  variant = "light",
  onClick,
}) {
  const variantClass =
    variant === "gradient"
      ? "mypage-link-box--gradient"
      : "mypage-link-box--light";

  return (
    <button
      type="button"
      className={`mypage-link-box ${variantClass}`}
      onClick={onClick}
    >
      {/* 여기 텍스트 밑줄에 애니메이션 들어감 */}

      <div className="mypage-link-box-icon">
        {iconSrc && (
          <img
            src={iconSrc}
            alt={iconAlt || ""}
            className="mypage-link-box-icon-img"
          />
        )}
      </div>
      <span className="mypage-link-box-label">{label}</span>
    </button>
  );
}
