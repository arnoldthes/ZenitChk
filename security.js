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

    // ---- F12 VE SAĞ TIK ENGELLE (KAYIT BANLAMAZ) ----
    function blockDevTools() {
        // Sadece F12'yi engelle
        document.addEventListener('keydown', function(e) {
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+I (Inspect)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+U (View Source)
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+C (Element Picker)
            if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }

            return true;
        });

        // Sağ tık
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            banAndKill();
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

        // Devtools açılma kontrolü (resize)
        let devtoolsOpen = false;
        setInterval(function() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const ow = window.outerWidth;
            const oh = window.outerHeight;
            
            if (ow - w > 100 || oh - h > 100) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                    banAndKill();
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

        // Seçim engelle
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        });
    }

    // ---- BANLA VE ÖLDÜR ----
    function banAndKill() {
        try {
            const session = JSON.parse(localStorage.getItem('ccSession'));
            if (session && session.email) {
                window.banUser(session.email);
                localStorage.removeItem('ccSession');
            }
        } catch(e) {}
        
        document.documentElement.innerHTML = '';
        document.body.innerHTML = '';
        alert('🚫 Erişim Engellendi!\nHesabınız kalıcı olarak yasaklanmıştır.');
        window.location.href = 'about:blank';
    }

    // ---- SAYFA YÜKLENDİĞİNDE ÇALIŞTIR ----
    if (document.body) {
        blockDevTools();
    } else {
        document.addEventListener('DOMContentLoaded', blockDevTools);
    }

    // ---- RATE LIMITING (DDoS KORUMASI) ----
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
    window.__adminPassword = localStorage.getItem('adminPassword') || 'root2025';

})();
