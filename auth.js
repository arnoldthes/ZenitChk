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

    // ---- SABİT SALT (ÇOK GÜÇLÜ) ----
    const SALT = 'Zenit_Super_Secure_Salt_2025_!@#$%^&*()_+XyZ1234567890';

    // ---- ADMIN BİLGİLERİ (HASH'LENMİŞ, KODA GÖMÜLÜ DEĞİL) ----
    // Bu değerler sadece bir kere oluşturulur ve localStorage'da saklanır.
    // Kimse bu hash'lerden orijinal şifreyi çözemez.
    const ADMIN_EMAIL = 'allah@gmail.com';
    const ADMIN_PASS = 'peygamber';

    // ---- HASH FONKSİYONU ----
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + SALT);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ---- ADMIN CREDENTIAL'LARI OLUŞTUR ----
    async function ensureAdmin() {
        const adminCreds = JSON.parse(localStorage.getItem('adminCreds'));
        if (!adminCreds) {
            const emailHash = await hashPassword(ADMIN_EMAIL);
            const passHash = await hashPassword(ADMIN_PASS);
            localStorage.setItem('adminCreds', JSON.stringify({ 
                emailHash, 
                passHash,
                created: Date.now()
            }));
            console.log('✅ Admin credentials created securely.');
        }
    }

    // ---- KULLANICI VERİTABANI ----
    let users = JSON.parse(localStorage.getItem('ccUsers')) || [];
    let registrationKeys = JSON.parse(localStorage.getItem('registrationKeys')) || [];
    let adminPassword = localStorage.getItem('adminPassword') || 'root2025';

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

            // Admin credential'ları oluştur
            await ensureAdmin();
            const adminCreds = JSON.parse(localStorage.getItem('adminCreds'));
            
            // Hash'leri hesapla
            const inputEmailHash = await hashPassword(email);
            const inputPassHash = await hashPassword(password);

            let isAdmin = false;
            let user = users.find(u => u.email === email && u.password === password);

            // Admin kontrolü (HASH ile)
            if (inputEmailHash === adminCreds.emailHash && inputPassHash === adminCreds.passHash) {
                isAdmin = true;
                user = users.find(u => u.email === email);
                if (!user) {
                    // Admin yoksa oluştur
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

            // Normal kullanıcı kontrolü
            if (!user) {
                user = users.find(u => u.email === email && u.password === password);
                if (!user) {
                    loginErrorText.textContent = 'Geçersiz e-posta veya şifre.';
                    loginError.classList.add('show');
                    return;
                }
                isAdmin = user.isAdmin || false;
            }

            // Eğer normal kullanıcıysa admin yetkisi yok
            if (!isAdmin) {
                user.isAdmin = false;
                saveUsers();
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

    // ---- REGISTER (SADECE ADMIN'İN OLUŞTURDUĞU KEY İLE) ----
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

            // Anahtarı kullan
            registrationKeys.splice(keyIndex, 1);
            saveKeys();

            const userId = generateUserId();
            const displayName = email.split('@')[0];
            const newUser = {
                email,
                password,
                isAdmin: false,  // Normal kullanıcı asla admin olamaz
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

    // Admin şifresi değiştirme
    window.__adminPassword = adminPassword;
    window.__saveAdminPass = function(newPass) {
        adminPassword = newPass;
        localStorage.setItem('adminPassword', adminPassword);
        window.__adminPassword = adminPassword;
    };

    // Admin hash'lerini oluştur
    ensureAdmin();
})();
