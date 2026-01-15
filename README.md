# 개발자를 위한 그룹웨어 웹프로젝트 WORKNEED
<img width="1277" height="719" alt="스크린샷 2026-01-15 오후 1 26 16" src="https://github.com/user-attachments/assets/ff0e79e1-85b5-43b0-b5fd-59962e190b65" />



## 1. 프로젝트 개요
#### 배포 URL : https://work-need.com
#### 프로젝트명 : WorkNeed
#### 프로젝트 소개 : 개발자 특화 그룹웨어 서비스 개발 프로젝트

<br>

## 2. 개발 기간
#### 2025.12.02 ~ 2026.1.14

<br>

## 3. 팀원 구성

<div align="center">

| **유승재(팀장)** | **김민희(부팀장)** | **박성욱** | **이대훈** | **이성빈** | **윤태민** |
| :------: | :------: | :------: | :------: | :------: | :------: |
| [<img src="https://github.com/sonde8.png" height=120 width=120> <br/> @sonde8](https://github.com/sonde8) | [<img src="https://github.com/minhee0618.png" height=120 width=120> <br/> @minhee0618](https://github.com/minhee0618) | [<img src="https://github.com/park960.png" height=120 width=120> <br/> @park960](https://github.com/park960) | [<img src="https://github.com/daehoon1215.png" height=120 width=120> <br/> @daehoon1215](https://github.com/daehoon1215) | [<img src="https://github.com/2sungkong.png" height=120 width=120> <br/> @2sungkong](https://github.com/2sungkong) | [<img src="https://github.com/TAE-M0.png" height=120 width=120> <br/> @TAE-M0](https://github.com/TAE-M0) |

</div>

<br>

## 4. 개발환경
<table>
    <tr>
        <th>구분</th>
        <th>내용</th>
    </tr>
    <tr>
        <td>프론트엔드</td>
        <td>
            <img src="https://img.shields.io/badge/html5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
            <img src="https://img.shields.io/badge/css-1572B6?style=for-the-badge&logo=css3&logoColor=white">
            <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=JavaScript&logoColor=black"/>
        </td>
    </tr>
    <tr>
        <td>백엔드</td>
        <td>
            <img src="https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white">
            <img src="https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white">
            <img src="https://img.shields.io/badge/spring Boot-%236DB33F.svg?style=for-the-badge&logo=SpringBoot&logoColor=white">
        </td>
    </tr>
    <tr>
        <td>데이터베이스</td>
        <td>
            <img src="https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white">
        </td>
    </tr>
    <tr>
        <td>협업도구</td>
        <td>
            <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white">
            <img src="https://img.shields.io/badge/Notion-%23000000.svg?style=for-the-badge&logo=notion&logoColor=white">
            <img src="https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white">
        </td>
    </tr>
    <tr>
      <td>배포 및 운영환경</td>
      <td>
        <img src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white">
        <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white">
        <img src="https://img.shields.io/badge/Amazon%20S3-FF9900?style=for-the-badge&logo=amazons3&logoColor=white">
      </td>
    </tr>
</table>

<br>

## 5. 역할 분담

### 유승재
- 채팅 기능 담당
    - STOMP 기반 실시간 채팅 구축
    - 이미지, 채팅, 파일 전송
    - 전역 알림 시스템
    
- AWS 클라우드 인프라 설계
    - EC2, RDS, S3 스토리지 구축
 
- 자동화 배포
    - CI/CD 실시간 배포 자동화

<br>
 
### 김민희
- 페이지 공통 레이아웃 담당
  
- 게시판 
    - 게시물 업로드, 삭제
  
- 칸반보드 기반 일정/업무 관리
    - 업무 유형 분기 처리
    - 참여자 권한 흐름 관리
    - 통합관리(댓글,파일,진행률)

- 트랜젝션 기반 데이터 정합성 유지

<br>

### 박성욱
- 전자결재 핵심 로직 구현
    - OrderNum 기반 순차·병렬 결재 설계
    - 승인·반려·회수에 따른 문서 흐름 제어
    - Service + Query 분리 구조로 안정적인 결재 처리
 
<br>

### 이대훈
- 인증/보안 담당
    - STATUS 기반 인증 차단
    - CustomUserDetails인증
    - Global Advice 실시간 세션 무효화/퇴출

- 소셜 연동/계정 통합

- 관리자 권한/운영
    - RBAC + ACTIVE 상태 제한
    - 유저,관리자 변경 시 상세로그
 
<br>

### 이성빈
- 페이지 공통 레이아웃 담당

- 캘린더
    - 개인/업무 일정 통합 뷰 구축
    - FullCalendar 커스텀 및 분할 레이아웃 적용
 
<br>

### 윤태민
- 근태 관리 기능 담당
    - 출퇴근 기록 및 근무 상태 관리

- 근무 시간 집계
    - 일/주/월/연 누적 자동 계산
    - 연장 근무 시간 산출
 
- 출근부 및 근태 조회
    - 부서/권한별 근태 현황 조회
    - 월별로 조회 처리

<br>

## 6 .주요기능
### 1. 로그인, 회원가입
- 구글 연동 로그인, 유효성 검사, 인증 메일 전송

### 2. 관리자
- 회원 권한 관리, 직급 및 부서 생성, 관리자 계정 생성

### 3. 채팅
- 실시간 메시지 파일 이미지 전송, 전역 알림 시스템, 파일 보관함

### 4. 업무 관리
- 칸반 보드로 ToDo Doing Done 체계적 업무 관리
- 개인 팀 회사 업무 생성, 파일 보관함 깃허브 링크, 개인별 업무 진행도 확인

### 5. 캘린더
- 개인 일정 추가 및 삭제, 색 설정으로 구별하기 용이하게 설정 가능
- 업무 기능과 연동 되어 팀 프로젝트 일정 캘린더 등록

### 6. 전자결재
- 전자결재 작성 및 회수, 삭제, 반려, 승인
- 전자결재 결재자 선택 가능

### 7. 근태관리
- 출퇴근 및 연차 관리 등 기본적인 근태관리
- 그래프로 주 근무 상황 확인 가능

<br>

## 회원가입
![회원가입2](https://github.com/user-attachments/assets/a413e6f7-f6fe-4b45-b799-c9bae94461c7)



- 비밀번호란과 비밀번호 확인란이 일치 하지 않을 경우 안내 문구 출력
- 중복된 아이디와 이메일로 회원가입 불가능
- 이메일에 발송된 인증번호를 입력해야 회원가입이 가능

<br>

## 채팅
![채팅2](https://github.com/user-attachments/assets/68b794ff-77a4-4d74-9865-75bf93e6f6b0)


- 채팅방 생성 모달에서 사용자 검색 가능
- 개인, 단체 채팅방 개설 가능
- 부서별 트리 구조로 사용자 구분
- 파일, 이미지 전송 및 다운로드 가능
- 파일 보관함 기능 구현
- 전역적 알림 시스템 구현

<br>

## 캘린더

![캘린더](https://github.com/user-attachments/assets/3321e700-0a53-465c-904d-bec75d2c0a9e)
- 개인 일정 등록, 수정, 삭제 가능 (색깔 커스텀 가능)
- 드래그 앤 드롭으로 개인 일정 일정 변경 가능
- 업무와 연동하여 업무 일정 캘린더에 표시 (업무는 수정, 삭제 불가능)
- 월/주/일 별로 확인 가능
- 전체/업무/개인 별로 확인 가능


<br>

## 칸반보드

![칸반보드](https://github.com/user-attachments/assets/46578101-5d3a-410d-b0a4-25e996b93003)
- 개인, 팀, 회사별로 업무 생성 가능
- 팀 업무 생성 시 부서별 트리 구조로 사용자 구분, 전체 선택 기능
- 드래그 앤 드롭 기능으로 이동 가능 (Done 상태 업무는 이동 불가능)

<br>

## 칸반보드 상세 페이지
![칸반보드상세](https://github.com/user-attachments/assets/7acf086f-4d54-435d-b697-53542a947958)

- 개인 업무 추가 가능
- 드래그 앤 드롭으로 이동 가능
- 진행사항을 계산하여 원형 그래프로 진행도 시각화
- 파일 업로드 및 다운로드, 깃허브 주소 등록 가능
- 댓글 작성 가능
- 채팅 기능과 연동하여 채팅하러 가기 버튼 클릭 시 해당 프로젝트 인원 정보를 가지고 채팅 페이지로 이동

<br>

## 근태관리

![근태](https://github.com/user-attachments/assets/6eaba3ad-1e5b-46ae-9bc3-a57158c51dc2)

- 근태 메인페이지에서 주간 근무 실적 막대 그래프로 시각화, 근태 현황, 잔여 연차, 연간 근무 확인 가능
- 출퇴근 버튼 클릭 시 출퇴근 시간 화면에 출력
- 출근시 업무 상태 버튼을 클릭하여 색상 변경 가능
- 출근부에서 사용자의 근태 기록 확인 가능
- 연차관리에서 연차 신청 가능

<br>

## 전자결재
![전자결재](https://github.com/user-attachments/assets/d80ec29f-0263-4c8b-bc41-5f913712b75b)

- 결재 문서 작성 시 문서 유형 선택 가능
- 첨부 파일 첨부 가능
- 검토, 합의, 최종결재, 참조별로 인원 추가 가능

<br>

## 관리자
![관리](https://github.com/user-attachments/assets/ab7400ac-3a77-469c-964a-94d32aa14c58)

- 직원 상태 변경 가능 (부서, 직급, 계정 살태)
- 직급, 부서 생성 가능
- 관리자 생성 가능










