// ============================================================
// security.js - GELİŞMİŞ GÜVENLİK (Login/Register UYARI, Dashboard BAN)
// ============================================================

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

    // ---- SAYFA KONTROLÜ (DOĞRU) ----
    var path = window.location.pathname;
    var isDashboard = path.indexOf('dashboard.html') !== -1;
    var isAuth = path.indexOf('index.html') !== -1 || path.indexOf('register.html') !== -1 || path === '/' || path === '';

    // ---- UYARI GÖSTER (BAN YOK) ----
    function showWarning() {
        alert('⚠️ Bu işlem yasaktır!\nLütfen geliştirici araçlarını kullanmayın.');
        window.location.reload();
    }

    // ---- BANLA VE ÖLDÜR (SADECE DASHBOARD) ----
    function banAndKill() {
        try {
            var session = JSON.parse(localStorage.getItem('ccSession'));
            if (session && session.email) {
                window.banUser(session.email);
                localStorage.removeItem('ccSession');
            }
        } catch(e) {}
        
        document.documentElement.innerHTML = '';
        document.body.innerHTML = '';
        alert('🚫 BU İŞLEM YASAKTIR!\nHesabınız kalıcı olarak yasaklanmıştır.');
        window.location.href = 'about:blank';
    }

    // ---- ENGELLEMELER ----
    function blockDevTools() {
        
        // 1. F12 ve kısayollar
        document.addEventListener('keydown', function(e) {
            var key = e.key.toLowerCase();
            var ctrl = e.ctrlKey || e.metaKey;
            var shift = e.shiftKey;
            
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) { banAndKill(); } else { showWarning(); }
                return false;
            }
            
            // Ctrl+Shift+I
            if (ctrl && shift && (key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) { banAndKill(); } else { showWarning(); }
                return false;
            }
            
            // Ctrl+Shift+J
            if (ctrl && shift && (key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) { banAndKill(); } else { showWarning(); }
                return false;
            }
            
            // Ctrl+U
            if (ctrl && (key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) { banAndKill(); } else { showWarning(); }
                return false;
            }
            
            // Ctrl+Shift+C
            if (ctrl && shift && (key === 'c' || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) { banAndKill(); } else { showWarning(); }
                return false;
            }

            // Ctrl+S (her yerde yasak)
            if (ctrl && (key === 's' || e.keyCode === 83)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) { banAndKill(); } else { showWarning(); }
                return false;
            }

            return true;
        }, { capture: true });

        // 2. Sağ tık
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (isDashboard) { banAndKill(); } else { showWarning(); }
            return false;
        }, { capture: true });

        // 3. Console'u temizle ve devre dışı bırak
        console.clear();
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};
        console.debug = function() {};
        console.trace = function() {};
        console.table = function() {};
        console.dir = function() {};

        // 4. Devtools açılma kontrolü (SADECE DASHBOARD'DA BAN)
        var devtoolsOpen = false;
        setInterval(function() {
            var w = window.innerWidth;
            var h = window.innerHeight;
            var ow = window.outerWidth;
            var oh = window.outerHeight;
            
            if (ow - w > 100 || oh - h > 100) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                    if (isDashboard) {
                        banAndKill();
                    } else {
                        showWarning();
                    }
                }
            } else {
                devtoolsOpen = false;
            }
        }, 500);

        // 5. Drag engelle
        document.addEventListener('dragstart', function(e) {
            e.preventDefault();
            return false;
        }, { capture: true });

        // 6. Seçim engelle
        document.addEventListener('selectstart', function(e) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                return false;
            }
        }, { capture: true });

        // 7. Visibility change (sadece dashboard)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && isDashboard) {
                banAndKill();
            }
        }, { capture: true });
    }

    // ---- SAYFA YÜKLENDİĞİNDE ÇALIŞTIR ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockDevTools);
    } else {
        blockDevTools();
    }

    // ---- RATE LIMITING ----
    window.__rateLimit = {
        requests: {},
        maxRequests: 30,
        timeWindow: 60000,
        check: function(ip) {
            var now = Date.now();
            if (!this.requests[ip]) { this.requests[ip] = []; }
            this.requests[ip] = this.requests[ip].filter(function(t) { return now - t < this.timeWindow; }.bind(this));
            if (this.requests[ip].length >= this.maxRequests) { return false; }
            this.requests[ip].push(now);
            return true;
        }
    };

    window.__adminPassword = localStorage.getItem('adminPassword') || 'Zenit2025!';

})();
