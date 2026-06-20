(function() {
    'use strict';

    const $ = id => document.getElementById(id);

    const loginForm = $('loginForm');
    const registerForm = $('registerForm');
    const loginError = $('loginError');
    const loginErrorText = $('loginErrorText');
    const registerError = $('registerError');
    const registerErrorText = $('registerErrorText');
    const registerSuccess = $('registerSuccess');
    const registerSuccessText = $('registerSuccessText');

    // ---- ADMIN BİLGİLERİ (localStorage) ----
    let adminCreds = JSON.parse(localStorage.getItem('adminCreds'));
    if (!adminCreds) {
        adminCreds = {
            email: 'apomuhammed1@gmail.com',
            password: 'Tamam893'
        };
        localStorage.setItem('adminCreds', JSON.stringify(adminCreds));
    }

    let users = JSON.parse(localStorage.getItem('ccUsers')) || [];
    let registrationKeys = JSON.parse(localStorage.getItem('registrationKeys')) || [];
    let adminPassword = localStorage.getItem('adminPassword') || 'adminpanel';

    function saveUsers() { localStorage.setItem('ccUsers', JSON.stringify(users)); }
    function saveKeys() { localStorage.setItem('registrationKeys', JSON.stringify(registrationKeys)); }

    function generateUserId() {
        return 'user_' + Math.random().toString(36).substring(2, 8);
    }

    function isBanned(email) {
        const bans = JSON.parse(localStorage.getItem('bannedUsers')) || [];
        const found = bans.find(b => {
            if (typeof b === 'string') return b === email;
            return b.email === email;
        });
        if (found) {
            if (typeof found !== 'string' && found.duration && found.duration !== 'permanent') {
                const elapsed = (Date.now() - found.timestamp) / 60000;
                if (elapsed >= found.duration) {
                    const newBans = bans.filter(b => b.email !== email);
                    localStorage.setItem('bannedUsers', JSON.stringify(newBans));
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    // ---- LOGIN ----
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = $('loginEmail').value.trim();
            const password = $('loginPassword').value.trim();

            if (!email || !password) {
                loginErrorText.textContent = 'Please fill all fields.';
                loginError.classList.add('show');
                return;
            }

            if (isBanned(email)) {
                loginErrorText.textContent = '🚫 This account has been permanently banned!';
                loginError.classList.add('show');
                return;
            }

            let user = users.find(u => u.email === email && u.password === password);
            let isAdmin = false;

            // Admin credential'lar ile giriş yapılıyor mu?
            if (email === adminCreds.email && password === adminCreds.password) {
                isAdmin = true;
                // Kullanıcı zaten var mı?
                user = users.find(u => u.email === email);
                if (!user) {
                    // Admin kullanıcısı yoksa otomatik oluştur
                    user = {
                        email: email,
                        password: password,
                        isAdmin: true,
                        userId: 'admin_' + Date.now(),
                        displayName: 'Admin',
                        balance: 999999,
                        premium: true,
                        avatar: '',
                        bio: 'System Administrator'
                    };
                    users.push(user);
                    saveUsers();
                } else {
                    // Var ama admin değilse admin yap
                    if (!user.isAdmin) {
                        user.isAdmin = true;
                        saveUsers();
                    }
                    // Şifresi değişmiş olabilir, güncelle
                    if (user.password !== password) {
                        user.password = password;
                        saveUsers();
                    }
                }
            }

            // Eğer user hala null ise (normal kullanıcı girişi)
            if (!user) {
                user = users.find(u => u.email === email && u.password === password);
                if (!user) {
                    loginErrorText.textContent = 'Invalid email or password.';
                    loginError.classList.add('show');
                    return;
                }
                // Admin değilse isAdmin false
                isAdmin = user.isAdmin || false;
            }

            loginError.classList.remove('show');
            localStorage.setItem('ccSession', JSON.stringify({
                email: user.email,
                isAdmin: isAdmin,
                userId: user.userId,
                displayName: user.displayName || user.email.split('@')[0],
                avatar: user.avatar || '',
                bio: user.bio || ''
            }));
            window.location.href = 'dashboard.html';
        });
    }

    // ---- REGISTER ----
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = $('registerEmail').value.trim();
            const password = $('registerPassword').value.trim();
            const key = $('registerKey').value.trim();

            if (!email || !password) {
                registerErrorText.textContent = 'Email and password are required.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            if (!key) {
                registerErrorText.textContent = 'Registration key is required.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            if (users.find(u => u.email === email)) {
                registerErrorText.textContent = 'This email is already registered.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            const keyIndex = registrationKeys.indexOf(key);
            if (keyIndex === -1) {
                registerErrorText.textContent = 'Invalid registration key.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            registrationKeys.splice(keyIndex, 1);
            saveKeys();

            const userId = generateUserId();
            const displayName = email.split('@')[0];
            users.push({
                email,
                password,
                isAdmin: false,
                userId,
                displayName,
                balance: 0,
                premium: false,
                avatar: '',
                bio: ''
            });
            saveUsers();

            registerError.classList.remove('show');
            registerSuccessText.textContent = 'Account created! You can now login.';
            registerSuccess.classList.add('show');

            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        });
    }

    window.__adminPassword = adminPassword;
    window.__saveAdminPass = function(newPass) {
        adminPassword = newPass;
        localStorage.setItem('adminPassword', adminPassword);
        window.__adminPassword = adminPassword;
    };
})();