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

    // ---- HASH FONKSİYONU ----
    const SALT = 'ZenitSuperSecureSalt2025!@#$%';

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + SALT);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    let adminCreds = JSON.parse(localStorage.getItem('adminCreds'));
if (!adminCreds) {
    adminCreds = {
        emailHash: 'f8c9e6b7d5a4f2e8d6b4a8f6b0c8d4a2f4e8d6b4a8f6b0c8d4a2f4e8d6b4a8f6',
        passwordHash: 'e4d7b6c8f2a4e8d6b4a8f6b0c8d4a2f4e8d6b4a8f6b0c8d4a2f4e8d6b4a8f6'
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
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = $('loginEmail').value.trim();
            const password = $('loginPassword').value.trim();

            if (!email || !password) {
                loginErrorText.textContent = 'Please fill all fields.';
                loginError.classList.add('show');
                return;
            }

            if (isBanned(email)) {
                loginErrorText.textContent = 'This account has been permanently banned!';
                loginError.classList.add('show');
                return;
            }

            const inputEmailHash = await hashPassword(email);
            const inputPassHash = await hashPassword(password);

            let isAdmin = false;
            let user = users.find(u => u.email === email && u.password === password);

            if (inputEmailHash === adminCreds.emailHash && inputPassHash === adminCreds.passwordHash) {
                isAdmin = true;
                user = users.find(u => u.email === email);
                if (!user) {
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
                user = users.find(u => u.email === email && u.password === password);
                if (!user) {
                    loginErrorText.textContent = 'Invalid email or password.';
                    loginError.classList.add('show');
                    return;
                }
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

    // ---- REGISTER (KEY KONTROLÜ DÜZELTİLDİ) ----
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

            // KEY KONTROLÜ (DÜZELTİLDİ)
            const keyIndex = registrationKeys.indexOf(key);
            if (keyIndex === -1) {
                registerErrorText.textContent = 'Invalid registration key.';
                registerError.classList.add('show');
                registerSuccess.classList.remove('show');
                return;
            }

            // Key kullanıldı, listeden sil
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
