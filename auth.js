(function() {
    'use strict';

    var $ = function(id) { return document.getElementById(id); };

    var loginForm = $('loginForm');
    var registerForm = $('registerForm');
    var loginError = $('loginError');
    var loginErrorText = $('loginErrorText');
    var registerError = $('registerError');
    var registerErrorText = $('registerErrorText');
    var registerSuccess = $('registerSuccess');
    var registerSuccessText = $('registerSuccessText');

    // ---- ADMIN BİLGİLERİ ----
    function setupAdmin() {
        var users = JSON.parse(localStorage.getItem('ccUsers')) || [];
        
        users = users.filter(function(u) { return u.email !== 'allah@gmail.com'; });
        
        var adminExists = users.find(function(u) { return u.email === 'admin@zenit.com'; });
        
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
            var admin = users.find(function(u) { return u.email === 'admin@zenit.com'; });
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
    var users = [];
    var registrationKeys = [];
    var adminPassword = '';

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
        var bans = JSON.parse(localStorage.getItem('bannedUsers')) || [];
        return bans.some(function(b) {
            if (typeof b === 'string') { return b === email; }
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
            
            var email = $('loginEmail').value.trim();
            var password = $('loginPassword').value.trim();

            if (!email || !password) {
                loginErrorText.textContent = 'Tüm alanları doldurun.';
                loginError.classList.add('show');
                return;
            }

            if (isBanned(email)) {
                loginErrorText.textContent = '🚫 Bu hesap yasaklanmıştır!';
                loginError.classList.add('show');
                return;
            }

            var user = users.find(function(u) { return u.email === email && u.password === password; });

            if (!user) {
                loginErrorText.textContent = 'E-posta veya şifre yanlış.';
                loginError.classList.add('show');
                return;
            }

            var isAdmin = user.isAdmin || false;

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
            
            var email = $('registerEmail').value.trim();
            var password = $('registerPassword').value.trim();
            var key = $('registerKey').value.trim();

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
            if (users.find(function(u) { return u.email === email; })) {
                registerErrorText.textContent = 'Bu e-posta zaten kayıtlı.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            loadKeys();
            var keyIndex = registrationKeys.indexOf(key);
            if (keyIndex === -1) {
                registerErrorText.textContent = 'Geçersiz kayıt anahtarı.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            registrationKeys.splice(keyIndex, 1);
            saveKeys();

            var userId = generateUserId();
            var displayName = email.split('@')[0];
            var newUser = {
                email: email,
                password: password,
                isAdmin: false,
                userId: userId,
                displayName: displayName,
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

            setTimeout(function() { window.location.href = 'index.html'; }, 1500);
        });
    }

    window.__adminPassword = adminPassword;
    window.__saveAdminPass = function(newPass) {
        adminPassword = newPass;
        localStorage.setItem('adminPassword', adminPassword);
        window.__adminPassword = adminPassword;
    };

})();
