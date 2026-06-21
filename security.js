// ============================================================
// security.js - SESSİZ BAN SİSTEMİ
// ============================================================

(function() {
    'use strict';

    // ---- BAN LİSTESİ ----
    var bannedUsers = JSON.parse(localStorage.getItem('bannedUsers')) || [];

    function saveBanned() {
        localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
    }

    window.banUser = function(email) {
        if (!bannedUsers.includes(email)) {
            bannedUsers.push(email);
            saveBanned();
            console.log('🔒 Kullanıcı banlandı: ' + email);
        }
    };

    window.unbanUser = function(email) {
        bannedUsers = bannedUsers.filter(function(e) { return e !== email; });
        saveBanned();
    };

    window.getBannedUsers = function() {
        return bannedUsers;
    };

    // ---- SESSİZ BAN VE ÖLDÜR ----
    function silentBanAndKill() {
        try {
            var session = JSON.parse(localStorage.getItem('ccSession'));
            if (session && session.email) {
                window.banUser(session.email);
                localStorage.removeItem('ccSession');
            }
        } catch(e) {}
        
        // Sayfayı tamamen temizle (hiçbir uyarı gösterme)
        document.documentElement.innerHTML = '';
        document.body.innerHTML = '';
        window.location.href = 'about:blank';
    }

    // ---- ENGELLEMELER ----
    function blockDevTools() {
        
        // 1. F12 ve tüm kısayollar
        document.addEventListener('keydown', function(e) {
            var key = e.key.toLowerCase();
            var ctrl = e.ctrlKey || e.metaKey;
            var shift = e.shiftKey;
            
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                silentBanAndKill();
                return false;
            }
            
            // Ctrl+Shift+I
            if (ctrl && shift && (key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                silentBanAndKill();
                return false;
            }
            
            // Ctrl+Shift+J
            if (ctrl && shift && (key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                silentBanAndKill();
                return false;
            }
            
            // Ctrl+U
            if (ctrl && (key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                silentBanAndKill();
                return false;
            }
            
            // Ctrl+Shift+C
            if (ctrl && shift && (key === 'c' || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                silentBanAndKill();
                return false;
            }

            // Ctrl+S
            if (ctrl && (key === 's' || e.keyCode === 83)) {
                e.preventDefault();
                e.stopPropagation();
                silentBanAndKill();
                return false;
            }

            // Ctrl+P
            if (ctrl && (key === 'p' || e.keyCode === 80)) {
                e.preventDefault();
                e.stopPropagation();
                silentBanAndKill();
                return false;
            }

            return true;
        }, { capture: true });

        // 2. Sağ tık
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            silentBanAndKill();
            return false;
        }, { capture: true });

        // 3. Console'u tamamen öldür
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

        // 4. Devtools açılma kontrolü
        var devtoolsOpen = false;
        setInterval(function() {
            var w = window.innerWidth;
            var h = window.innerHeight;
            var ow = window.outerWidth;
            var oh = window.outerHeight;
            
            if (ow - w > 100 || oh - h > 100) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                    silentBanAndKill();
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
            e.preventDefault();
            return false;
        }, { capture: true });

        // 7. Copy/Paste/Cut engelle
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            return false;
        }, { capture: true });
        document.addEventListener('cut', function(e) {
            e.preventDefault();
            return false;
        }, { capture: true });
        document.addEventListener('paste', function(e) {
            e.preventDefault();
            return false;
        }, { capture: true });

        // 8. Visibility change
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                silentBanAndKill();
            }
        }, { capture: true });

        // 9. Window blur
        window.addEventListener('blur', function() {
            setTimeout(silentBanAndKill, 100);
        }, { capture: true });
    }

    // ---- SAYFA YÜKLENİR YÜKLENMEZ ÇALIŞTIR ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockDevTools);
    } else {
        blockDevTools();
    }

    // ---- ADMIN ŞİFRESİ ----
    window.__adminPassword = localStorage.getItem('adminPassword') || 'Zenit2025!';

})();
