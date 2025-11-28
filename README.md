# 🏫 CAM-PL (캠플)

> **캠퍼스 시간표 · 일정 · 지도를 한 번에 관리하는 캠퍼스 라이프 플래너**

🔗 **Live 서비스**: https://campl.site  
(✅ 2025-12-09 이후 서비스 중단 예정)

---

## ✨ 요약

- **React 기반** 캠퍼스 라이프 관리 웹 서비스
- **강의 시간표 + 캠퍼스 지도 + 일정 캘린더** 통합
- 기획 · 디자인 · 프론트엔드 · 백엔드 · 배포까지 **3인 개발 (DE / FE / BE)**  
  → 그 중 **프론트엔드(React) 담당**
- 실제 서버에 배포하여 운영 (**Ubuntu + Nginx + Gabia server**)

---

## 🧑‍💻 Tech Stack

**Frontend**

- React, React Router
- JavaScript
- CSS (반응형 웹, 모바일 퍼스트)
- Axios (API 통신)
- Naver Maps JavaScript API

**Infra / DevOps**

- Ubuntu 22.04 LTS
- Nginx (Reverse Proxy, 정적 파일 서빙)
- Gabia 서버 호스팅
- 배포 자동화 쉘 스크립트

**Tools**

![VSCode](https://img.shields.io/badge/VSCode-Editor-007ACC?logo=visualstudiocode&logoColor=white)
![Git](https://img.shields.io/badge/Git-Version%20Control-F05032?logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-API%20Test-FF6C37?logo=postman&logoColor=white)
![Figma](https://img.shields.io/badge/Figma-UI%2FUX-F24E1E?logo=figma&logoColor=white)

---

## 📱 주요 기능

| 기능                         | 설명 |
|----------------------------|------|
| 시간표 × 캠퍼스 지도 연동       | 강의 시간표를 기반으로 해당 강의 건물을 네이버 지도에서 바로 표시 |
| 학사 & 개인 일정 캘린더        | 학사 일정과 개인 일정을 달력에서 한눈에 확인, 일정이 있는 날 점(dot) 표시 |
| 오늘 날짜 강조               | 오늘 날짜를 보라색 원으로 강조하여 직관적인 UI 제공 |
| 바텀시트 일정 리스트           | 날짜 선택 시 바텀시트로 해당 날의 일정 리스트 노출 (수정/메모 버튼 포함) |
| 장소 상세 모달               | 지도에서 건물 클릭 시 상세 정보 모달(이름, 설명, 운영시간 등) 표기 |
| 인증 & 보호된 라우트          | 로그인 토큰 기반으로 특정 페이지 접근 제어 |
| 모바일 퍼스트 UI             | 430px 기준 모바일 화면 최적화, 플로팅 버튼·바텀시트 등 모바일 친화 패턴 적용 |

---

## 🧱 프로젝트 구조 (요약)

```bash
src/
  api/
    axios.js              # Axios 인스턴스 및 공통 설정
  components/
    home/
      NaverMap.jsx
      TimetableMapSection.jsx
      PlaceDetailModal.jsx
    common/
      Header.jsx
      BottomSheet.jsx
      FloatingButton.jsx
  context/
    LoadingContext.jsx    # 전역 로딩 상태 관리
    AuthContext.jsx       # 인증 / 사용자 정보 관리
  pages/
    Home/
    Calendar/
    Timetable/
    Login/
  css/
    home/
    calendar/
    common/
  App.jsx
  index.jsx
🚀 실행 방법
Node.js 18+ 권장

bash
코드 복사
# 1. 레포지토리 클론
git clone https://github.com/pro660/CAM-PL-FE.git
cd CAM-PL-FE

# 2. 패키지 설치
npm install

# 3. 로컬 개발 서버 실행
npm start

# 4. 프로덕션 빌드
npm run build
🌐 배포
서버 OS: Ubuntu 22.04 LTS

웹 서버: Nginx

campl.site 도메인에서 React 빌드 결과물 정적 서빙

배포 자동화

재배포용 .sh 스크립트로 아래 과정을 한 번에 실행

git pull

npm install

npm run build

sudo systemctl reload nginx

한 줄 명령으로 프론트엔드 재배포 가능하도록 구성

🎯 이 프로젝트에서 신경 쓴 점
실사용 시나리오 중심 설계

“강의 끝나고 어디로 이동해야 하는지”

“이번 주 과제/팀플 일정을 한 번에 보고 싶다”

실제 캠퍼스 생활 상황을 기준으로 UX 설계

모바일 퍼스트

실제 사용 환경을 고려해 모바일 화면(430px) 기준으로 레이아웃과 컴포넌트 구성

바텀시트, 플로팅 버튼 등 모바일 친화적인 패턴 적극 활용

확장 가능성

한서대학교에만 묶이지 않고,

다른 대학교의 캠퍼스/강의 데이터만 교체하면 재사용 가능한 구조를 목표로 설계

🙋‍♂️ Frontend Developer – 김형석 (Hyungseok Kim)
Role

CAM-PL 서비스의 Frontend Developer

3인 팀(DE / FE / BE) 중 React 기반 화면 설계 및 구현 담당

Responsibilities

전체 화면 구조 및 라우팅 설계 (Home / Calendar / Timetable / Login 등)

네이버 지도 연동 및 시간표–지도 연결 로직 구현

일정 캘린더, 바텀시트, 모달 등 주요 UI 컴포넌트 구현

Axios를 활용한 API 연동 및 에러/로딩 상태 처리

Nginx 기반 프론트엔드 배포 스크립트 작성 및 서버 협업

Used Tools

개발: VS Code, Git, GitHub

API 테스트: Postman

UI/UX 작업 및 프로토타입: Figma

“실제 캠퍼스에서 바로 쓸 수 있는 서비스”를 목표로
기획부터 배포까지 전체 플로우를 경험한 프로젝트입니다.