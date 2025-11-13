import { Link, useLocation } from "react-router-dom";

export default function Menu() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        borderTop: "1px solid #eee",
        backgroundColor: "#ffffff",
        position: "sticky",
        bottom: 0,
      }}
    >
      <Link
        to="/"
        style={{
          fontSize: "14px",
          textDecoration: "none",
          color: isActive("/") ? "#4f46e5" : "#555",
          fontWeight: isActive("/") ? 700 : 400,
        }}
      >
        홈
      </Link>
      <Link
        to="/mypage"
        style={{
          fontSize: "14px",
          textDecoration: "none",
          color: isActive("/mypage") ? "#4f46e5" : "#555",
          fontWeight: isActive("/mypage") ? 700 : 400,
        }}
      >
        마이
      </Link>
    </nav>
  );
}
