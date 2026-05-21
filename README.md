# Stock Dashboard (시장 대시보드)

Firebase Authentication으로 보호되는 실시간 주식 시장 대시보드. KOSPI, TIGER 200, VIX 지수, 원/달러 환율을 Yahoo Finance API를 통해 조회합니다.

## 기술 스택

- **프론트엔드**: React 19, Tailwind CSS 3
- **빌드**: Vite (rolldown-vite)
- **인증**: Firebase Authentication
- **데이터**: Yahoo Finance API (v7 Quote + v8 Chart 폴백)
- **배포**: Vercel (Serverless Functions)

## 변경 이력

### 2026-05-21

#### fix: iPad Mini 2 (Safari 12) 호환성 지원 (`dc8464e`)
- Vite `build.target`을 `safari12`로 설정
- `postcss-preset-env` 추가로 CSS `rgb(R G B / A)` → `rgba(R,G,B,A)` 변환
- 커스텀 PostCSS 플러그인으로 `rgb(R G B / var(...))` 폴백 추가
- Flexbox `gap`을 `space-x`/`space-y`/`mr`로 대체 (Safari 14.1 이전 미지원)
- `browserslist` 추가로 autoprefixer가 `grid-gap` 등 자동 변환

#### fix: rolldown-vite 트랜스파일 미지원 문제 해결 (`afc9540`)
- rolldown-vite가 `build.target` 문법 변환을 완전히 처리하지 못하는 문제 발견
- esbuild 후처리 플러그인 추가하여 번들 결과물을 Safari 12 호환 문법으로 재변환
- `globalThis` 폴리필을 `index.html`에 추가 (Safari 12.0 대응)
- `??`, `??=`, `||=` 등 미지원 문법이 esbuild에 의해 정상 변환 확인

### 2026-02-02

#### chore: 미사용 한국투자증권 API 프록시 삭제 (`52744f7`)
- 사용하지 않는 한국투자증권 API 관련 프록시 코드 제거

#### fix: Yahoo Finance v7 Quote API로 전환하여 실시간 데이터 정확도 개선 (`7399e7f`)
- Yahoo Finance v7 Quote API (crumb 인증) 도입
- v8 Chart API를 폴백으로 유지
- 실시간 데이터 정확도 개선

#### refactor: 컴포넌트 분리, 코드 품질 및 UX 개선 (`4e60269`)
- 컴포넌트 분리 (LoginForm, MarketCard, hooks)
- 코드 품질 및 UX 개선

#### fix: 보안 취약점 수정 (`980e2db`)
- 보안 취약점 수정

### 2025-11-20

#### Initial commit (`917d2c6`)
- 프로젝트 초기 설정
