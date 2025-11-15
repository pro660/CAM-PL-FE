// src/components/common/Header.jsx (예시 경로)

import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/common/Header.css"; // 경로는 프로젝트에 맞게 수정

import Homelogo from "../images/home/home-logo.svg"

const Header = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/"); // 홈 화면으로 이동
  };

  return (
    <header className="header">
      <button
        type="button"
        className="header-logo-btn"
        onClick={handleLogoClick}
      >
        {/* 로고 이미지는 네가 교체해서 사용 */}
        <img
          src={Homelogo}
          alt="캠플 로고"
          className="header-logo-img"
        />
      </button>
    </header>
  );
};

export default Header;
