# Project_WorkNeed

# Git 가이드 
## 제가 브랜치도 다 분리해뒀어용


1. ⬇️ 저장소 클론 (프로젝트 가져오기)
프로젝트 코드를 로컬 환경에 다운로드합니다.

💻 IntelliJ IDEA GUI 사용 (권장)
IntelliJ IDEA 초기 화면에서 **Get from VCS**를 선택합니다.

Repository URL 필드에 다음 주소를 붙여넣습니다:

https://github.com/sonde8/Project_WorkNeed.git
프로젝트를 다운로드할 Directory를 지정합니다.

Clone 버튼을 클릭하여 프로젝트를 다운로드하고 IntelliJ로 엽니다.

⌨️ 터미널 명령어 사용 (대안)
원하는 폴더로 이동하여 다음 명령을 실행합니다.



git clone https://github.com/sonde8/Project_WorkNeed.git
2. 🌳 자신의 개발 브랜치로 전환 (Checkout)
클론 후에는 기본적으로 main 브랜치에 있습니다. 반드시 자신의 작업 브랜치로 전환해야 합니다.

💻 IntelliJ IDEA GUI 사용 (권장)
IntelliJ IDEA 우측 하단의 **브랜치 이름 (main)**을 클릭합니다.

나타나는 목록의 Remote 아래 origin 그룹을 펼칩니다.

자신이 맡은 브랜치(예: feature/Attendance, feature/Calendar)를 찾아 클릭합니다.

Checkout 버튼을 눌러 해당 브랜치로 전환합니다.

⌨️ 터미널 명령어 사용 (대안)
터미널에서 자신의 브랜치 이름으로 전환합니다.



# 예: 근태 관리를 맡은 팀원
git checkout feature/Attendance
3. 📝 작업 및 커밋, 푸시 (협업 루틴)
자신의 브랜치로 이동했다면, 이제 개발 작업을 시작합니다.

A. 작업 시작 전: 최신 내용 가져오기 (Pull)
매일 작업을 시작하기 전 또는 중요한 작업 시작 전에 main 브랜치에 다른 팀원들이 병합한 최신 내용이 있는지 확인하고 가져와야 합니다.



# 자신의 브랜치에 있는 상태에서 실행
git pull origin main
(main의 변경 사항을 자신의 브랜치에 통합합니다.)

B. 코드 작성 및 커밋 (Commit)
코드 작성: 자신의 기능에 해당하는 코드를 작성합니다.

변경 사항 확인: IntelliJ 좌측 하단 Commit 탭에서 변경된 파일들을 확인합니다.

커밋 메시지 작성: 정해진 규칙에 따라 커밋 메시지를 작성합니다. (예: feat:, fix:, refactor: 사용)



# 예시
git commit -m "feat: Members 회원가입 API 컨트롤러 작성"
C. 자신의 브랜치에 푸시 (Push)
로컬에서 커밋한 내용을 GitHub의 자신의 브랜치에 반영합니다.



# [자신의_브랜치_이름]을 정확히 입력
git push origin [자신의 브랜치 이름]
예시: git push origin feature/Members
