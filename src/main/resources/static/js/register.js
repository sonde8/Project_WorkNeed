document.addEventListener('DOMContentLoaded', function () {
    const mainBtn = document.getElementById('mainBtn');
    const emailInput = document.getElementById('userEmail');
    const idInput = document.querySelector('input[name="userLoginId"]');
    const pwInput = document.querySelector('input[name="userPassword"]');
    const authGroup = document.getElementById('authCodeGroup');
    const authInput = document.getElementById('authCode');
    const registerForm = document.getElementById('registerForm');
    const birthdayInput = document.getElementById('userBirthday');

    let isEmailVerified = false;

   // 1. 생년월일 설정 및 키보드 입력 차단
   if (birthdayInput) {
       const today = new Date().toISOString().split("T")[0];
       const minDate = "1930-01-01";
       birthdayInput.setAttribute("min", minDate);
       birthdayInput.setAttribute("max", today);
       birthdayInput.addEventListener('keydown', function(e) {
           e.preventDefault();
       });
   }

   // 비밀번호 확인 관련
   const pwConfirmInput = document.getElementById('passwordConfirm');
   const pwMsg = document.getElementById('passwordMatchMsg');

   function checkPasswordMatch() {
       const pw = pwInput.value;
       const confirm = pwConfirmInput.value;

       if (!pw || !confirm) {
           pwMsg.textContent = "";
           pwMsg.className = "password-msg";
           return;
       }

       // ✅ 비밀번호 정책 체크 먼저 (8자 + 영문 + 숫자 + 특수문자)
       const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
       if (!pwRegex.test(pw)) {
           pwMsg.textContent = "비밀번호는 영어, 숫자, 특수문자 포함 8자 이상이어야 합니다.";
           pwMsg.className = "password-msg error";
           return;
       }

       if (pw === confirm) {
           pwMsg.textContent = "비밀번호가 일치합니다.";
           pwMsg.className = "password-msg success";
       } else {
           pwMsg.textContent = "비밀번호가 일치하지 않습니다.";
           pwMsg.className = "password-msg error";
       }
   }

   pwInput.addEventListener('input', checkPasswordMatch);
   pwConfirmInput.addEventListener('input', checkPasswordMatch);



    const phoneInput = document.getElementById('userPhone');
    const phoneMsg = document.getElementById('phoneMsg');

    function validatePhone() {
        // 숫자만 허용
        phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');

        const isValid = /^010\d{8}$/.test(phoneInput.value);

       if (!isValid && phoneInput.value.length > 0) {
               phoneMsg.textContent = "010으로 시작하는 숫자 11자리만 입력하세요.";
               phoneMsg.style.color = "red";
               phoneMsg.style.display = "block";
           } else {
               phoneMsg.textContent = "";
               phoneMsg.style.display = "none";
           }

        return isValid;
    }

     // 전화번호 유효할 때만 버튼 활성화
               function updateMainBtnState() {
                   mainBtn.disabled = !validatePhone();
               }

              phoneInput.addEventListener('input', () => {
                  validatePhone();
                  updateMainBtnState();
              });

    phoneInput.addEventListener('blur', validatePhone);

    updateMainBtnState();

    // 2. 메인 버튼 클릭 이벤트
    mainBtn.addEventListener('click', function (e) {

        //  이미 인증이 완료된 상태라면 JS 로직을 타지 않고 바로 폼 제출
        if (isEmailVerified) {
            return;
        }

        // 인증 전에는 기본 submit 동작을 막음
        e.preventDefault();

        // [단계 1] 인증번호 발송 단계
        if (authGroup.style.display === 'none' || authGroup.style.display === '') {
            const email = emailInput.value;
            const loginId = idInput.value;
            const password = pwInput.value;

            // 유효성 체크
            if (!loginId || !email.includes('@')) {
                alert("아이디와 이메일을 정확히 입력해주세요.");
                return;
            }

            // 비밀번호 정규식 체크 (영어, 숫자, 특수문자 포함 8자 이상)
            const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            if (!pwRegex.test(password)) {
                alert("비밀번호는 영어, 숫자, 특수문자 포함 8자 이상이어야 합니다.");
                return;
            }

            mainBtn.innerText = "중복 확인 및 발송 중...";
            mainBtn.disabled = true;

            fetch(`/api/mail/send?email=${encodeURIComponent(email)}&loginId=${encodeURIComponent(loginId)}`, {
                method: 'POST'
            })
            .then(async res => {
                if (res.ok) {
                    alert("인증번호가 발송되었습니다.");
                    authGroup.style.display = 'flex'; // 인증번호 입력창 표시
                    mainBtn.innerText = "인증번호 확인";
                } else {
                    const errorMsg = await res.text();
                    alert(errorMsg || "발송 실패 (중복된 아이디나 이메일일 수 있습니다)");
                    mainBtn.innerText = "인증번호 받기";
                }
            })
            .catch(() => {
                alert("서버 통신 오류");
                mainBtn.innerText = "인증번호 받기";
            })
            .finally(() => {
                mainBtn.disabled = false;
            });
        }

        // [단계 2] 인증번호 확인 단계
        else {
            const code = authInput.value;
            if (!code) {
                alert("인증번호를 입력해주세요.");
                return;
            }

            mainBtn.innerText = "확인 중...";
            mainBtn.disabled = true;

            fetch('/api/mail/verify?code=' + encodeURIComponent(code), {
                method: 'POST'
            })
            .then(res => res.json())
            .then(success => {
                if (success) {
                    alert("인증 성공! 가입 버튼을 눌러 완료하세요.");
                    isEmailVerified = true;
                    authGroup.style.display = 'none';

                    mainBtn.innerText = "가입 완료";
                    mainBtn.setAttribute('type', 'submit');
                    mainBtn.disabled = false;
                } else {
                    alert("인증번호가 틀렸습니다.");
                    mainBtn.innerText = "인증번호 확인";
                    mainBtn.disabled = false;
                }
            })
            .catch(() => {
                alert("인증 처리 중 오류 발생");
                mainBtn.disabled = false;
            });
        }
    });
});
