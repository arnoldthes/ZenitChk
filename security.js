(function() {
    'use strict';

    // ---- BAN LİSTESİ ----
    let bannedUsers = JSON.parse(localStorage.getItem('bannedUsers')) || [];

    function saveBanned() {
        localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
    }

    window.banUser = function(email) {
        if (!bannedUsers.includes(email)) {
            bannedUsers.push(email);
            saveBanned();
        }
    };

    window.unbanUser = function(email) {
        bannedUsers = bannedUsers.filter(e => e !== email);
        saveBanned();
    };

    window.getBannedUsers = function() {
        return bannedUsers;
    };

    // ---- F12 VE SAĞ TIK ENGELLE (BUNLARDA BANLA) ----
    function blockDevTools() {
        // F12 ve kısayollar
        document.addEventListener('keydown', function(e) {
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                showWarningAndBan();
                return false;
            }
            
            // Ctrl+Shift+I (Inspect)
            if (ctrl && shift && (key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                showWarningAndBan();
                return false;
            }
            
            // Ctrl+Shift+J (Console)
            if (ctrl && shift && (key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                showWarningAndBan();
                return false;
            }
            
            // Ctrl+U (View Source)
            if (ctrl && (key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                showWarningAndBan();
                return false;
            }
            
            // Ctrl+Shift+C (Element Picker)
            if (ctrl && shift && (key === 'c' || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                showWarningAndBan();
                return false;
            }

            return true;
        });

        // Sağ tık
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showWarningAndBan();
            return false;
        });

        // Console'u temizle
        console.clear();
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};
        console.debug = function() {};
        console.trace = function() {};

        // Devtools açılma kontrolü
        let devtoolsOpen = false;
        setInterval(function() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const ow = window.outerWidth;
            const oh = window.outerHeight;
            
            if (ow - w > 100 || oh - h > 100) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                    showWarningAndBan();
                }
            } else {
                devtoolsOpen = false;
            }
        }, 1000);

        // Drag engelle
        document.addEventListener('dragstart', function(e) {
            e.preventDefault();
            return false;
        });

        // Seçim engelle (ama kopyalama butonları çalışsın)
        document.addEventListener('selectstart', function(e) {
            // Sadece input/textarea değilse engelle
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                return false;
            }
        });
    }

    // ---- UYARI GÖSTER VE BANLA ----
    function showWarningAndBan() {
        try {
            const session = JSON.parse(localStorage.getItem('ccSession'));
            if (session && session.email) {
                window.banUser(session.email);
                localStorage.removeItem('ccSession');
            }
        } catch(e) {}
        
        // Önce uyarı göster
        alert('🚫 Bu işlem yasaktır!\nHesabınız kalıcı olarak yasaklanmıştır.');
        
        // Sayfayı temizle
        document.documentElement.innerHTML = '';
        document.body.innerHTML = '';
        window.location.href = 'about:blank';
    }

    // ---- SAYFA YÜKLENDİĞİNDE ÇALIŞTIR ----
    if (document.body) {
        blockDevTools();
    } else {
        document.addEventListener('DOMContentLoaded', blockDevTools);
    }

    // ---- RATE LIMITING ----
    const rateLimit = {
        requests: {},
        maxRequests: 30,
        timeWindow: 60000,
        check: function(ip) {
            const now = Date.now();
            if (!this.requests[ip]) {
                this.requests[ip] = [];
            }
            this.requests[ip] = this.requests[ip].filter(t => now - t < this.timeWindow);
            if (this.requests[ip].length >= this.maxRequests) {
                return false;
            }
            this.requests[ip].push(now);
            return true;
        }
    };

    window.__rateLimit = rateLimit;
    window.__adminPassword = localStorage.getItem('adminPassword') || 'Zenit2025!';

})();
