// src/components/home/NaverMap.jsx
import React, { useEffect, useRef } from "react";
import "../../css/home/HomePage.css";
import { useLoading } from "../../context/LoadingContext.jsx";

import PlaceMarkerIcon from "../../images/map/marker-place.svg";
/**
 * props:
 * - markers: [{ id, name, lat, lng, count }]
 * - center: { lat, lng } | null   // 선택된 장소가 있을 때만 사용
 * - onMarkerClick: (marker) => void
 */
const NaverMap = ({ markers = [], center, onMarkerClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const { showLoading, hideLoading } = useLoading();

  // ✅ 지도는 한 번만 생성
  useEffect(() => {
    showLoading(); // 지도 준비 시작

    try {
      if (!window.naver || !window.naver.maps) {
        console.error("네이버 지도 스크립트가 로드되지 않았습니다.");
        hideLoading();
        return;
      }
      if (!mapRef.current) {
        hideLoading();
        return;
      }

      const { naver } = window;

      // 한서대학교 기본 중심 (고정)
      const defaultCenter = new naver.maps.LatLng(36.69085, 126.58297);

      const map = new naver.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 16,
      });

      mapInstanceRef.current = map;
      hideLoading();
    } catch (e) {
      console.error(e);
      hideLoading();
    }

    return () => {
      // 언마운트 시 마커 제거
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoading, hideLoading]);

  // ✅ markers / center 변경될 때마다 부드럽게 이동 + 마커 재배치
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.naver) return;
    const { naver } = window;

    const defaultCenter = new naver.maps.LatLng(36.69085, 126.58297);

    // ------- 지도 중심 부드럽게 이동 -------
    if (
      center &&
      typeof center.lat === "number" &&
      typeof center.lng === "number"
    ) {
      const target = new naver.maps.LatLng(center.lat, center.lng);
      // ✅ 선택된 장소가 있으면 그 위치로 부드럽게 이동
      map.panTo(target);
    } else {
      // ✅ 선택된 장소가 없으면 다시 한서대 기본 위치로 부드럽게 복귀
      map.panTo(defaultCenter);
    }

    // ------- 기존 마커 제거 -------
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // ✅ 커스텀 SVG 마커 옵션 (여기만 살짝 조절하면 됨)
    const markerIcon =
  PlaceMarkerIcon && typeof PlaceMarkerIcon === "string"
    ? {
        url: PlaceMarkerIcon,
        // size: new naver.maps.Size(40, 40), // ⛔ 크롭용이라 빼버리기
        scaledSize: new naver.maps.Size(30, 30), // 실제 화면에 찍히는 크기
        origin: new naver.maps.Point(0, 0),
        anchor: new naver.maps.Point(20, 40), // 40x40 기준이면 중앙 아래
      }
    : null;


    // ------- 새 마커 생성 -------
    if (markers.length > 0) {
      markers.forEach((m) => {
        if (typeof m.lat !== "number" || typeof m.lng !== "number") return;

        const markerOptions = {
          position: new naver.maps.LatLng(m.lat, m.lng),
          map,
          title: m.name || undefined,
        };

        // 아이콘 파일이 있으면 icon 적용
        if (markerIcon) {
          markerOptions.icon = markerIcon;
        }

        const marker = new naver.maps.Marker(markerOptions);

        if (onMarkerClick) {
          naver.maps.Event.addListener(marker, "click", () => {
            onMarkerClick(m); // MapPage에서 selectedPlace 세팅 → 정보 패널 + 지도 이동
          });
        }

        markersRef.current.push(marker);
      });
    } else {
      // 마커가 아예 없으면 기본 캠퍼스 마커 하나만
      const markerOptions = {
        position: defaultCenter,
        map,
        title: "한서대학교",
      };

      if (markerIcon) {
        markerOptions.icon = markerIcon;
      }

      const defaultMarker = new naver.maps.Marker(markerOptions);
      markersRef.current.push(defaultMarker);
    }
  }, [markers, center, onMarkerClick]);

  return <div ref={mapRef} className="home-naver-map" />;
};

export default NaverMap;
