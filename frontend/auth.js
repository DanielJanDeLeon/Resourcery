// PASSWORD VISIBILITY TOGGLE
function togglePasswordVisibility(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        toggleElement.textContent = '⊘';
    } else {
        input.type = 'password';
        toggleElement.textContent = '⊙';
    }
}

// EMAIL VALIDATION
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// PASSWORD STRENGTH INDICATOR
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
}

function updatePasswordStrength(passwordId) {
    const passwordInput = document.getElementById(passwordId);
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    if (!passwordInput || !strengthBar || !strengthText) return;

    const password = passwordInput.value;
    const strength = checkPasswordStrength(password);

    if (password.length === 0) {
        strengthBar.parentElement.style.display = 'none';
        strengthText.style.display = 'none';
        return;
    }

    strengthBar.parentElement.style.display = 'block';
    strengthText.style.display = 'block';

    const percentage = (strength / 6) * 100;
    strengthBar.style.width = percentage + '%';

    if (strength <= 2) {
        strengthBar.style.backgroundColor = '#e74c3c';
        strengthText.textContent = 'Weak password';
        strengthText.style.color = '#e74c3c';
    } else if (strength <= 4) {
        strengthBar.style.backgroundColor = '#f39c12';
        strengthText.textContent = 'Medium password';
        strengthText.style.color = '#f39c12';
    } else {
        strengthBar.style.backgroundColor = '#27ae60';
        strengthText.textContent = 'Strong password';
        strengthText.style.color = '#27ae60';
    }
}

// PASSWORD MATCH VALIDATION
function checkPasswordMatch() {
    const password = document.getElementById('registerPassword');
    const confirm = document.getElementById('confirmPassword');
    const matchDiv = document.getElementById('passwordMatch');
    if (!password || !confirm || !matchDiv) return;

    if (confirm.value.length === 0) {
        matchDiv.innerHTML = '';
        return;
    }

    if (password.value === confirm.value) {
        matchDiv.innerHTML = '<div class="success-icon" style="display: block;">✓ Passwords match</div>';
    } else {
        matchDiv.innerHTML = '<div class="error-icon" style="display: block;">✕ Passwords do not match</div>';
    }
}

// FORM VALIDATION
function validateLoginForm() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    if (!emailInput || !passwordInput) return false;

    const email = emailInput.value;
    const password = passwordInput.value;
    let isValid = true;

    if (!validateEmail(email)) {
        emailInput.classList.add('invalid');
        if (emailInput.nextElementSibling) {
            emailInput.nextElementSibling.style.display = 'block';
        }
        isValid = false;
    } else {
        emailInput.classList.remove('invalid');
        emailInput.classList.add('valid');
        if (emailInput.nextElementSibling) {
            emailInput.nextElementSibling.style.display = 'none';
        }
    }

    if (password.length < 6) {
        passwordInput.classList.add('invalid');
        isValid = false;
    } else {
        passwordInput.classList.remove('invalid');
        passwordInput.classList.add('valid');
    }

    return isValid;
}

function validateRegisterForm() {
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const confirmInput = document.getElementById('confirmPassword');
    if (!fullnameInput || !emailInput || !passwordInput || !confirmInput) return false;

    const fullname = fullnameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    let isValid = true;

    if (fullname.trim().length < 3) {
        fullnameInput.classList.add('invalid');
        isValid = false;
    } else {
        fullnameInput.classList.remove('invalid');
        fullnameInput.classList.add('valid');
    }

    if (!validateEmail(email)) {
        emailInput.classList.add('invalid');
        isValid = false;
    } else {
        emailInput.classList.remove('invalid');
        emailInput.classList.add('valid');
    }

    if (password.length < 6) {
        passwordInput.classList.add('invalid');
        isValid = false;
    } else {
        passwordInput.classList.remove('invalid');
        passwordInput.classList.add('valid');
    }

    if (password !== confirm) {
        isValid = false;
    }

    return isValid;
}

// REAL-TIME EVENT LISTENERS
document.addEventListener('DOMContentLoaded', function () {
    const loginEmail = document.getElementById('loginEmail');
    if (loginEmail) {
        loginEmail.addEventListener('blur', function () {
            if (!validateEmail(this.value)) {
                this.classList.add('invalid');
            } else {
                this.classList.remove('invalid');
                this.classList.add('valid');
            }
        });

        loginEmail.addEventListener('input', function () {
            if (this.classList.contains('invalid')) {
                this.classList.remove('invalid');
                if (this.nextElementSibling) {
                    this.nextElementSibling.style.display = 'none';
                }
            }
        });
    }

    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('input', function () {
            updatePasswordStrength('registerPassword');
        });
    }

    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', function () {
            checkPasswordMatch();
        });
    }

    const loginFormAction = document.querySelector('form[action*="resourcery.php"] input[name="action"][value="login"]');
    if (loginFormAction && loginFormAction.parentElement) {
        loginFormAction.parentElement.addEventListener('submit', function (e) {
            if (!validateLoginForm()) {
                e.preventDefault();
                const card = document.querySelector('.form-card');
                if (card) {
                    card.classList.add('shake');
                    setTimeout(() => card.classList.remove('shake'), 300);
                }
            } else {
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) {
                    loginBtn.classList.add('btn-loading');
                    loginBtn.innerHTML = '<span class="spinner"></span>Logging in...';
                }
            }
        });
    }

    const registerFormAction = document.querySelector('form[action*="resourcery.php"] input[name="action"][value="register"]');
    if (registerFormAction && registerFormAction.parentElement) {
        registerFormAction.parentElement.addEventListener('submit', function (e) {
            if (!validateRegisterForm()) {
                e.preventDefault();
                const card = document.querySelector('.form-card');
                if (card) {
                    card.classList.add('shake');
                    setTimeout(() => card.classList.remove('shake'), 300);
                }
            } else {
                const registerBtn = document.getElementById('registerBtn');
                if (registerBtn) {
                    registerBtn.classList.add('btn-loading');
                    registerBtn.innerHTML = '<span class="spinner"></span>Creating account...';
                }
            }
        });
    }

    const formCard = document.querySelector('.form-card');
    if (formCard) {
        formCard.classList.add('fade-in');
    }
});

