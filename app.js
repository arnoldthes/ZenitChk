(function() {
    'use strict';

    const $ = id => document.getElementById(id);
    const loginPage = $('loginPage');
    const registerPage = $('registerPage');
    const dashboard = $('dashboard');
    const loginForm = $('loginForm');
    const registerForm = $('registerForm');
    const loginError = $('loginError');
    const loginErrorText = $('loginErrorText');
    const registerError = $('registerError');
    const registerErrorText = $('registerErrorText');
    const registerSuccess = $('registerSuccess');
    const registerSuccessText = $('registerSuccessText');
    const gotoRegister = $('gotoRegister');
    const gotoLogin = $('gotoLogin');
    const logoutBtn = $('logoutBtn');
    const themeToggle = $('themeToggle');
    const userAvatar = $('userAvatar');
    const pageTitle = $('pageTitle');
    const pageSubtitle = $('pageSubtitle');
    const toast = $('toast');
    const toastMessage = $('toastMessage');

    const totalBalance = $('totalBalance');
    const totalUsers = $('totalUsers');
    const vipUsers = $('vipUsers');
    const membershipType = $('membershipType');

    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabContents = {
        dashboard: $('tab-dashboard'),
        validator: $('tab-validator'),
        generator: $('tab-generator'),
        binsorgu: $('tab-binsorgu'),
        admin: $('tab-admin')
    };
    const adminNavItem = $('adminNavItem');
    const adminLabel = $('adminLabel');

    const ccInput = $('ccInput');
    const validateBtn = $('validateBtn');
    const validateResult = $('validateResult');

    const genCount = $('genCount');
    const genType = $('genType');
    const generateBtn = $('generateBtn');
    const copyAllBtn = $('copyAllBtn');
    const ccList = $('ccList');

    const binInput = $('binInput');
    const binSorguBtn = $('binSorguBtn');
    const binResult = $('binResult');

    const userList = $('userList');

    const menuToggle = $('menuToggle');
    const sidebar = $('sidebar');
    const sidebarOverlay = $('sidebarOverlay');
    const sidebarClose = $('sidebarClose');

    let currentUser = null;
    let users = JSON.parse(localStorage.getItem('ccUsers')) || [];
    const vipList = ['vip@nower.com'];

    // Toast
    function showToast(message, type = 'info') {
        toast.className = 'toast ' + type;
        toastMessage.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
    }

    function saveUsers() {
        localStorage.setItem('ccUsers', JSON.stringify(users));
    }

    function getInitials(email) {
        return email.charAt(0).toUpperCase();
    }

    function luhnCheck(num) {
        let sum = 0,
            alt = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let n = parseInt(num.charAt(i), 10);
            if (alt) { n *= 2; if (n > 9) n = n - 9; }
            sum += n;
            alt = !alt;
        }
        return (sum % 10 === 0);
    }

    function generateCC(bin, length) {
        let card = bin;
        while (card.length < length - 1) {
            card += Math.floor(Math.random() * 10);
        }
        let sum = 0,
            alt = false;
        for (let i = card.length - 1; i >= 0; i--) {
            let n = parseInt(card.charAt(i), 10);
            if (alt) { n *= 2; if (n > 9) n = n - 9; }
            sum += n;
            alt = !alt;
        }
        let check = (10 - (sum % 10)) % 10;
        return card + check;
    }

    function getBinInfo(bin) {
        const db = {
            '411111': { bank: 'Visa', cardType: 'Kredi', country: 'TR', level: 'Classic' },
            '411112': { bank: 'Visa', cardType: 'Kredi', country: 'US', level: 'Gold' },
            '421234': { bank: 'Visa', cardType: 'Debit', country: 'GB', level: 'Platinum' },
            '512345': { bank: 'Mastercard', cardType: 'Kredi', country: 'DE', level: 'Standard' },
            '555555': { bank: 'Mastercard', cardType: 'Debit', country: 'FR', level: 'Gold' },
            '340000': { bank: 'American Express', cardType: 'Kredi', country: 'US', level: 'Business' },
            '601111': { bank: 'Discover', cardType: 'Kredi', country: 'US', level: 'Classic' }
        };
        return db[bin.substring(0, 6)] || { bank: 'Bilinmiyor', cardType: 'Bilinmiyor', country: '??', level: 'Belirsiz' };
    }

    // Auth
    function setAuthPage(page) {
        loginPage.classList.toggle('hidden', page !== 'login');
        registerPage.classList.toggle('hidden', page !== 'register');
        loginError.classList.remove('show');
        registerError.classList.remove('show');
        registerSuccess.classList.remove('show');
    }

    function login(email, password) {
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            loginErrorText.textContent = 'E-posta veya şifre hatalı.';
            loginError.classList.add('show');
            return false;
        }
        currentUser = { email: user.email, isAdmin: user.isAdmin || false };
        localStorage.setItem('ccSession', JSON.stringify(currentUser));
        showToast('Hoş geldin, ' + email, 'success');
        enterDashboard();
        return true;
    }

    function register(email, password, masterKey) {
        if (users.find(u => u.email === email)) {
            registerErrorText.textContent = 'Bu e-posta zaten kayıtlı.';
            registerError.classList.add('show');
            return false;
        }
        const isAdmin = (masterKey === 'admin123');
        users.push({ email, password, isAdmin, masterKey: masterKey || '' });
        saveUsers();
        registerSuccessText.textContent = 'Hesap oluşturuldu!';
        registerSuccess.classList.add('show');
        registerError.classList.remove('show');
        showToast('Kayıt başarılı!', 'success');
        login(email, password);
        return true;
    }

    function logout() {
        currentUser = null;
        localStorage.removeItem('ccSession');
        dashboard.classList.remove('active');
        setAuthPage('login');
        showToast('Çıkış yapıldı.', 'info');
    }

    function enterDashboard() {
        setAuthPage('login');
        dashboard.classList.add('active');
        userAvatar.textContent = getInitials(currentUser.email);
        const isAdmin = currentUser.isAdmin;
        adminNavItem.style.display = isAdmin ? 'flex' : 'none';
        adminLabel.style.display = isAdmin ? 'block' : 'none';
        switchTab('dashboard');
        if (isAdmin) renderAdminPanel();
        updateDashboardStats();
    }

    function switchTab(tabId) {
        Object.values(tabContents).forEach(el => el.classList.add('hidden'));
        if (tabContents[tabId]) tabContents[tabId].classList.remove('hidden');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });
        updatePageTitle(tabId);
        if (tabId === 'dashboard') updateDashboardStats();
        // Mobilde sidebar'ı kapat
        closeSidebar();
    }

    function updatePageTitle(tabId) {
        const titles = {
            dashboard: { title: 'Ana Sayfa', sub: 'Genel bakış ve istatistikler' },
            validator: { title: 'CC Validator', sub: 'Kredi kartı numarası doğrulama' },
            generator: { title: 'CC Generator', sub: 'Geçerli kart numarası üretici' },
            binsorgu: { title: 'CC BIN Sorgu', sub: 'BIN ile banka bilgileri' },
            admin: { title: 'Admin Paneli', sub: 'Kullanıcı yönetimi' }
        };
        const info = titles[tabId] || titles.dashboard;
        pageTitle.textContent = info.title;
        pageSubtitle.textContent = info.sub;
    }

    function updateDashboardStats() {
        totalBalance.textContent = '0.00 TL';
        totalUsers.textContent = users.length;
        const vipCount = users.filter(u => vipList.includes(u.email) && !u.isAdmin).length;
        vipUsers.textContent = vipCount;
        if (currentUser && currentUser.isAdmin) {
            membershipType.innerHTML = 'Kurucu 🏅';
        } else {
            membershipType.textContent = 'Üye';
        }
    }

    function renderAdminPanel() {
        if (!currentUser || !currentUser.isAdmin) return;
        const ul = userList;
        ul.innerHTML = '';
        users.forEach(u => {
            const li = document.createElement('li');
            li.style.cssText = 'padding:6px 0;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;';
            const isVip = vipList.includes(u.email);
            li.innerHTML = `<span>${u.email}</span><span style="font-size:12px;color:var(--text-muted);">${u.isAdmin ? '👑 Admin' : '👤 Üye'} ${isVip ? '⭐ Vip' : ''}</span>`;
            ul.appendChild(li);
        });
        if (!ul.children.length) {
            ul.innerHTML = '<li style="padding:6px 0;color:var(--text-muted);">Kayıtlı kullanıcı yok.</li>';
        }
    }

    // Sidebar functions
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Events
    menuToggle.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    themeToggle.addEventListener('click', function() {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        html.setAttribute('data-theme', isDark ? 'light' : 'dark');
        const icon = this.querySelector('i');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        showToast(isDark ? 'Aydınlık tema' : 'Karanlık tema', 'info');
    });

    gotoRegister.addEventListener('click', (e) => { e.preventDefault();
        setAuthPage('register'); });
    gotoLogin.addEventListener('click', (e) => { e.preventDefault();
        setAuthPage('login'); });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = $('loginEmail').value.trim();
        const password = $('loginPassword').value.trim();
        if (!email || !password) {
            loginErrorText.textContent = 'Tüm alanları doldurun.';
            loginError.classList.add('show');
            return;
        }
        login(email, password);
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = $('registerEmail').value.trim();
        const password = $('registerPassword').value.trim();
        const masterKey = $('registerMasterKey').value.trim();
        if (!email || !password) {
            registerErrorText.textContent = 'E-posta ve şifre zorunludur.';
            registerError.classList.add('show');
            return;
        }
        register(email, password, masterKey);
    });

    logoutBtn.addEventListener('click', logout);

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tab = this.dataset.tab;
            if (tab === 'admin' && !currentUser.isAdmin) {
                showToast('Admin yetkiniz yok.', 'error');
                return;
            }
            switchTab(tab);
        });
    });

    // Validator
    validateBtn.addEventListener('click', function() {
        let raw = ccInput.value.replace(/\s/g, '');
        if (!raw) {
            validateResult.innerHTML = `<span class="label">Sonuç</span><span class="value" style="color:var(--text-muted);">Kart numarası girin.</span>`;
            return;
        }
        if (!/^\d+$/.test(raw)) {
            validateResult.innerHTML = `<span class="label">Sonuç</span><span class="value invalid">❌ Sadece rakam.</span>`;
            return;
        }
        const isValid = luhnCheck(raw);
        const masked = raw.replace(/(\d{4})/g, '$1 ').trim();
        const status = isValid ? '✅ Geçerli' : '❌ Geçersiz';
        const cls = isValid ? 'valid' : 'invalid';
        validateResult.innerHTML = `<span class="label">Sonuç</span><span class="value ${cls}">${status} — ${masked}</span>`;
    });

    ccInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') validateBtn.click(); });

    // Generator
    function generateCards() {
        const count = parseInt(genCount.value, 10);
        const type = genType.value;
        let bin = '';
        switch (type) {
            case 'visa':
                bin = '4' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
                break;
            case 'mastercard':
                bin = (Math.floor(Math.random() * 5) + 5) + '1' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                break;
            case 'amex':
                bin = '34' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                break;
            case 'discover':
                bin = '6011' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                break;
            default:
                const prefixes = ['4', '5', '34', '37', '6011'];
                const p = prefixes[Math.floor(Math.random() * prefixes.length)];
                if (p === '4') bin = '4' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
                else if (p === '5') bin = (Math.floor(Math.random() * 5) + 5) + '1' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                else if (p === '34' || p === '37') bin = p + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                else bin = '6011' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        }
        const length = (type === 'amex' || bin.startsWith('34') || bin.startsWith('37')) ? 15 : 16;
        const cards = [];
        for (let i = 0; i < count; i++) {
            let cc = generateCC(bin, length);
            if (i > 0 && Math.random() > 0.7) {
                let altBin = '';
                if (type === 'visa') altBin = '4' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
                else if (type === 'mastercard') altBin = (Math.floor(Math.random() * 5) + 5) + '1' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                else altBin = bin;
                cc = generateCC(altBin, length);
            }
            cards.push(cc);
        }
        return cards;
    }

    function renderCards(cards) {
        ccList.innerHTML = '';
        if (!cards.length) {
            ccList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">Kart üretilmedi.</div>';
            return;
        }
        cards.forEach(card => {
            const div = document.createElement('div');
            div.className = 'cc-item';
            const masked = card.replace(/(\d{4})/g, '$1 ').trim();
            const valid = luhnCheck(card);
            div.innerHTML = `<span class="cc-number">${masked}</span><span class="cc-status ${valid ? 'valid' : 'invalid'}">${valid ? '✅ Geçerli' : '❌ Geçersiz'}</span>`;
            ccList.appendChild(div);
        });
    }

    generateBtn.addEventListener('click', function() {
        const cards = generateCards();
        renderCards(cards);
        showToast(`${cards.length} kart üretildi.`, 'success');
    });

    copyAllBtn.addEventListener('click', function() {
        const items = ccList.querySelectorAll('.cc-item .cc-number');
        const numbers = Array.from(items).map(el => el.textContent.replace(/\s/g, ''));
        if (!numbers.length) {
            showToast('Kopyalanacak kart yok.', 'error');
            return;
        }
        navigator.clipboard.writeText(numbers.join('\n')).then(() => {
            showToast('Kartlar kopyalandı.', 'success');
        }).catch(() => {
            const text = numbers.join('\n');
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            showToast('Kopyalandı.', 'success');
        });
    });

    // BIN
    binSorguBtn.addEventListener('click', function() {
        const bin = binInput.value.replace(/\s/g, '');
        if (!bin || bin.length < 6) {
            binResult.innerHTML = `<span class="label">BIN Bilgileri</span><span class="value" style="color:var(--text-muted);">En az 6 hane girin.</span>`;
            return;
        }
        if (!/^\d+$/.test(bin)) {
            binResult.innerHTML = `<span class="label">BIN Bilgileri</span><span class="value invalid">❌ Sadece rakam.</span>`;
            return;
        }
        const info = getBinInfo(bin);
        binResult.innerHTML = `
            <span class="label">BIN Bilgileri</span>
            <div class="bin-result-grid">
                <div class="bin-item"><span class="bin-label">Banka</span><span class="bin-value">${info.bank}</span></div>
                <div class="bin-item"><span class="bin-label">Kart Tipi</span><span class="bin-value">${info.cardType}</span></div>
                <div class="bin-item"><span class="bin-label">Ülke</span><span class="bin-value">${info.country}</span></div>
                <div class="bin-item"><span class="bin-label">Seviye</span><span class="bin-value">${info.level}</span></div>
            </div>
        `;
    });

    binInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') binSorguBtn.click(); });

    // Session
    const session = JSON.parse(localStorage.getItem('ccSession'));
    if (session && session.email) {
        const user = users.find(u => u.email === session.email);
        if (user) {
            currentUser = { email: user.email, isAdmin: user.isAdmin || false };
            enterDashboard();
        } else {
            localStorage.removeItem('ccSession');
            setAuthPage('login');
        }
    } else {
        setAuthPage('login');
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.querySelector('i').className = isDark ? 'fas fa-moon' : 'fas fa-sun';

    if (currentUser && currentUser.isAdmin) {
        renderAdminPanel();
    }

    // Window resize - close sidebar on large screens if open
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 769) {
            closeSidebar();
        }
    });

})();