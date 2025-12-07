// src/components/home/NaverMap.jsx
import React, { useEffect, useRef } from "react";
import "../../css/home/HomePage.css";
import { useLoading } from "../../context/LoadingContext.jsx";
import { useLocation } from "react-router-dom";

// 🔴 정적 기준 좌표 (빨간 마커 + 기본 중심)
const STATIC_CENTER_LAT = 36.690621;
const STATIC_CENTER_LNG = 126.581591;

/**
 * props:
 * - markers: [{ id, name, placeKey, lat, lng, count }]
 * - center: { lat, lng } | null   // MapPage에서 선택된 장소가 있으면 그 좌표
 * - onMarkerClick: (marker) => void
 * - onMapDrag: () => void         // 지도 드래그 시작 시 호출 (선택 해제 등)
 */
const NaverMap = ({ markers = [], center, onMarkerClick, onMapDrag }) => {
  const location = useLocation();
  const isHomeMap = location.pathname === "/"; // 홈에서만 campl-recenter-home 이벤트 사용

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const staticMarkerRef = useRef(null); // 🔴 정적 빨간 마커
  const dragListenerRef = useRef(null); // 드래그 리스너
  const prevCenterRef = useRef(null);   // 이전 center 기억해서 불필요한 panTo 방지
  const { showLoading, hideLoading } = useLoading();

  /* =========================
     1. 지도 생성 / 제거 (딱 1번)
     ========================= */
  useEffect(() => {
    showLoading(); // 지도 준비 시작

    try {
      if (typeof window === "undefined" || !window.naver || !window.naver.maps) {
        console.error("네이버 지도 스크립트가 로드되지 않았습니다.");
        hideLoading();
        return;
      }
      if (!mapRef.current) {
        hideLoading();
        return;
      }

      const { naver } = window;

      const defaultCenter = new naver.maps.LatLng(
        STATIC_CENTER_LAT,
        STATIC_CENTER_LNG
      );

      const map = new naver.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 16,
      });

      mapInstanceRef.current = map;

      // 🔴 정적 빨간 마커 (캠퍼스 기준점)
      const staticPos = new naver.maps.LatLng(
        STATIC_CENTER_LAT,
        STATIC_CENTER_LNG
      );

      const redMarker = new naver.maps.Marker({
        position: staticPos,
        map,
        icon: {
          content:
            '<div style="width:13px;height:13px;border-radius:50%;background:#ff3b30;border:2px solid #ffffff;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>',
          anchor: new naver.maps.Point(9, 9),
        },
        clickable: false,
      });

      staticMarkerRef.current = redMarker;
    } catch (e) {
      console.error(e);
    } finally {
      hideLoading();
    }

    // 언마운트 시 전체 정리
    return () => {
      const { naver } = typeof window !== "undefined" ? window : {};

      // 장소 마커 제거
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];

      // 정적 빨간 마커 제거
      if (staticMarkerRef.current) {
        staticMarkerRef.current.setMap(null);
        staticMarkerRef.current = null;
      }

      // 드래그 리스너 제거
      if (dragListenerRef.current && naver?.maps?.Event) {
        naver.maps.Event.removeListener(dragListenerRef.current);
        dragListenerRef.current = null;
      }

      mapInstanceRef.current = null;
    };
  }, [showLoading, hideLoading]);

  /* =========================
     2. 지도 드래그 리스너 (onMapDrag 변경 시에만)
     ========================= */
  useEffect(() => {
    if (typeof window === "undefined" || !window.naver || !window.naver.maps) {
      return;
    }
    const { naver } = window;
    const map = mapInstanceRef.current;
    if (!map) return;

    // 기존 리스너 제거
    if (dragListenerRef.current) {
      naver.maps.Event.removeListener(dragListenerRef.current);
      dragListenerRef.current = null;
    }

    if (!onMapDrag) return;

    // 새 리스너 등록
    const listener = naver.maps.Event.addListener(map, "dragstart", () => {
      onMapDrag();
    });
    dragListenerRef.current = listener;

    // effect 재실행/언마운트 시 정리
    return () => {
      if (dragListenerRef.current) {
        naver.maps.Event.removeListener(dragListenerRef.current);
        dragListenerRef.current = null;
      }
    };
  }, [onMapDrag]);

  /* =========================
     3. markers 변경 시 장소 마커 재그리기
     ========================= */
  useEffect(() => {
    if (typeof window === "undefined" || !window.naver || !window.naver.maps) {
      return;
    }
    const { naver } = window;
    const map = mapInstanceRef.current;
    if (!map) return;

    // 기존 장소 마커 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    if (!markers || markers.length === 0) return;

    markers.forEach((m) => {
      if (typeof m.lat !== "number" || typeof m.lng !== "number") return;

      const position = new naver.maps.LatLng(m.lat, m.lng);

      // count가 있으면 숫자로 표시, 없으면 빈 동그라미
      const hasCount = typeof m.count === "number" && m.count > 0;
      const displayNumber = hasCount
        ? m.count > 99
          ? "99+"
          : String(Math.round(m.count))
        : "";

      const iconContent = `
        <div class="naver-marker-circle">
          ${
            displayNumber
              ? `<span class="naver-marker-count">${displayNumber}</span>`
              : ""
          }
        </div>
      `;

      const markerOptions = {
        position,
        map,
        title: m.name || undefined,
        icon: {
          content: iconContent,
          anchor: new naver.maps.Point(13, 13), // 원의 중앙
        },
      };

      const marker = new naver.maps.Marker(markerOptions);

      if (onMarkerClick) {
        naver.maps.Event.addListener(marker, "click", () => {
          onMarkerClick(m);
        });
      }

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  /* =========================
     4. center 변경 시에만 부드럽게 panTo
        - defaultCenter 강제 panTo 제거
        - 이전 center와 같으면 아무것도 안 함
     ========================= */
  useEffect(() => {
    if (
      !center ||
      typeof center.lat !== "number" ||
      typeof center.lng !== "number"
    ) {
      return;
    }
    if (typeof window === "undefined" || !window.naver || !window.naver.maps) {
      return;
    }
    const { naver } = window;
    const map = mapInstanceRef.current;
    if (!map) return;

    const prev = prevCenterRef.current;
    if (prev && prev.lat === center.lat && prev.lng === center.lng) {
      // 같은 중심이면 panTo 생략
      return;
    }

    prevCenterRef.current = { lat: center.lat, lng: center.lng };

    const target = new naver.maps.LatLng(center.lat, center.lng);
    map.panTo(target);
  }, [center]);

  /* =========================
     5. 홈(/)에서만 campl-recenter-home 이벤트 처리
     ========================= */
  useEffect(() => {
    if (!isHomeMap) return;

    const handler = () => {
      if (
        typeof window === "undefined" ||
        !window.naver ||
        !window.naver.maps
      ) {
        return;
      }
      const { naver } = window;
      const map = mapInstanceRef.current;
      if (!map) return;

      const staticPos = new naver.maps.LatLng(
        STATIC_CENTER_LAT,
        STATIC_CENTER_LNG
      );
      map.panTo(staticPos);
    };

    window.addEventListener("campl-recenter-home", handler);
    return () => {
      window.removeEventListener("campl-recenter-home", handler);
    };
  }, [isHomeMap]);

  return <div ref={mapRef} className="home-naver-map" />;
};

export default NaverMap;
