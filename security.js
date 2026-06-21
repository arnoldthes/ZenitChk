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

    // ---- GELİŞTİRİCİ ARAÇLARINI TAMAMEN ENGELLE ----
    function blockDevTools() {
        // Tüm kısayolları engelle
        document.addEventListener('keydown', function(e) {
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+Shift+I
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+Shift+J
            if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+U (Kaynak kod)
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+Shift+C (Element inspect)
            if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+Shift+E (Developer tools)
            if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e' || e.keyCode === 69)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+S (Save)
            if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            return true;
        });

        // Sağ tık
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // Console'u temizle ve engelle
        console.clear();
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};
        console.debug = function() {};
        console.trace = function() {};

        // Devtools açılma girişimlerini engelle (resize kontrolü)
        let lastWidth = window.innerWidth;
        let lastHeight = window.innerHeight;
        let devtoolsOpen = false;

        setInterval(function() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const ow = window.outerWidth;
            const oh = window.outerHeight;
            
            // Devtools açıksa boyut farkı olur
            if (ow - w > 100 || oh - h > 100) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                    // Banla ve sayfayı temizle
                    const session = JSON.parse(localStorage.getItem('ccSession'));
                    if (session && session.email) {
                        window.banUser(session.email);
                        localStorage.removeItem('ccSession');
                    }
                    document.documentElement.innerHTML = '';
                    alert('🚫 Erişim Engellendi! Hesabınız kalıcı olarak yasaklanmıştır.');
                    window.location.href = 'about:blank';
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

        // Copy/Paste/Cut engelle
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            return false;
        });
        document.addEventListener('cut', function(e) {
            e.preventDefault();
            return false;
        });
        document.addEventListener('paste', function(e) {
            e.preventDefault();
            return false;
        });

        // DOM değişikliklerini engelle (kaynak kod görüntüleme)
        const observer = new MutationObserver(function() {
            // Eğer birisi developer tools açmaya çalışırsa
            const session = JSON.parse(localStorage.getItem('ccSession'));
            if (session && session.email) {
                window.banUser(session.email);
                localStorage.removeItem('ccSession');
                document.documentElement.innerHTML = '';
                alert('🚫 Erişim Engellendi!');
                window.location.href = 'about:blank';
            }
        });
        observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });

        // Window blur/focus (devtools açıldığında focus kaybeder)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                const session = JSON.parse(localStorage.getItem('ccSession'));
                if (session && session.email) {
                    window.banUser(session.email);
                    localStorage.removeItem('ccSession');
                    document.documentElement.innerHTML = '';
                    alert('🚫 Erişim Engellendi!');
                    window.location.href = 'about:blank';
                }
            }
        });
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
        timeWindow: 60000, // 1 dakika
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

    // Global rate limit kontrolü
    window.__rateLimit = rateLimit;

    // Admin şifresi
    window.__adminPassword = localStorage.getItem('adminPassword') || 'root2025';

})();
