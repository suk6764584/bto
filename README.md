# B-GUIDE LINK

부산관광공사 공공데이터 기반 **부산 외국어 관광안내 연결 내비게이터** PoC입니다.

## GitHub Pages

- 목표 URL: https://suk6764584.github.io/bto/
- 정적 페이지: `index.html`
- 데이터 번들: `data/guide-data.js + data/signals-data.js`
- 원본 해설지 데이터 확인용: `data/guide_places.json`

## 사용 데이터

- 부산관광공사 문화관광해설사의 집 공개데이터: 위치, 운영시간, 휴무일, 평균근무인원, 영어/일본어/중국어 지원 여부 등
- Visit Busan 행사 일정: 관리자 운영 주의 신호용
- 부산항만공사/ChainPortal 크루즈 정보: 관리자 운영 주의 신호 연결용
- 부산버스정보시스템/공공데이터포털: 실서비스 대중교통 연결 지점
- 한국관광공사 TourAPI: 실서비스 공식 관광정보 RAG 연결 지점

> 주의: PoC는 공개데이터에 없는 실제 해설사 출근 여부, 실시간 대기시간, 언어 수요 확률을 임의 생성하지 않습니다.

## 구조

```text
.
├─ index.html
├─ .nojekyll
├─ assets/
│  ├─ styles.css
│  ├─ app-core.js
│  ├─ app-features.js
│  └─ app-admin-init.js
└─ data/
   ├─ guide-data.js
   ├─ signals-data.js
   └─ guide_places.json
```
