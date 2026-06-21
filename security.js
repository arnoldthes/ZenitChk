// ============================================================
// security.js - F12 ve Sağ Tık BAN, Diğerleri UYARI
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
        }
    };

    window.unbanUser = function(email) {
        bannedUsers = bannedUsers.filter(function(e) { return e !== email; });
        saveBanned();
    };

    window.getBannedUsers = function() {
        return bannedUsers;
    };

    // ---- UYARI (BAN YOK) ----
    function showWarning() {
        alert('⚠️ Bu işlem yasaktır! Lütfen geliştirici araçlarını kullanmayın.');
    }

    // ---- BANLA VE ÖLDÜR (SADECE F12/SAĞ TIK) ----
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
        alert('🚫 HESABINIZ KALICI OLARAK YASAKLANMIŞTIR!');
        window.location.href = 'about:blank';
    }

    // ---- ENGELLEMELER ----
    function blockDevTools() {
        
        // 1. F12 ve kısayollar (BUNLAR BAN)
        document.addEventListener('keydown', function(e) {
            var key = e.key.toLowerCase();
            var ctrl = e.ctrlKey || e.metaKey;
            var shift = e.shiftKey;
            
            // F12 = BAN
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+I = BAN
            if (ctrl && shift && (key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+J = BAN
            if (ctrl && shift && (key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+U = BAN
            if (ctrl && (key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }
            
            // Ctrl+Shift+C = BAN
            if (ctrl && shift && (key === 'c' || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                banAndKill();
                return false;
            }

            // Ctrl+S = UYARI (ban yok, admin panelinde lazım)
            if (ctrl && (key === 's' || e.keyCode === 83)) {
                e.preventDefault();
                e.stopPropagation();
                showWarning();
                return false;
            }

            // Ctrl+P = UYARI
            if (ctrl && (key === 'p' || e.keyCode === 80)) {
                e.preventDefault();
                e.stopPropagation();
                showWarning();
                return false;
            }

            return true;
        }, { capture: true });

        // 2. Sağ tık = BAN
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            banAndKill();
            return false;
        }, { capture: true });

        // 3. Console'u devre dışı bırak (ama ban yok)
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

        // 4. Devtools açılma kontrolü (SADECE UYARI)
        var devtoolsOpen = false;
        setInterval(function() {
            var w = window.innerWidth;
            var h = window.innerHeight;
            var ow = window.outerWidth;
            var oh = window.outerHeight;
            
            if (ow - w > 100 || oh - h > 100) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                    // Devtools açıldı ama F12 basılmadıysa sadece uyarı
                    showWarning();
                }
            } else {
                devtoolsOpen = false;
            }
        }, 500);

        // 5. Drag = UYARI
        document.addEventListener('dragstart', function(e) {
            e.preventDefault();
            showWarning();
            return false;
        }, { capture: true });

        // 6. Seçim = UYARI (input/textarea hariç)
        document.addEventListener('selectstart', function(e) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                showWarning();
                return false;
            }
        }, { capture: true });

        // 7. Copy/Paste/Cut = UYARI (ama input alanlarında serbest)
        document.addEventListener('copy', function(e) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                showWarning();
                return false;
            }
        }, { capture: true });
        document.addEventListener('cut', function(e) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                showWarning();
                return false;
            }
        }, { capture: true });
        document.addEventListener('paste', function(e) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                showWarning();
                return false;
            }
        }, { capture: true });

        // 8. Visibility change = UYARI
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                showWarning();
            }
        }, { capture: true });

        // 9. Window blur = UYARI
        window.addEventListener('blur', function() {
            showWarning();
        }, { capture: true });
    }

    // ---- SAYFA YÜKLENİR YÜKLENMEZ ÇALIŞTIR ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockDevTools);
    } else {
        blockDevTools();
    }

    window.__adminPassword = localStorage.getItem('adminPassword') || 'Zenit2025!';

})();
