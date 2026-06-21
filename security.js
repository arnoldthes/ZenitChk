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

    // ---- TÜM GELİŞTİRİCİ ARAÇLARINI ENGELLE ----
    function blockDevTools() {
        // 1. Tüm kısayolları engelle
        document.addEventListener('keydown', function(e) {
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+I (Inspect)
            if (ctrl && shift && (key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+J (Console)
            if (ctrl && shift && (key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+U (View Source)
            if (ctrl && (key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+C (Element Picker)
            if (ctrl && shift && (key === 'c' || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+E (Dev Tools)
            if (ctrl && shift && (key === 'e' || e.keyCode === 69)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+S (Save page)
            if (ctrl && (key === 's' || e.keyCode === 83)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl+P (Print)
            if (ctrl && (key === 'p' || e.keyCode === 80)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            return true;
        });

        // 2. Sağ tık
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            banAndKill();
            return false;
        });

        // 3. Console'u tamamen temizle ve devre dışı bırak
        console.clear();
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};
        console.debug = function() {};
        console.trace = function() {};
        console.table = function() {};
        console.dir = function() {};
        console.assert = function() {};

        // 4. Devtools açılma kontrolü (resize)
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
                    banAndKill();
                }
            } else {
                devtoolsOpen = false;
            }
        }, 500);

        // 5. Drag engelle
        document.addEventListener('dragstart', function(e) {
            e.preventDefault();
            return false;
        });

        // 6. Seçim engelle
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        });

        // 7. Copy/Paste/Cut engelle
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

        // 8. Visibility change (sekme değişince)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                banAndKill();
            }
        });

        // 9. Window blur (focus kaybı)
        window.addEventListener('blur', function() {
            setTimeout(function() {
                banAndKill();
            }, 100);
        });

        // 10. DOM değişikliklerini izle
        const observer = new MutationObserver(function() {
            banAndKill();
        });
        observer.observe(document.documentElement, { 
            attributes: true, 
            childList: true, 
            subtree: true 
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
        
        // Sayfayı tamamen temizle
        document.documentElement.innerHTML = '';
        document.body.innerHTML = '';
        
        // Kullanıcıyı uyar
        alert('🚫 Erişim Engellendi!\nHesabınız kalıcı olarak yasaklanmıştır.');
        
        // Boş sayfaya yönlendir
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
        maxRequests: 20,
        timeWindow: 30000,
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
