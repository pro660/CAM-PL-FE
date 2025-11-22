// src/components/calendar/CalendarTimePickerModal.jsx
import React, { useEffect, useState } from "react";
import "../../css/calendar/CalendarTimePickerModal.css";

// "HH:mm" -> { meridiem, hour12, minute }
function parseTime(timeStr = "10:00") {
  const [hStr, mStr] = timeStr.split(":");
  let h = Number(hStr) || 10;
  const m = Number(mStr) || 0;

  const meridiem = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;

  return { meridiem, hour12, minute: m };
}

// { meridiem, hour12, minute } -> "HH:mm"
function toTimeString({ meridiem, hour12, minute }) {
  let h = hour12 % 12;
  if (meridiem === "PM") h += 12;
  if (h === 24) h = 12;

  const hh = String(h).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}`;
}

const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50];

export default function CalendarTimePickerModal({
  visible,
  initialTime = "10:00",
  onClose,
  onConfirm,
}) {
  const [meridiem, setMeridiem] = useState("AM");
  const [hour12, setHour12] = useState(10);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const parsed = parseTime(initialTime);
    setMeridiem(parsed.meridiem);
    setHour12(parsed.hour12);
    setMinute(parsed.minute);
  }, [initialTime, visible]);

  if (!visible) return null;

  const handleConfirm = () => {
    const timeStr = toTimeString({ meridiem, hour12, minute });
    onConfirm && onConfirm(timeStr);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose && onClose();
    }
  };

  return (
    <div
      className="timepicker-overlay"
      onClick={handleBackdropClick}
    >
      <div className="timepicker-sheet">
        <div className="timepicker-header">
          <span className="timepicker-title">시간 선택</span>
          <button
            type="button"
            className="timepicker-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="timepicker-body">
          {/* AM/PM */}
          <div className="timepicker-column timepicker-meridiem-col">
            {["AM", "PM"].map((m) => (
              <button
                key={m}
                type="button"
                className={`timepicker-meridiem-item ${
                  meridiem === m ? "selected" : ""
                }`}
                onClick={() => setMeridiem(m)}
              >
                {m === "AM" ? "오전" : "오후"}
              </button>
            ))}
          </div>

          {/* 시 */}
          <div className="timepicker-column">
            <div className="timepicker-scroll">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(
                (h) => (
                  <button
                    key={h}
                    type="button"
                    className={`timepicker-item ${
                      hour12 === h ? "selected" : ""
                    }`}
                    onClick={() => setHour12(h)}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 분 */}
          <div className="timepicker-column">
            <div className="timepicker-scroll">
              {MINUTE_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`timepicker-item ${
                    minute === m ? "selected" : ""
                  }`}
                  onClick={() => setMinute(m)}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="timepicker-confirm"
          onClick={handleConfirm}
        >
          확인
        </button>
      </div>
    </div>
  );
}
