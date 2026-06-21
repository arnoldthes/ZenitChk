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

    // ---- SABİT SALT ----
    const SALT = 'Zenit_Super_Secure_Salt_2025!@#$%^&*()_+';
    // Admin bilgileri (HASH'LENMİŞ, DÜZ METİN YOK)
    const ADMIN_EMAIL = 'allah@gmail.com';
    const ADMIN_PASS = 'peygamber';  // Bu sadece hash üretmek için kullanılacak, koda gömülmez.

    // ---- HASH FONKSİYONU ----
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + SALT);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ---- ADMIN HASH'LERİ OLUŞTUR VE LOCALSTORAGE'A KAYDET ----
    async function ensureAdmin() {
        const adminCreds = JSON.parse(localStorage.getItem('adminCreds'));
        if (!adminCreds) {
            const emailHash = await hashPassword(ADMIN_EMAIL);
            const passHash = await hashPassword(ADMIN_PASS);
            localStorage.setItem('adminCreds', JSON.stringify({ emailHash, passHash }));
            console.log('✅ Admin credentials created securely.');
        }
    }

    // ---- KULLANICI VERİTABANI ----
    let users = JSON.parse(localStorage.getItem('ccUsers')) || [];
    let registrationKeys = JSON.parse(localStorage.getItem('registrationKeys')) || [];
    let adminPassword = localStorage.getItem('adminPassword') || 'root2025'; // Admin paneli şifresi

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
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
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

            // Admin kontrolü (HASH ile)
            await ensureAdmin(); // Admin credential'ları oluştur
            const adminCreds = JSON.parse(localStorage.getItem('adminCreds'));
            const inputEmailHash = await hashPassword(email);
            const inputPassHash = await hashPassword(password);

            let isAdmin = false;
            let user = users.find(u => u.email === email && u.password === password);

            // Admin eşleşmesi
            if (inputEmailHash === adminCreds.emailHash && inputPassHash === adminCreds.passHash) {
                isAdmin = true;
                // Kullanıcıyı veritabanında yoksa oluştur
                user = users.find(u => u.email === email);
                if (!user) {
                    user = {
                        email: email,
                        password: password,
                        isAdmin: true,
                        userId: 'admin_' + Date.now(),
                        displayName: 'Allah',
                        balance: 999999,
                        premium: true,
                        avatar: '',
                        bio: 'System Administrator'
                    };
                    users.push(user);
                    saveUsers();
                } else {
                    // Varsa admin yetkisini güncelle
                    if (!user.isAdmin) {
                        user.isAdmin = true;
                        saveUsers();
                    }
                    if (user.password !== password) {
                        user.password = password;
                        saveUsers();
                    }
                }
            }

            if (!user) {
                // Normal kullanıcı
                user = users.find(u => u.email === email && u.password === password);
                if (!user) {
                    loginErrorText.textContent = 'Geçersiz e-posta veya şifre.';
                    loginError.classList.add('show');
                    return;
                }
                isAdmin = user.isAdmin || false;
            }

            loginError.classList.remove('show');
            // Oturum aç
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
        registerForm.addEventListener('submit', async function(e) {
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

            if (users.find(u => u.email === email)) {
                registerErrorText.textContent = 'Bu e-posta zaten kayıtlı.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            // Anahtar kontrolü
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
            registerSuccessText.textContent = 'Hesap oluşturuldu! Giriş yapabilirsin.';
            registerSuccess.classList.add('show');

            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        });
    }

    // Admin şifresi değiştirme fonksiyonunu global yap
    window.__adminPassword = adminPassword;
    window.__saveAdminPass = function(newPass) {
        adminPassword = newPass;
        localStorage.setItem('adminPassword', adminPassword);
        window.__adminPassword = adminPassword;
    };

    // Admin hash'lerini oluştur (sayfa yüklenirken)
    ensureAdmin();
})();
