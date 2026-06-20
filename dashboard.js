(function() {
    'use strict';

    const $ = id => document.getElementById(id);

    const session = JSON.parse(localStorage.getItem('ccSession'));
    if (!session || !session.email) {
        window.location.href = 'index.html';
        return;
    }

    function isBanned(email) {
        const banned = JSON.parse(localStorage.getItem('bannedUsers')) || [];
        return banned.some(b => {
            if (typeof b === 'string') return b === email;
            return b.email === email;
        });
    }

    if (isBanned(session.email)) {
        localStorage.removeItem('ccSession');
        alert('🚫 Hesabınız kalıcı olarak yasaklanmıştır!');
        window.location.href = 'index.html';
        return;
    }

    let users = JSON.parse(localStorage.getItem('ccUsers')) || [];
    let registrationKeys = JSON.parse(localStorage.getItem('registrationKeys')) || [];
    let adminPassword = localStorage.getItem('adminPassword') || 'adminpanel';

    const currentUser = users.find(u => u.email === session.email);
    if (!currentUser) {
        localStorage.removeItem('ccSession');
        window.location.href = 'index.html';
        return;
    }

    // ---- ADMIN KONTROLÜ (SADECE ADMIN EMAIL) ----
    const isAdmin = session.email === 'apomuhammed1@gmail.com';

    const userId = currentUser.userId;
    let displayName = currentUser.displayName || currentUser.email.split('@')[0];
    let userAvatar = currentUser.avatar || '';
    let userBio = currentUser.bio || '';

    // ---- GAME LIMITS ----
    const today = new Date().toDateString();

    function getGameLimit(key, max) {
        const data = JSON.parse(localStorage.getItem('game_' + key + '_' + userId)) || { date: '', count: 0 };
        if (data.date !== today) {
            data.date = today;
            data.count = 0;
            localStorage.setItem('game_' + key + '_' + userId, JSON.stringify(data));
        }
        return data;
    }

    function useGameLimit(key, max) {
        const data = getGameLimit(key, max);
        if (data.count >= max) return false;
        data.count++;
        localStorage.setItem('game_' + key + '_' + userId, JSON.stringify(data));
        return true;
    }

    function getGameRemain(key, max) {
        const data = getGameLimit(key, max);
        return max - data.count;
    }

    // ---- DOM ----
    const toast = $('toast');
    const toastMessage = $('toastMessage');
    const userAvatarEl = $('userAvatar');
    const pageTitle = $('pageTitle');
    const pageSubtitle = $('pageSubtitle');
    const myBalance = $('myBalance');
    const totalUsers = $('totalUsers');
    const premiumCount = $('premiumCount');
    const normalCount = $('normalCount');
    const onlineCount = $('onlineCount');
    const myId = $('myId');
    const currentBalance = $('currentBalance');
    const userIdDisplay = $('userIdDisplay');

    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabContents = {
        dashboard: $('tab-dashboard'),
        generator: $('tab-generator'),
        validator: $('tab-validator'),
        binsorgu: $('tab-binsorgu'),
        stripeauth: $('tab-stripeauth'),
        bambora: $('tab-bambora'),
        wheel: $('tab-wheel'),
        guess: $('tab-guess'),
        coinflip: $('tab-coinflip'),
        dice: $('tab-dice'),
        rps: $('tab-rps'),
        bakiye: $('tab-bakiye'),
        chat: $('tab-chat'),
        ai: $('tab-ai'),
        ayarlar: $('tab-ayarlar'),
        admin: $('tab-admin')
    };
    const adminNavItem = $('adminNavItem');
    const adminLabel = $('adminLabel');
    const adminPanelBtn = $('adminPanelBtn');

    // ---- RADYO (MÜZİK) ----
    const songs = ['Dertlimusic.mp3', 'Allahyok.mp3', 'Tamam.mp3', 'Ehlan.mp3', 'Anani.mp3', 'Feryat.mp3', 'Vuruldu.mp3'];
    let currentSongIndex = 0;
    let audio = null;
    let isMusicPlaying = false;

    function initMusic() {
        audio = new Audio();
        audio.volume = 0.3;
        audio.loop = true;
        currentSongIndex = Math.floor(Math.random() * songs.length);
        loadSong(currentSongIndex);
        document.addEventListener('click', function() {
            if (audio && audio.paused && isMusicPlaying) {
                audio.play().catch(() => {});
            }
        }, { once: true });
        updateRadioUI();
    }

    function loadSong(index) {
        if (!audio) return;
        audio.src = songs[index] || 'Dertlimusic.mp3';
        audio.load();
        if (isMusicPlaying) {
            audio.play().catch(() => {});
        }
        updateRadioUI();
    }

    function toggleMusic() {
        if (!audio) return;
        if (isMusicPlaying) {
            audio.pause();
            isMusicPlaying = false;
        } else {
            audio.play().catch(() => {});
            isMusicPlaying = true;
        }
        updateRadioUI();
    }

    function prevSong() {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        loadSong(currentSongIndex);
        if (!isMusicPlaying) {
            isMusicPlaying = true;
            audio.play().catch(() => {});
        }
        showToast('⏪ Müzik değiştirildi', 'info');
    }

    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        loadSong(currentSongIndex);
        if (!isMusicPlaying) {
            isMusicPlaying = true;
            audio.play().catch(() => {});
        }
        showToast('⏩ Müzik değiştirildi', 'info');
    }

    function updateRadioUI() {
        if (radioToggle) {
            radioToggle.innerHTML = isMusicPlaying ? '<i class="fas fa-music"></i>' : '<i class="fas fa-music-slash"></i>';
            radioToggle.classList.toggle('active', isMusicPlaying);
        }
    }

    const radioToggle = $('radioToggle');
    const radioPrev = $('radioPrev');
    const radioNext = $('radioNext');

    if (radioToggle) radioToggle.addEventListener('click', toggleMusic);
    if (radioPrev) radioPrev.addEventListener('click', prevSong);
    if (radioNext) radioNext.addEventListener('click', nextSong);

    // ---- RANDOM USER AGENT ----
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    ];

    function getRandomUserAgent() {
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    // ---- BIN API ----
    async function lookupBIN(bin) {
        try {
            const response = await fetch('https://bin-api-worker.aninnayem-an.workers.dev/bin/' + bin);
            if (!response.ok) throw new Error('API error');
            const data = await response.json();
            if (data.success && data.data) {
                const d = data.data;
                return {
                    scheme: d.scheme || 'Unknown',
                    type: d.card_type || 'Unknown',
                    brand: d.scheme || 'Unknown',
                    prepaid: d.card_category === 'PREPAID' ? 'Yes' : 'No',
                    country: d.country || 'Unknown',
                    countryCode: d.issuer_country || '??',
                    bank: d.issuer || 'Unknown',
                    emoji: d.flag || '',
                    card_category: d.card_category || 'Unknown'
                };
            }
            return null;
        } catch (e) {
            console.error('BIN API Error:', e);
            return null;
        }
    }

    // ---- Toggle'lar ----
    const toolsToggle = $('toolsToggle');
    const toolsSub = $('toolsSub');
    const checkoutToggle = $('checkoutToggle');
    const checkoutSub = $('checkoutSub');
    const gamesToggle = $('gamesToggle');
    const gamesSub = $('gamesSub');
    const otherToolsToggle = $('otherToolsToggle');
    const otherToolsSub = $('otherToolsSub');

    if (toolsToggle) {
        toolsToggle.addEventListener('click', function() {
            this.classList.toggle('open');
            toolsSub.classList.toggle('open');
        });
    }
    if (checkoutToggle) {
        checkoutToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('open');
            checkoutSub.classList.toggle('open');
        });
    }
    if (gamesToggle) {
        gamesToggle.addEventListener('click', function() {
            this.classList.toggle('open');
            gamesSub.classList.toggle('open');
        });
    }
    if (otherToolsToggle) {
        otherToolsToggle.addEventListener('click', function() {
            this.classList.toggle('open');
            otherToolsSub.classList.toggle('open');
        });
    }

    // ---- ONLINE ----
    function updateOnline() {
        const sessions = JSON.parse(localStorage.getItem('ccSessions')) || [];
        const activeUsers = sessions.filter(s => (Date.now() - (s.lastActive || 0)) < 300000);
        if (onlineCount) onlineCount.textContent = activeUsers.length || 0;
    }

    function updateSession() {
        let sessions = JSON.parse(localStorage.getItem('ccSessions')) || [];
        const existing = sessions.find(s => s.email === currentUser.email);
        if (existing) { existing.lastActive = Date.now(); } else { sessions.push({ email: currentUser.email, lastActive: Date.now() }); }
        localStorage.setItem('ccSessions', JSON.stringify(sessions));
    }

    // ---- TOAST ----
    window.showToast = function(message, type = 'info') {
        toast.className = 'toast ' + type;
        toastMessage.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
    };

    // ---- HELPERS ----
    function luhnCheck(num) {
        let sum = 0, alt = false;
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
        while (card.length < length - 1) card += Math.floor(Math.random() * 10);
        let sum = 0, alt = false;
        for (let i = card.length - 1; i >= 0; i--) {
            let n = parseInt(card.charAt(i), 10);
            if (alt) { n *= 2; if (n > 9) n = n - 9; }
            sum += n;
            alt = !alt;
        }
        return card + ((10 - (sum % 10)) % 10);
    }

    function getCardLogo(bin) {
        const first = bin.charAt(0);
        if (first === '4') return '<i class="fab fa-cc-visa logo" style="color:#1a1f71;"></i>';
        if (first === '5') return '<i class="fab fa-cc-mastercard logo" style="color:#eb001b;"></i>';
        if (bin.startsWith('34') || bin.startsWith('37')) return '<i class="fab fa-cc-amex logo" style="color:#006fcf;"></i>';
        if (bin.startsWith('6011')) return '<i class="fab fa-cc-discover logo" style="color:#ff6000;"></i>';
        return '<i class="fas fa-credit-card logo" style="color:var(--text-muted);"></i>';
    }

    function getCardType(card) {
        const first = card.charAt(0);
        if (first === '4') return 'Visa';
        if (first === '5') return 'MasterCard';
        if (card.startsWith('34') || card.startsWith('37')) return 'Amex';
        if (first === '6') return 'Discover';
        return 'Visa';
    }

    // ---- STRIPE AUTH (window.StripeAuth kullanıyor) ----
    const stripeInput = $('stripeInput');
    const stripePasteBtn = $('stripePasteBtn');
    const stripeCheckBtn = $('stripeCheckBtn');
    const stripeResult = $('stripeResult');
    const liveCount = $('liveCount');
    const deadCount = $('deadCount');
    const totalCount = $('totalCount');
    const liveFilterBtn = $('liveFilterBtn');
    const deadFilterBtn = $('deadFilterBtn');
    const allFilterBtn = $('allFilterBtn');

    let stripeResults = [];

    function renderStripeResults(filter = 'all') {
        let filtered = [];
        if (filter === 'all') filtered = stripeResults;
        else if (filter === 'live') filtered = stripeResults.filter(r => r.status.includes('Approved') || r.status.includes('3D Secure'));
        else if (filter === 'dead') filtered = stripeResults.filter(r => !r.status.includes('Approved') && !r.status.includes('3D Secure'));

        if (!filtered.length) {
            stripeResult.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px;">Sonuç yok.</div>';
            return;
        }
        let html = '';
        filtered.forEach(r => {
            const statusColor = r.status.includes('Approved') || r.status.includes('3D Secure') ? '#34c759' : '#ff3b30';
            html += `
                <div style="padding:4px 0;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
                    <span style="font-family:monospace;">Card: ${r.cc}|${r.mm}|${r.yy}|${r.cvv}</span>
                    <span style="font-weight:600;color:${statusColor};">Resp: ${r.status}</span>
                </div>
            `;
        });
        stripeResult.innerHTML = html;
    }

    function updateStripeCounts() {
        const live = stripeResults.filter(r => r.status.includes('Approved') || r.status.includes('3D Secure')).length;
        const dead = stripeResults.length - live;
        liveCount.textContent = live;
        deadCount.textContent = dead;
        totalCount.textContent = stripeResults.length;
    }

    if (stripePasteBtn) {
        stripePasteBtn.addEventListener('click', async function() {
            try {
                const text = await navigator.clipboard.readText();
                const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                const cleaned = lines.map(l => {
                    const parts = l.split(/[|/,\s]+/).filter(p => p.length > 0);
                    if (parts.length >= 4) {
                        const cc = parts[0].replace(/\D/g, '');
                        const mm = parts[1].replace(/\D/g, '').padStart(2, '0').slice(0,2);
                        const yy = parts[2].replace(/\D/g, '').slice(0,2);
                        const cvv = parts[3].replace(/\D/g, '').slice(0,4);
                        return `${cc}|${mm}|${yy}|${cvv}`;
                    }
                    return l;
                });
                stripeInput.value = cleaned.join('\n');
                showToast('Panodan yapıştırıldı ve temizlendi.', 'success');
            } catch (e) {
                showToast('Pano okunamadı, manuel yapıştır.', 'error');
            }
        });
    }

    if (stripeCheckBtn) {
        stripeCheckBtn.addEventListener('click', async function() {
            const lines = stripeInput.value.split('\n').map(l => l.trim()).filter(l => l);
            if (!lines.length) { showToast('Kart girin.', 'error'); return; }

            const cost = lines.length * 3;
            if (currentUser.balance < cost) {
                showToast(`Yetersiz bakiye! ${cost} TL gerekli (3 TL/kart).`, 'error');
                return;
            }

            stripeResults = [];
            stripeResult.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px;font-weight:600;">Kontrol ediliyor...</div>';
            this.disabled = true;
            this.textContent = 'Kontrol ediliyor...';

            try {
                for (const line of lines) {
                    const formatted = window.StripeAuth.formatCC(line);
                    if (!formatted) {
                        stripeResults.push({ cc: line, mm: '??', yy: '??', cvv: '??', status: '❌ Format Hatası' });
                        continue;
                    }
                    const { cc, mm, yy, cvv } = formatted;
                    const result = await window.StripeAuth.check(cc, mm, yy, cvv);
                    stripeResults.push({ cc, mm, yy, cvv, status: result });
                    updateStripeCounts();
                    renderStripeResults('all');
                }
            } catch (err) {
                showToast('Kontrol sırasında hata oluştu.', 'error');
            } finally {
                currentUser.balance -= cost;
                saveUsers();
                updateUI();
                stripeInput.value = '';
                this.disabled = false;
                this.textContent = '▶️ Başlat (3 TL/kart)';
                updateStripeCounts();
                renderStripeResults('all');
                showToast(`✅ ${lines.length} kart kontrol edildi. ${cost} TL düşüldü.`, 'success');
            }
        });
    }

    if (liveFilterBtn) liveFilterBtn.addEventListener('click', function() {
        [liveFilterBtn, deadFilterBtn, allFilterBtn].forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderStripeResults('live');
    });
    if (deadFilterBtn) deadFilterBtn.addEventListener('click', function() {
        [liveFilterBtn, deadFilterBtn, allFilterBtn].forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderStripeResults('dead');
    });
    if (allFilterBtn) allFilterBtn.addEventListener('click', function() {
        [liveFilterBtn, deadFilterBtn, allFilterBtn].forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderStripeResults('all');
    });

    // ---- BAMBORA CHARGE (window.BamboraAuth kullanıyor) ----
    const bamboraInput = $('bamboraInput');
    const bamboraAmount = $('bamboraAmount');
    const bamboraCheckBtn = $('bamboraCheckBtn');
    const bamboraResult = $('bamboraResult');
    const bamboraLiveCount = $('bamboraLiveCount');
    const bamboraDeadCount = $('bamboraDeadCount');
    const bamboraTotalCount = $('bamboraTotalCount');
    const bamboraLiveFilter = $('bamboraLiveFilter');
    const bamboraDeadFilter = $('bamboraDeadFilter');
    const bamboraAllFilter = $('bamboraAllFilter');

    let bamboraResults = [];

    function renderBamboraResults(filter = 'all') {
        let filtered = [];
        if (filter === 'all') filtered = bamboraResults;
        else if (filter === 'live') filtered = bamboraResults.filter(r => r.status.includes('Approved') || r.status.includes('charged'));
        else if (filter === 'dead') filtered = bamboraResults.filter(r => !r.status.includes('Approved') && !r.status.includes('charged'));

        if (!filtered.length) {
            bamboraResult.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px;">Sonuç yok.</div>';
            return;
        }
        let html = '';
        filtered.forEach(r => {
            const statusColor = r.status.includes('Approved') || r.status.includes('charged') ? '#34c759' : '#ff3b30';
            html += `
                <div style="padding:4px 0;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
                    <span style="font-family:monospace;">Card: ${r.cc}|${r.mm}|${r.yy}|${r.cvv}</span>
                    <span style="font-weight:600;color:${statusColor};">Resp: ${r.status}</span>
                </div>
            `;
        });
        bamboraResult.innerHTML = html;
    }

    function updateBamboraCounts() {
        const live = bamboraResults.filter(r => r.status.includes('Approved') || r.status.includes('charged')).length;
        const dead = bamboraResults.length - live;
        bamboraLiveCount.textContent = live;
        bamboraDeadCount.textContent = dead;
        bamboraTotalCount.textContent = bamboraResults.length;
    }

    if (bamboraCheckBtn) {
        bamboraCheckBtn.addEventListener('click', async function() {
            const lines = bamboraInput.value.split('\n').map(l => l.trim()).filter(l => l);
            if (!lines.length) { showToast('Kart girin.', 'error'); return; }

            const amount = parseFloat(bamboraAmount.value);
            if (!amount || amount <= 0) { showToast('Geçerli bir miktar girin.', 'error'); return; }

            const cost = lines.length * 2;
            if (currentUser.balance < cost) {
                showToast(`Yetersiz bakiye! ${cost} TL gerekli (2 TL/kart).`, 'error');
                return;
            }

            bamboraResults = [];
            bamboraResult.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px;font-weight:600;">Kontrol ediliyor...</div>';
            this.disabled = true;
            this.textContent = 'Kontrol ediliyor...';

            try {
                for (const line of lines) {
                    const formatted = window.BamboraAuth.formatCC(line);
                    if (!formatted) {
                        bamboraResults.push({ cc: line, mm: '??', yy: '??', cvv: '??', status: '❌ Format Hatası' });
                        continue;
                    }
                    const { cc, mm, yy, cvv } = formatted;
                    const result = await window.BamboraAuth.check(cc, mm, yy, cvv, amount);
                    bamboraResults.push({ cc, mm, yy, cvv, status: result });
                    updateBamboraCounts();
                    renderBamboraResults('all');
                    await new Promise(r => setTimeout(r, 500));
                }
            } catch (err) {
                showToast('Kontrol sırasında hata oluştu.', 'error');
            } finally {
                currentUser.balance -= cost;
                saveUsers();
                updateUI();
                bamboraInput.value = '';
                this.disabled = false;
                this.textContent = '▶️ Başlat (2 TL/kart)';
                updateBamboraCounts();
                renderBamboraResults('all');
                showToast(`✅ ${lines.length} kart kontrol edildi. ${cost} TL düşüldü.`, 'success');
            }
        });
    }

    if (bamboraLiveFilter) bamboraLiveFilter.addEventListener('click', function() {
        [bamboraLiveFilter, bamboraDeadFilter, bamboraAllFilter].forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderBamboraResults('live');
    });
    if (bamboraDeadFilter) bamboraDeadFilter.addEventListener('click', function() {
        [bamboraLiveFilter, bamboraDeadFilter, bamboraAllFilter].forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderBamboraResults('dead');
    });
    if (bamboraAllFilter) bamboraAllFilter.addEventListener('click', function() {
        [bamboraLiveFilter, bamboraDeadFilter, bamboraAllFilter].forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderBamboraResults('all');
    });

    // ---- UI ----
    function updateUI() {
        if (userAvatar) {
            userAvatarEl.innerHTML = `<img src="${userAvatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`;
            if (profileAvatar) profileAvatar.src = userAvatar;
        } else {
            userAvatarEl.textContent = displayName.charAt(0).toUpperCase();
            if (profileAvatar) {
                profileAvatar.src =
                    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='40' fill='%23007aff'/%3E%3Ctext x='40' y='52' text-anchor='middle' font-size='32' fill='white' font-weight='600' font-family='Arial'%3E${displayName.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
            }
        }
        myBalance.textContent = currentUser.balance.toFixed(2) + ' TL';
        currentBalance.textContent = currentUser.balance.toFixed(2) + ' TL';
        totalUsers.textContent = users.length;
        const prems = users.filter(u => u.premium).length;
        premiumCount.textContent = prems;
        normalCount.textContent = users.length - prems;
        myId.textContent = userId;
        userIdDisplay.textContent = userId;
        if (displayNameInput) displayNameInput.value = displayName;
        if (profileId) profileId.value = userId;
        if (userBioInput) userBioInput.value = userBio || '';
        if (themeSelect) themeSelect.value = document.documentElement.getAttribute('data-theme') || 'light';

        if (adminPanelBtn) {
            adminPanelBtn.style.display = isAdmin ? 'flex' : 'none';
        }
        if (adminNavItem) {
            adminNavItem.style.display = isAdmin ? 'flex' : 'none';
        }
        if (adminLabel) {
            adminLabel.style.display = isAdmin ? 'block' : 'none';
        }

        if (spinUsed) {
            const spinData = getGameLimit('spin', 1);
            spinUsed.textContent = spinData.count >= 1 ? 0 : 1;
        }
        if (guessLeft) guessLeft.textContent = getGameRemain('guess', 4);
        if (coinRemain) coinRemain.textContent = getGameRemain('coinflip', 4);
        if (diceRemain) diceRemain.textContent = getGameRemain('dice', 4);
        if (rpsRemain) rpsRemain.textContent = getGameRemain('rps', 4);

        renderChatMessages();
        renderAIMessages();
        updateOnline();
    }

    function saveUsers() {
        localStorage.setItem('ccUsers', JSON.stringify(users));
    }

    // ---- ADMIN BUTONU ----
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', function() {
            switchTab('admin');
        });
    }

    // ---- TAB ----
    function switchTab(tabId) {
        Object.values(tabContents).forEach(el => { if (el) el.classList.add('hidden'); });
        if (tabContents[tabId]) tabContents[tabId].classList.remove('hidden');
        navItems.forEach(item => { if (item) item.classList.toggle('active', item.dataset.tab === tabId); });
        updatePageTitle(tabId);
        if (tabId === 'dashboard') updateUI();
        if (tabId === 'admin' && isAdmin) {
            if (adminLock) { adminLock.style.display = 'block';
                adminContent.style.display = 'none';
                adminLockError.style.display = 'none';
                adminPassInput.value = ''; }
        }
        if (tabId === 'chat') renderChatMessages();
        if (tabId === 'ai') renderAIMessages();
        if (tabId === 'wheel') drawWheel();
        if (tabId === 'stripeauth') {
            updateStripeCounts();
            renderStripeResults('all');
            [liveFilterBtn, deadFilterBtn, allFilterBtn].forEach(b => b.classList.remove('active'));
            if (allFilterBtn) allFilterBtn.classList.add('active');
        }
        if (tabId === 'bambora') {
            updateBamboraCounts();
            renderBamboraResults('all');
            [bamboraLiveFilter, bamboraDeadFilter, bamboraAllFilter].forEach(b => b.classList.remove('active'));
            if (bamboraAllFilter) bamboraAllFilter.classList.add('active');
        }
        closeSidebar();
    }

    function updatePageTitle(tabId) {
        const titles = {
            dashboard: { title: 'Ana Sayfa', sub: 'Genel bakış' },
            generator: { title: 'CC Generator', sub: 'Kart üretici' },
            validator: { title: 'CC Validator', sub: 'Kart doğrulama' },
            binsorgu: { title: 'BIN Sorgu', sub: 'BIN bilgileri' },
            stripeauth: { title: 'Stripe Auth', sub: 'Kart yetkilendirme' },
            bambora: { title: 'Bambora Charge', sub: 'Özel miktar ile kart kontrolü' },
            wheel: { title: 'Çarkıfelek', sub: 'Günlük ücretsiz çevir!' },
            guess: { title: 'Sayı Tahmin', sub: '1-100 arası tahmin' },
            coinflip: { title: 'Yazı Tura', sub: 'Şansını dene' },
            dice: { title: 'Zar At', sub: 'Şansını dene' },
            rps: { title: 'Taş Kağıt Makas', sub: 'Bilgisayara karşı oyna' },
            bakiye: { title: 'Bakiye', sub: 'Bakiye yönetimi' },
            chat: { title: 'Sohbet', sub: 'Oda sohbeti' },
            ai: { title: 'Zenit AI', sub: 'Yapay zeka asistanı' },
            ayarlar: { title: 'Ayarlar', sub: 'Profil bilgileri' },
            admin: { title: 'Admin Paneli', sub: 'Kullanıcı yönetimi' }
        };
        const info = titles[tabId] || titles.dashboard;
        pageTitle.textContent = info.title;
        pageSubtitle.textContent = info.sub;
    }

    // ---- CC GENERATOR ----
    const genBin = $('genBin');
    const genCvv = $('genCvv');
    const genMonth = $('genMonth');
    const genYear = $('genYear');
    const genCount = $('genCount');
    const generateBtn = $('generateBtn');
    const ccList = $('ccList');
    const copyAllBtn = $('copyAllBtn');

    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            if (currentUser.balance < 1) {
                showToast('Yetersiz bakiye!', 'error');
                return;
            }
            const bin = genBin.value.trim() || '411111';
            const cvv = genCvv.value.trim() || '123';
            const month = genMonth.value.trim() || '12';
            const year = genYear.value.trim() || '2028';
            const count = parseInt(genCount.value) || 5;
            if (count < 1 || count > 50) { showToast('Adet 1-50 arası olmalı.', 'error'); return; }

            currentUser.balance -= 1;
            saveUsers();

            let html = '';
            for (let i = 0; i < count; i++) {
                let card = generateCC(bin, 16);
                const isValid = luhnCheck(card);
                const status = isValid ? '✅' : '❌';
                const statusColor = isValid ? '#34c759' : '#ff3b30';
                html += `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-color);font-family:monospace;">
                    <span>${card}|${month}|${year}|${cvv}</span>
                    <span style="color:${statusColor};font-weight:600;">${status}</span>
                </div>`;
            }
            ccList.innerHTML = html || '<div style="color:var(--text-muted);text-align:center;padding:16px;">Kart üretilmedi.</div>';
            updateUI();
            showToast(`${count} kart üretildi. 1 TL düşüldü.`, 'success');
        });
    }

    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', function() {
            const items = ccList.querySelectorAll('div > span:first-child');
            const texts = Array.from(items).map(el => el.textContent.trim());
            if (!texts.length) { showToast('Kopyalanacak kart yok.', 'error'); return; }
            navigator.clipboard.writeText(texts.join('\n')).then(() => {
                showToast('Tüm kartlar kopyalandı!', 'success');
            }).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = texts.join('\n');
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                showToast('Tüm kartlar kopyalandı!', 'success');
            });
        });
    }

    // ---- VALIDATOR ----
    const ccValidateInput = $('ccValidateInput');
    const validateBtn = $('validateBtn');
    const validateResult = $('validateResult');

    if (validateBtn) {
        validateBtn.addEventListener('click', function() {
            const raw = ccValidateInput.value.replace(/\s/g, '');
            if (!raw) { validateResult.innerHTML = `<span class="label">Sonuç</span><span class="value" style="color:var(--text-muted);">Kart numarası girin.</span>`; return; }
            if (!/^\d+$/.test(raw)) { validateResult.innerHTML = `<span class="label">Sonuç</span><span class="value invalid">❌ Sadece rakam.</span>`; return; }
            const isValid = luhnCheck(raw);
            const masked = raw.replace(/(\d{4})/g, '$1 ').trim();
            const bin = raw.substring(0, 6);
            lookupBIN(bin).then(info => {
                let extra = info ? `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">Banka: ${info.bank} | Tip: ${info.type} | Ülke: ${info.country} ${info.emoji}</div>` : '';
                validateResult.innerHTML = `
                    <span class="label">Sonuç</span>
                    <span class="value ${isValid ? 'valid' : 'invalid'}">${isValid ? '✅ Geçerli' : '❌ Geçersiz'} — ${masked}</span>
                    ${extra}
                `;
            }).catch(() => {
                validateResult.innerHTML = `<span class="label">Sonuç</span><span class="value ${isValid ? 'valid' : 'invalid'}">${isValid ? '✅ Geçerli' : '❌ Geçersiz'} — ${masked}</span>`;
            });
        });
        ccValidateInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') validateBtn.click(); });
    }

    // ---- BIN ----
    const binInput = $('binInput');
    const binSorguBtn = $('binSorguBtn');
    const binResult = $('binResult');

    if (binSorguBtn) {
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
            binResult.innerHTML = `<span class="label">BIN Bilgileri</span><span class="value" style="color:var(--text-muted);">Aranıyor...</span>`;
            lookupBIN(bin).then(info => {
                if (!info) { binResult.innerHTML = `<span class="label">BIN Bilgileri</span><span class="value invalid">❌ BIN bulunamadı.</span>`; return; }
                binResult.innerHTML = `
                    <span class="label">BIN Bilgileri</span>
                    <div class="bin-result-grid">
                        <div class="bin-item"><span class="bin-label">Kart Markası</span><span class="bin-value">${info.scheme}</span></div>
                        <div class="bin-item"><span class="bin-label">Kart Tipi</span><span class="bin-value">${info.type}</span></div>
                        <div class="bin-item"><span class="bin-label">Brand</span><span class="bin-value">${info.brand}</span></div>
                        <div class="bin-item"><span class="bin-label">Kategori</span><span class="bin-value">${info.card_category || 'Bilinmiyor'}</span></div>
                        <div class="bin-item"><span class="bin-label">Ülke</span><span class="bin-value">${info.country} ${info.emoji}</span></div>
                        <div class="bin-item"><span class="bin-label">Banka</span><span class="bin-value">${info.bank}</span></div>
                    </div>
                `;
            }).catch(() => {
                binResult.innerHTML = `<span class="label">BIN Bilgileri</span><span class="value invalid">❌ Sorgu hatası.</span>`;
            });
        });
        binInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') binSorguBtn.click(); });
    }

    // ---- BALANCE ----
    const depositAmount = $('depositAmount');
    const transferId = $('transferId');
    const transferAmount = $('transferAmount');

    window.deposit = function() {
        const amount = parseFloat(depositAmount.value);
        if (!amount || amount <= 0) { showToast('Geçerli miktar girin.', 'error'); return; }
        currentUser.balance += amount;
        depositAmount.value = '';
        saveUsers();
        updateUI();
        showToast(`${amount.toFixed(2)} TL yüklendi.`, 'success');
    };

    window.transfer = function() {
        const targetId = transferId.value.trim();
        const amount = parseFloat(transferAmount.value);
        if (!targetId || !amount || amount <= 0) { showToast('Alıcı ID ve miktar girin.', 'error'); return; }
        if (targetId === userId) { showToast('Kendine transfer yapamazsın.', 'error'); return; }
        if (amount > currentUser.balance) { showToast('Yetersiz bakiye.', 'error'); return; }
        const targetUser = users.find(u => u.userId === targetId);
        if (!targetUser) { showToast('Alıcı bulunamadı.', 'error'); return; }
        currentUser.balance -= amount;
        targetUser.balance += amount;
        transferId.value = '';
        transferAmount.value = '';
        saveUsers();
        updateUI();
        showToast(`${amount.toFixed(2)} TL transfer edildi.`, 'success');
    };

    // ---- CHAT ----
    const chatMessages = $('chatMessages');
    const chatInput = $('chatInput');
    const sendChatBtn = $('sendChatBtn');

    let chatMessagesData = JSON.parse(localStorage.getItem('chatMessages')) || [];

    function saveChatMessages() { localStorage.setItem('chatMessages', JSON.stringify(chatMessagesData)); }

    function renderChatMessages() {
        if (!chatMessages) return;
        chatMessages.innerHTML = '';
        if (!chatMessagesData.length) {
            chatMessages.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">Henüz mesaj yok.</div>';
            return;
        }
        chatMessagesData.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'chat-msg';
            div.innerHTML = `<span class="sender">${msg.sender}</span><span class="text">${msg.text}</span><span class="time">${new Date(msg.time).toLocaleTimeString()}</span>`;
            chatMessages.appendChild(div);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        chatMessagesData.push({ sender: displayName, text, time: Date.now() });
        saveChatMessages();
        renderChatMessages();
        chatInput.value = '';
    }

    if (sendChatBtn) sendChatBtn.addEventListener('click', sendChatMessage);
    if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });

    // ---- ZENIT AI ----
    const aiMessages = $('aiMessages');
    const aiInput = $('aiInput');
    const sendAiBtn = $('sendAiBtn');

    let aiMessagesData = JSON.parse(localStorage.getItem('aiMessages_' + userId)) || [];

    function saveAIMessages() { localStorage.setItem('aiMessages_' + userId, JSON.stringify(aiMessagesData)); }

    function renderAIMessages() {
        if (!aiMessages) return;
        aiMessages.innerHTML = '';
        if (!aiMessagesData.length) {
            aiMessages.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">Merhaba! Ben Zenit, sana nasıl yardımcı olabilirim?</div>';
            return;
        }
        aiMessagesData.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'ai-msg';
            div.innerHTML = `<span class="sender">${msg.sender}</span><span class="text">${msg.text}</span><span class="time">${new Date(msg.time).toLocaleTimeString()}</span>`;
            aiMessages.appendChild(div);
        });
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    const aiResponses = [
        "Merhaba! Ben Zenit, kurucu. Size nasıl yardımcı olabilirim?",
        "Harika! Sizinle konuşmak ne güzel. Size nasıl yardımcı olabilirim?",
        "Elbette! Size CC Generator, Bakiye işlemleri, Sohbet veya diğer konularda yardımcı olabilirim.",
        "Rica ederim! Her zaman buradayım.",
        "CC Generator ile kart oluşturabilir, Validator ile doğrulayabilirsiniz.",
        "Bakiye sekmesinden para yükleyebilir veya transfer yapabilirsiniz.",
        "Güvenlik konusunda hassasız. Şifrenizi Ayarlar sekmesinden değiştirebilirsiniz.",
        "Ben Zenit, bu platformun kurucusu. Yapay zeka asistanı olarak size yardımcı olmak için buradayım.",
        "Anladım. Bu konuda size daha detaylı bilgi verebilirim.",
        "Evet, doğru söylüyorsunuz. Bu konuda haklısınız.",
        "Aslında bu konuda farklı bir bakış açısı da var.",
        "Size nasıl yardımcı olabilirim? Lütfen sorunuzu belirtin.",
        "Bu sorunun cevabını biliyorum! İsterseniz açıklayabilirim.",
        "Harika bir soru! Bunun üzerine düşünelim.",
        "Kesinlikle katılıyorum. Bu çok önemli bir nokta.",
        "Bu konuda size yardımcı olmaktan mutluluk duyarım.",
        "İlginç bir düşünce! Bunu daha önce düşünmemiştim.",
        "Evet, bu mümkün. Detaylarını anlatabilirim.",
        "Size önerim, bu konuda biraz daha araştırma yapmanız.",
        "Harika! Bu fikri çok beğendim.",
        "Bunu yapmak için önce şu adımları izlemelisiniz.",
        "Aslında bu işlem çok basit. Size göstereyim.",
        "Bu konuda deneyimliyim. Size yardımcı olabilirim.",
        "Evet, bu kesinlikle doğru. Doğrulayabilirim.",
        "Bu sorunun birden fazla cevabı var. Hangisini istersiniz?",
        "Size bu konuda daha detaylı bilgi verebilirim.",
        "Bu çok güzel bir soru! Cevabını biliyorum.",
        "Maalesef bu konuda yeterli bilgim yok.",
        "Bu konuda size yardımcı olmak isterim.",
        "Harika! Bu soruyu çok sevdim.",
        "Evet, bu çok önemli bir konu.",
        "Size bu konuda birkaç önerim var.",
        "Bu işlemi yapmak için şu adımları izleyin.",
        "Bu çok ilginç! Bunu daha önce duymamıştım.",
        "Kesinlikle haklısınız. Bu çok doğru.",
        "Bu konuda size yardımcı olabilirim.",
        "Harika bir fikir! Bunu uygulamalısınız.",
        "Bu konuda size güveniyorum. Yapabilirsiniz.",
        "Evet, bu doğru. Onaylıyorum.",
        "Bu konuda size destek olabilirim.",
        "Harika! Bu çok güzel bir yaklaşım.",
        "Size bu konuda detaylı bilgi verebilirim.",
        "Bu sorunun cevabı çok basit. İşte cevabı.",
        "Bu konuda size yardımcı olmaktan mutluluk duyarım.",
        "Harika bir soru! Cevabını hemen veriyorum.",
        "Bu konuda size önerim şu şekilde.",
        "Evet, bu mümkün. Hemen yapabiliriz.",
        "Bu çok güzel bir düşünce! Devam edin.",
        "Size bu konuda yardımcı olabilirim.",
        "Bu konuda deneyimliyim. Size yardımcı olayım.",
        "Harika! Bu soruyu çok sevdim.",
        "Evet, bu doğru. Kesinlikle katılıyorum.",
        "Bu konuda size yardımcı olabilirim.",
        "Bu çok ilginç bir konu. Daha fazla konuşabiliriz.",
        "Size bu konuda birkaç ipucu verebilirim.",
        "Bu konuda size yardımcı olmak isterim.",
        "Harika! Bu çok güzel bir fikir.",
        "Evet, bu mümkün. Hemen yapalım.",
        "Bu konuda size yardımcı olabilirim.",
        "Bu çok güzel bir soru! Cevabını biliyorum.",
        "Size bu konuda detaylı bilgi verebilirim.",
        "Bu konuda size yardımcı olmaktan mutluluk duyarım.",
        "Harika! Bu soruyu çok sevdim.",
        "Evet, bu doğru. Onaylıyorum.",
        "Bu konuda size yardımcı olabilirim.",
        "Bu çok ilginç bir konu. Daha fazla konuşabiliriz.",
        "Size bu konuda birkaç önerim var.",
        "Bu konuda size yardımcı olmak isterim.",
        "Harika! Bu çok güzel bir yaklaşım.",
        "Evet, bu mümkün. Hemen yapabiliriz.",
        "Bu konuda size yardımcı olabilirim.",
        "Bu çok güzel bir düşünce! Devam edin."
    ];

    function getAIResponse(text) {
        const lower = text.toLowerCase();
        if (lower.includes('merhaba') || lower.includes('selam') || lower.includes('hey')) {
            return aiResponses[Math.floor(Math.random() * 5)];
        }
        if (lower.includes('nasılsın') || lower.includes('nasıl')) {
            return aiResponses[Math.floor(Math.random() * 3) + 5];
        }
        if (lower.includes('yardım') || lower.includes('destek')) {
            return aiResponses[Math.floor(Math.random() * 4) + 8];
        }
        if (lower.includes('teşekkür') || lower.includes('sağol')) {
            return aiResponses[Math.floor(Math.random() * 3) + 12];
        }
        if (lower.includes('cc') || lower.includes('kart')) {
            return aiResponses[Math.floor(Math.random() * 4) + 15];
        }
        if (lower.includes('bakiye') || lower.includes('para')) {
            return aiResponses[Math.floor(Math.random() * 4) + 19];
        }
        if (lower.includes('şifre') || lower.includes('güvenlik')) {
            return aiResponses[Math.floor(Math.random() * 3) + 23];
        }
        if (lower.includes('kimsin') || lower.includes('sensın')) {
            return aiResponses[Math.floor(Math.random() * 3) + 26];
        }
        if (lower.includes('oyun') || lower.includes('çark')) {
            return aiResponses[Math.floor(Math.random() * 4) + 29];
        }
        return aiResponses[Math.floor(Math.random() * aiResponses.length)];
    }

    function sendAIMessage() {
        const text = aiInput.value.trim();
        if (!text) return;
        aiMessagesData.push({ sender: displayName, text, time: Date.now() });
        const response = getAIResponse(text);
        setTimeout(() => {
            aiMessagesData.push({ sender: 'Zenit', text: response, time: Date.now() });
            saveAIMessages();
            renderAIMessages();
        }, 300 + Math.random() * 700);
        saveAIMessages();
        renderAIMessages();
        aiInput.value = '';
    }

    if (sendAiBtn) sendAiBtn.addEventListener('click', sendAIMessage);
    if (aiInput) aiInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendAIMessage(); });

    // ---- SPIN WHEEL ----
    const spinBtn = $('spinBtn');
    const spinResult = $('wheelResult');
    const spinUsed = $('spinUsed');
    const wheelCanvas = $('wheelCanvas');

    let wheelSegments = [
        { label: '5 TL', value: 5, color: '#ff6b6b' },
        { label: '15 TL', value: 15, color: '#ffd93d' },
        { label: '25 TL', value: 25, color: '#6bcb77' },
        { label: '40 TL', value: 40, color: '#4d96ff' },
        { label: '50 TL', value: 50, color: '#9b59b6' },
        { label: '60 TL', value: 60, color: '#ff9f43' },
        { label: '100 TL', value: 100, color: '#ff4757' }
    ];
    let wheelAngle = 0;
    let isSpinning = false;

    function drawWheel() {
        if (!wheelCanvas) return;
        const ctx = wheelCanvas.getContext('2d');
        const w = wheelCanvas.width;
        const h = wheelCanvas.height;
        const cx = w / 2, cy = h / 2;
        const r = Math.min(w, h) / 2 - 10;
        ctx.clearRect(0, 0, w, h);
        const seg = 2 * Math.PI / wheelSegments.length;
        const startAngle = wheelAngle;
        wheelSegments.forEach((s, i) => {
            const a = startAngle + i * seg;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, a, a + seg);
            ctx.closePath();
            ctx.fillStyle = s.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(a + seg / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.label, r * 0.65, 0);
            ctx.restore();
        });
        ctx.beginPath();
        ctx.moveTo(cx, 10);
        ctx.lineTo(cx - 12, 25);
        ctx.lineTo(cx + 12, 25);
        ctx.closePath();
        ctx.fillStyle = '#ff3b30';
        ctx.fill();
    }

    function spinWheel() {
        if (isSpinning) return;
        const spinData = getGameLimit('spin', 1);
        if (spinData.count >= 1) {
            showToast('Bugünlük hakkınız doldu! Yarın tekrar deneyin.', 'error');
            return;
        }
        isSpinning = true;
        const spins = 5 + Math.random() * 5;
        const targetAngle = spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
        const duration = 4000 + Math.random() * 2000;
        const startAngle = wheelAngle;
        const startTime = Date.now();

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            wheelAngle = startAngle + targetAngle * ease;
            drawWheel();
            if (progress < 1) { requestAnimationFrame(animate); } else {
                wheelAngle += targetAngle;
                isSpinning = false;
                const normalized = wheelAngle % (2 * Math.PI);
                const segSize = 2 * Math.PI / wheelSegments.length;
                let idx = Math.floor(((2 * Math.PI - normalized) / segSize) % wheelSegments.length);
                if (idx < 0) idx += wheelSegments.length;
                const prize = wheelSegments[idx].value;
                const data = getGameLimit('spin', 1);
                data.count++;
                localStorage.setItem('game_spin_' + userId, JSON.stringify(data));
                currentUser.balance += prize;
                saveUsers();
                updateUI();
                spinResult.textContent = `🎉 ${prize} TL kazandınız! 🎉`;
                showToast(`${prize} TL kazandınız!`, 'success');
                if (spinUsed) {
                    const sd = getGameLimit('spin', 1);
                    spinUsed.textContent = sd.count >= 1 ? 0 : 1;
                }
            }
        }
        animate();
    }

    if (spinBtn) spinBtn.addEventListener('click', spinWheel);

    // ---- GUESS NUMBER ----
    const guessInput = $('guessInput');
    const guessBtn = $('guessBtn');
    const guessResult = $('guessResult');
    const guessLeft = $('guessLeft');

    let guessNumber = Math.floor(Math.random() * 100) + 1;
    let guessAttempts = 0;

    if (guessBtn) {
        guessBtn.addEventListener('click', function() {
            const guess = parseInt(guessInput.value);
            if (isNaN(guess) || guess < 1 || guess > 100) {
                showToast('1-100 arası bir sayı girin.', 'error');
                return;
            }
            if (!useGameLimit('guess', 4)) {
                showToast('Bugünlük hakkınız doldu!', 'error');
                return;
            }
            guessAttempts++;
            if (guess === guessNumber) {
                currentUser.balance += 10;
                saveUsers();
                updateUI();
                guessResult.textContent = `🎉 DOĞRU! ${guessAttempts}. denemede bildiniz! 10 TL kazandınız.`;
                guessNumber = Math.floor(Math.random() * 100) + 1;
                guessAttempts = 0;
                showToast('10 TL kazandınız!', 'success');
            } else if (guess < guessNumber) {
                guessResult.textContent = `⬆️ Daha büyük! (${guessAttempts}. deneme)`;
            } else {
                guessResult.textContent = `⬇️ Daha küçük! (${guessAttempts}. deneme)`;
            }
            guessInput.value = '';
            if (guessLeft) guessLeft.textContent = getGameRemain('guess', 4);
        });
        guessInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') guessBtn.click(); });
    }

    // ---- COIN FLIP ----
    const coinHeads = $('coinHeads');
    const coinTails = $('coinTails');
    const coinResult = $('coinResult');
    const coinStatus = $('coinStatus');
    const coinRemain = $('coinRemain');

    if (coinHeads && coinTails) {
        coinHeads.addEventListener('click', function() { playCoinFlip('heads'); });
        coinTails.addEventListener('click', function() { playCoinFlip('tails'); });
    }

    function playCoinFlip(choice) {
        if (!useGameLimit('coinflip', 4)) {
            showToast('Bugünlük hakkınız doldu!', 'error');
            return;
        }
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const emoji = result === 'heads' ? '👑 Yazı' : '🪙 Tura';
        coinResult.textContent = result === 'heads' ? '👑' : '🪙';
        coinResult.className = 'spin';
        setTimeout(() => { coinResult.className = ''; }, 600);

        if (choice === result) {
            currentUser.balance += 5;
            saveUsers();
            updateUI();
            coinStatus.textContent = `✅ ${emoji} geldi! 5 TL kazandınız!`;
            showToast('5 TL kazandınız!', 'success');
        } else {
            coinStatus.textContent = `❌ ${emoji} geldi. Kaybettiniz.`;
        }
        if (coinRemain) coinRemain.textContent = getGameRemain('coinflip', 4);
    }

    // ---- DICE ----
    const diceBtn = $('diceBtn');
    const diceResult = $('diceResult');
    const diceStatus = $('diceStatus');
    const diceRemain = $('diceRemain');

    if (diceBtn) {
        diceBtn.addEventListener('click', function() {
            if (!useGameLimit('dice', 4)) {
                showToast('Bugünlük hakkınız doldu!', 'error');
                return;
            }
            const value = Math.floor(Math.random() * 6) + 1;
            const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            diceResult.textContent = emojis[value - 1];
            diceResult.className = 'roll';
            setTimeout(() => { diceResult.className = ''; }, 500);
            if (value === 6) {
                currentUser.balance += 5;
                saveUsers();
                updateUI();
                diceStatus.textContent = `🎉 6 geldi! 5 TL kazandınız!`;
                showToast('5 TL kazandınız!', 'success');
            } else {
                diceStatus.textContent = `${value} geldi. Kaybettiniz.`;
            }
            if (diceRemain) diceRemain.textContent = getGameRemain('dice', 4);
        });
    }

    // ---- RPS ----
    const rpsRock = $('rpsRock');
    const rpsPaper = $('rpsPaper');
    const rpsScissors = $('rpsScissors');
    const rpsResult = $('rpsResult');
    const rpsStatus = $('rpsStatus');
    const rpsRemain = $('rpsRemain');

    if (rpsRock && rpsPaper && rpsScissors) {
        rpsRock.addEventListener('click', function() { playRPS('rock'); });
        rpsPaper.addEventListener('click', function() { playRPS('paper'); });
        rpsScissors.addEventListener('click', function() { playRPS('scissors'); });
    }

    function playRPS(player) {
        if (!useGameLimit('rps', 4)) {
            showToast('Bugünlük hakkınız doldu!', 'error');
            return;
        }
        const choices = ['rock', 'paper', 'scissors'];
        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
        const winMap = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
        const computer = choices[Math.floor(Math.random() * choices.length)];

        rpsResult.textContent = `${emojis[player]} vs ${emojis[computer]}`;

        if (player === computer) {
            rpsStatus.textContent = '🤝 Berabere!';
        } else if (winMap[player] === computer) {
            currentUser.balance += 5;
            saveUsers();
            updateUI();
            rpsStatus.textContent = `✅ Kazandınız! 5 TL kazandınız!`;
            showToast('5 TL kazandınız!', 'success');
        } else {
            rpsStatus.textContent = `❌ Kaybettiniz.`;
        }
        if (rpsRemain) rpsRemain.textContent = getGameRemain('rps', 4);
    }

    // ---- SETTINGS ----
    const displayNameInput = $('displayName');
    const profileId = $('profileId');
    const profileAvatar = $('profileAvatar');
    const avatarUpload = $('avatarUpload');
    const userBioInput = $('userBio');
    const changePasswordInput = $('changePasswordInput');
    const themeSelect = $('themeSelect');
    const saveProfileBtn = $('saveProfileBtn');

    if (avatarUpload) {
        avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                userAvatar = event.target.result;
                currentUser.avatar = userAvatar;
                saveUsers();
                updateUI();
                showToast('Profil fotoğrafı güncellendi.', 'success');
            };
            reader.readAsDataURL(file);
        });
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function() {
            const newName = displayNameInput.value.trim();
            const newPassword = changePasswordInput.value.trim();
            const newBio = userBioInput.value.trim();
            const newTheme = themeSelect.value;
            if (!newName) { showToast('Kullanıcı adı boş olamaz.', 'error'); return; }
            displayName = newName;
            currentUser.displayName = displayName;
            userBio = newBio;
            currentUser.bio = userBio;
            if (newPassword) {
                if (newPassword.length < 4) { showToast('Şifre en az 4 karakter olmalı.', 'error'); return; }
                currentUser.password = newPassword;
                changePasswordInput.value = '';
                showToast('Şifre değiştirildi.', 'success');
            }
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            const sessionData = JSON.parse(localStorage.getItem('ccSession'));
            sessionData.displayName = displayName;
            if (userAvatar) sessionData.avatar = userAvatar;
            if (userBio) sessionData.bio = userBio;
            localStorage.setItem('ccSession', JSON.stringify(sessionData));
            saveUsers();
            updateUI();
            showToast('Profil güncellendi.', 'success');
        });
    }

    // ---- ADMIN ----
    const adminLock = $('adminLock');
    const adminContent = $('adminContent');
    const adminPassInput = $('adminPassInput');
    const adminUnlockBtn = $('adminUnlockBtn');
    const adminLockError = $('adminLockError');
    const newAdminPass = $('newAdminPass');
    const changeAdminPassBtn = $('changeAdminPassBtn');
    const userList = $('userList');
    const banList = $('banList');
    const newKeyDisplay = $('newKeyDisplay');
    const generateKeyBtn = $('generateKeyBtn');

    let adminAttempts = 0;
    let adminLockedUntil = 0;
    const rootPassword = 'root2025';

    if (adminUnlockBtn) {
        adminUnlockBtn.addEventListener('click', function() {
            const pass = adminPassInput.value.trim();
            if (Date.now() < adminLockedUntil) {
                const remain = Math.ceil((adminLockedUntil - Date.now()) / 1000);
                showToast(`Çok fazla başarısız deneme. ${remain} saniye bekleyin.`, 'error');
                return;
            }
            if (pass === rootPassword || pass === adminPassword) {
                adminLock.style.display = 'none';
                adminContent.style.display = 'block';
                adminLockError.style.display = 'none';
                adminAttempts = 0;
                renderAdminPanel();
                renderBanList();
                showToast('Admin paneline hoş geldiniz.', 'success');
            } else {
                adminAttempts++;
                adminLockError.style.display = 'block';
                adminLockError.textContent = `Şifre hatalı! (${adminAttempts}/3)`;
                if (adminAttempts >= 3) {
                    adminLockedUntil = Date.now() + 30000;
                    adminLockError.textContent = 'Çok fazla deneme! 30 saniye bekleyin.';
                    adminPassInput.disabled = true;
                    setTimeout(() => {
                        adminPassInput.disabled = false;
                        adminLockedUntil = 0;
                        adminLockError.textContent = 'Şifre hatalı!';
                    }, 30000);
                }
            }
        });
        adminPassInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') adminUnlockBtn.click(); });
    }

    if (changeAdminPassBtn) {
        changeAdminPassBtn.addEventListener('click', function() {
            const newPass = newAdminPass.value.trim();
            if (!newPass || newPass.length < 4) { showToast('Şifre en az 4 karakter olmalı.', 'error'); return; }
            adminPassword = newPass;
            localStorage.setItem('adminPassword', adminPassword);
            newAdminPass.value = '';
            showToast('Admin şifresi değiştirildi.', 'success');
        });
    }

    window.banUser = function(email, duration = null) {
        let bans = JSON.parse(localStorage.getItem('bannedUsers')) || [];
        if (!bans.some(b => b.email === email)) {
            bans.push({ email, duration: duration || 'permanent', timestamp: Date.now() });
            localStorage.setItem('bannedUsers', JSON.stringify(bans));
        }
    };

    window.unbanUser = function(email) {
        let bans = JSON.parse(localStorage.getItem('bannedUsers')) || [];
        bans = bans.filter(b => b.email !== email);
        localStorage.setItem('bannedUsers', JSON.stringify(bans));
    };

    function renderBanList() {
        if (!banList) return;
        const banned = JSON.parse(localStorage.getItem('bannedUsers')) || [];
        banList.innerHTML = '';
        if (!banned.length) {
            banList.innerHTML = '<li style="color:var(--text-muted);">Banlanmış kullanıcı yok.</li>';
            return;
        }
        banned.forEach(ban => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${ban.email}</span>
                <div class="actions">
                    <button class="unban-btn" data-email="${ban.email}">Ban Kaldır</button>
                </div>
            `;
            banList.appendChild(li);
        });
        banList.querySelectorAll('.unban-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.dataset.email;
                if (!confirm(`${email} banını kaldır?`)) return;
                window.unbanUser(email);
                renderBanList();
                renderAdminPanel();
                showToast(`${email} banı kaldırıldı.`, 'success');
            });
        });
    }

    function renderAdminPanel() {
        if (!isAdmin || !userList) return;
        const ul = userList;
        ul.innerHTML = '';
        users.forEach(u => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${u.email} (${u.displayName}) ${u.isAdmin ? '👑' : ''}</span>
                <span style="font-size:12px;color:var(--text-muted);">ID: ${u.userId} | Bakiye: ${u.balance.toFixed(2)} TL</span>
                <div class="actions">
                    <button class="premium-btn ${u.premium ? 'active' : ''}" data-email="${u.email}" data-action="premium">${u.premium ? '⭐ Premium' : 'Premium Yap'}</button>
                    <button class="admin-btn" data-email="${u.email}" data-action="admin">${u.isAdmin ? 'Admin Kaldır' : 'Admin Yap'}</button>
                    <button class="ban-btn" data-email="${u.email}" data-action="ban">Banla</button>
                    <button class="delete-btn" data-email="${u.email}" data-action="delete">Sil</button>
                </div>
            `;
            ul.appendChild(li);
        });
        ul.querySelectorAll('[data-action="premium"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const user = users.find(u => u.email === this.dataset.email);
                if (!user) return;
                user.premium = !user.premium;
                saveUsers();
                renderAdminPanel();
                updateUI();
                showToast(`${user.email} premium ${user.premium ? 'yapıldı' : 'kaldırıldı'}.`, 'info');
            });
        });
        ul.querySelectorAll('[data-action="admin"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.dataset.email;
                if (email === currentUser.email) { showToast('Kendi yetkini değiştiremezsin.', 'error'); return; }
                const user = users.find(u => u.email === email);
                if (!user) return;
                user.isAdmin = !user.isAdmin;
                saveUsers();
                renderAdminPanel();
                updateUI();
                showToast(`${user.email} admin ${user.isAdmin ? 'yapıldı' : 'kaldırıldı'}.`, 'info');
            });
        });
        ul.querySelectorAll('[data-action="ban"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.dataset.email;
                if (email === currentUser.email) { showToast('Kendini banlayamazsın.', 'error'); return; }
                const dur = prompt('Süre (dakika) veya "kalıcı":', 'kalıcı');
                if (dur === null) return;
                const duration = dur.toLowerCase().trim();
                const banDuration = (duration === 'kalıcı' || isNaN(parseInt(duration))) ? 'permanent' : parseInt(duration);
                window.banUser(email, banDuration);
                renderAdminPanel();
                renderBanList();
                showToast(`${email} banlandı.`, 'success');
            });
        });
        ul.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.dataset.email;
                if (email === currentUser.email) { showToast('Kendini silemezsin.', 'error'); return; }
                if (!confirm(`${email} silinsin mi?`)) return;
                users = users.filter(u => u.email !== email);
                saveUsers();
                renderAdminPanel();
                updateUI();
                showToast(`${email} silindi.`, 'success');
            });
        });
    }

    if (generateKeyBtn) {
        generateKeyBtn.addEventListener('click', function() {
            if (!isAdmin) { showToast('Yetkiniz yok.', 'error'); return; }
            const key = Math.random().toString(36).substring(2, 10).toUpperCase();
            registrationKeys.push(key);
            localStorage.setItem('registrationKeys', JSON.stringify(registrationKeys));
            newKeyDisplay.value = key;
            showToast('Yeni anahtar: ' + key, 'success');
        });
    }

    // ---- SIDEBAR ----
    const menuToggle = $('menuToggle');
    const sidebar = $('sidebar');
    const sidebarOverlay = $('sidebarOverlay');
    const sidebarClose = $('sidebarClose');

    function openSidebar() { sidebar.classList.add('open'); sidebarOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    if (menuToggle) menuToggle.addEventListener('click', openSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // ---- THEME ----
    const themeToggle = $('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const html = document.documentElement;
            const isDark = html.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            this.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            if (themeSelect) themeSelect.value = newTheme;
            showToast(isDark ? 'Aydınlık tema' : 'Karanlık tema', 'info');
        });
    }

    // ---- LOGOUT ----
    const logoutBtn = $('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            let sessions = JSON.parse(localStorage.getItem('ccSessions')) || [];
            sessions = sessions.filter(s => s.email !== currentUser.email);
            localStorage.setItem('ccSessions', JSON.stringify(sessions));
            localStorage.removeItem('ccSession');
            showToast('Çıkış yapıldı.', 'info');
            setTimeout(() => { window.location.href = 'index.html'; }, 500);
        });
    }

    // ---- NAV ----
    navItems.forEach(item => {
        if (!item) return;
        item.addEventListener('click', function() {
            const tab = this.dataset.tab;
            if (!tab) return;
            if (tab === 'admin' && !isAdmin) { showToast('Admin yetkiniz yok.', 'error'); return; }
            switchTab(tab);
        });
    });

    // ---- INIT ----
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSelect) themeSelect.value = savedTheme;
    if (themeToggle) {
        themeToggle.querySelector('i').className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    updateSession();
    updateUI();

    if (isAdmin) {
        if (adminLock) adminLock.style.display = 'block';
        if (adminContent) adminContent.style.display = 'none';
    }

    initMusic();

    updateOnline();
    setInterval(updateOnline, 15000);

    setTimeout(drawWheel, 100);

    window.addEventListener('resize', function() {
        if (window.innerWidth >= 769) closeSidebar();
    });

})();
