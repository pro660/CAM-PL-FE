// src/components/home/NaverMap.jsx
import React, { useEffect, useRef } from "react";
import "../../css/home/HomePage.css";

const NaverMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    // index.html에서 네이버 지도 스크립트를 이미 로드했다고 가정
    if (!window.naver || !window.naver.maps) {
      console.error("네이버 지도 스크립트가 로드되지 않았습니다.");
      return;
    }
    if (!mapRef.current) return;

    const hanseoCenter = new window.naver.maps.LatLng(36.690850, 126.582970);

    const map = new window.naver.maps.Map(mapRef.current, {
      center: hanseoCenter,
      zoom: 16,
    });

    new window.naver.maps.Marker({
      position: hanseoCenter,
      map,
      title: "한서대학교",
    });
  }, []);

  return <div ref={mapRef} className="home-naver-map" />;
};

export default NaverMap;
