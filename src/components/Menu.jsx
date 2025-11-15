// src/components/common/Menu.jsx

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/common/Menu.css";

import HomeIcon from "../images/home/icon-home.svg";
import MapIcon from "../images/home/icon-map.svg";
import CalendarIcon from "../images/home/icon-calendar.svg";
import MypageIcon from "../images/home/icon-mypage.svg";

const MENU_ITEMS = [
  {
    key: "home",
    label: "홈",
    path: "/",
    icon: HomeIcon,
  },
  {
    key: "calendar",
    label: "캘린더",
    path: "/calendar",
    icon: CalendarIcon,
  },
  {
    key: "map",
    label: "웹",
    path: "/map",
    icon: MapIcon,
  },
  {
    key: "mypage",
    label: "마이페이지",
    path: "/mypage",
    icon: MypageIcon,
  },
];

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-menu">
      {MENU_ITEMS.map((item) => {
        const isActive =
          item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);

        return (
          <button
            key={item.key}
            type="button"
            className={`bottom-menu-item ${isActive ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <img
              src={item.icon}
              alt={item.label}
              className="bottom-menu-icon"
            />
          </button>
        );
      })}
    </nav>
  );
};

export default Menu;
