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

    // ---- ADMIN BİLGİLERİ ----
    function setupAdmin() {
        let users = JSON.parse(localStorage.getItem('ccUsers')) || [];
        
        users = users.filter(u => u.email !== 'allah@gmail.com');
        
        const adminExists = users.find(u => u.email === 'admin@zenit.com');
        
        if (!adminExists) {
            users.push({
                email: 'admin@zenit.com',
                password: 'Admin123!',
                isAdmin: true,
                userId: 'admin_001',
                displayName: 'Admin',
                balance: 999999,
                premium: true,
                avatar: '',
                bio: 'System Administrator'
            });
            localStorage.setItem('ccUsers', JSON.stringify(users));
        } else {
            const admin = users.find(u => u.email === 'admin@zenit.com');
            if (!admin.isAdmin) {
                admin.isAdmin = true;
                localStorage.setItem('ccUsers', JSON.stringify(users));
            }
            if (admin.password !== 'Admin123!') {
                admin.password = 'Admin123!';
                localStorage.setItem('ccUsers', JSON.stringify(users));
            }
        }

        if (!localStorage.getItem('adminPassword')) {
            localStorage.setItem('adminPassword', 'Zenit2025!');
        }

        if (!localStorage.getItem('registrationKeys')) {
            localStorage.setItem('registrationKeys', JSON.stringify([]));
        }
    }

    // ---- KULLANICI VERİTABANI ----
    let users = [];
    let registrationKeys = [];
    let adminPassword = '';

    function loadUsers() {
        users = JSON.parse(localStorage.getItem('ccUsers')) || [];
    }
    function loadKeys() {
        registrationKeys = JSON.parse(localStorage.getItem('registrationKeys')) || [];
    }
    function loadAdminPass() {
        adminPassword = localStorage.getItem('adminPassword') || 'Zenit2025!';
    }

    function saveUsers() { localStorage.setItem('ccUsers', JSON.stringify(users)); }
    function saveKeys() { localStorage.setItem('registrationKeys', JSON.stringify(registrationKeys)); }

    function generateUserId() {
        return 'user_' + Math.random().toString(36).substring(2, 8);
    }

    function isBanned(email) {
        const bans = JSON.parse(localStorage.getItem('bannedUsers')) || [];
        return bans.some(b => {
            if (typeof b === 'string') return b === email;
            return b.email === email;
        });
    }

    // ---- SAYFA YÜKLENİRKEN ----
    setupAdmin();
    loadUsers();
    loadKeys();
    loadAdminPass();

    // ---- LOGIN ----
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            setupAdmin();
            loadUsers();
            
            const email = $('loginEmail').value.trim();
            const password = $('loginPassword').value.trim();

            if (!email || !password) {
                loginErrorText.textContent = 'Tüm alanları doldurun.';
                loginError.classList.add('show');
                return;
            }

            if (isBanned(email)) {
                loginErrorText.textContent = '🚫 Bu hesap kalıcı olarak yasaklanmıştır!';
                loginError.classList.add('show');
                return;
            }

            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                loginErrorText.textContent = 'E-posta veya şifre yanlış.';
                loginError.classList.add('show');
                return;
            }

            const isAdmin = user.isAdmin || false;

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
                registerErrorText.textContent = 'E-posta ve şifre zorunludur.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            if (!key) {
                registerErrorText.textContent = 'Kayıt anahtarı zorunludur.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            if (email === 'admin@zenit.com') {
                registerErrorText.textContent = 'Bu e-posta zaten kayıtlı.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            loadUsers();
            if (users.find(u => u.email === email)) {
                registerErrorText.textContent = 'Bu e-posta zaten kayıtlı.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            loadKeys();
            const keyIndex = registrationKeys.indexOf(key);
            if (keyIndex === -1) {
                registerErrorText.textContent = 'Geçersiz kayıt anahtarı.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            registrationKeys.splice(keyIndex, 1);
            saveKeys();

            const userId = generateUserId();
            const displayName = email.split('@')[0];
            const newUser = {
                email,
                password,
                isAdmin: false,
                userId,
                displayName,
                balance: 0,
                premium: false,
                avatar: '',
                bio: ''
            };
            users.push(newUser);
            saveUsers();

            registerError.classList.remove('show');
            registerSuccessText.textContent = '✅ Hesap oluşturuldu! Giriş yapabilirsin.';
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
