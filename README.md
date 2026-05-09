# Next.js 실시간 채팅 서비스 (WebSocket)

이 프로젝트는 `Socket.io`와 `Next.js`를 활용하여 구축된 실시간 채팅 애플리케이션입니다. 방 기반의 실시간 통신, 메시지 이력 관리, 파일 공유 및 설문조사 등 현대적인 채팅 기능을 포함하고 있습니다.

## 🚀 주요 기능

### 1. 실시간 통신 (WebSocket)
- **Room 기반 채팅:** 특정 방(Room)에 입장하여 해당 방의 사용자들과만 메시지 격리 통신.
- **접속자 관리:** 실시간으로 방별 접속자 목록(`online-users`) 확인 가능.
- **상태 동기화:** 사용자의 입력 중 표시(`typing`), 입장/퇴장 시스템 메시지 알림.

### 2. 메시지 및 검색
- **무한 스크롤:** 커서 기반 페이지네이션을 통한 과거 메시지 이력 조회.
- **메시지 검색:** 키워드 입력을 통한 특정 메시지 내역 검색 지원.
- **링크 프리뷰:** 메시지 내 URL 포함 시 자동으로 메타데이터를 추출하여 미리보기 제공.

### 3. 파일 및 설문조사
- **파일 공유:** 이미지(PNG, JPG) 및 PDF 파일 업로드 및 공유 (최대 10MB).
- **실시간 설문조사:** 채팅 중 설문을 생성하고, 구성원들의 투표 결과를 실시간으로 확인.

### 4. 기타 편의 기능
- **챗봇 (Bot Helper):** `/도움말` 등 명령어를 통한 자동 응답 시스템.
- **반응형 UI:** Shadcn UI와 Tailwind CSS를 사용한 깔끔하고 직관적인 디자인.

## 🛠 기술 스택

- **Framework:** Next.js (App Router + Pages Router)
- **Real-time:** Socket.io
- **Database:** Prisma + PostgreSQL
- **UI:** Shadcn UI, Tailwind CSS, SCSS Module
- **Language:** TypeScript

## ⚙️ 설정 및 실행 방법

### 1. 환경 변수 설정
`.env` 파일을 생성하고 다음 변수들을 설정해야 합니다.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 2. 패키지 설치 및 DB 설정
```bash
# 의존성 설치
npm install

# Prisma 클라이언트 생성 및 DB 마이그레이션
npx prisma generate
npx prisma migrate dev
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속 시 확인 가능합니다.

## 📂 프로젝트 구조

- `src/app/api`: REST API 엔드포인트 (메시지 조회, 검색, 파일 업로드)
- `src/pages/api/socket`: Socket.io 서버 로직 및 이벤트 핸들러
- `src/components/chat`: 채팅 UI 구성 요소 (방, 메시지 리스트, 입력창, 설문 등)
- `src/components/providers`: SocketContext 등 전역 상태 관리
- `src/lib`: Prisma 및 Socket 싱글톤 인스턴스 관리
- `src/types`: 소켓 및 데이터 타입 정의

---
상세한 개발 표준 및 아키텍처 정보는 [GEMINI.md](./GEMINI.md)를 참고하세요.
