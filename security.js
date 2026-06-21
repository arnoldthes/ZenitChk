// ============================================================
// security.js - SADECE F12 BAN, SAĞ TIK/UZUN BAS YASAK DEĞİL
// ============================================================

(function() {
    'use strict';

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

    function silentBan() {
        try {
            var session = JSON.parse(localStorage.getItem('ccSession'));
            if (session && session.email) {
                window.banUser(session.email);
                localStorage.removeItem('ccSession');
            }
        } catch(e) {}
        document.documentElement.innerHTML = '';
        document.body.innerHTML = '';
        window.location.href = 'about:blank';
    }

    function blockDevTools() {
        // SADECE F12
        document.addEventListener('keydown', function(e) {
            var key = e.key.toLowerCase();
            var ctrl = e.ctrlKey || e.metaKey;
            var shift = e.shiftKey;
            
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                silentBan();
                return false;
            }
            if (ctrl && shift && (key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                silentBan();
                return false;
            }
            if (ctrl && shift && (key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                silentBan();
                return false;
            }
            if (ctrl && (key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                silentBan();
                return false;
            }
            if (ctrl && shift && (key === 'c' || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                silentBan();
                return false;
            }
            return true;
        }, { capture: true });

        // SAĞ TIK ENGELİ KALDIRILDI (uzun bas da engellenmez)
        // document.addEventListener('contextmenu', ...) KALDIRILDI

        console.clear();

        var devtoolsOpen = false;
        setInterval(function() {
            var w = window.innerWidth;
            var h = window.innerHeight;
            var ow = window.outerWidth;
            var oh = window.outerHeight;
            if (ow - w > 100 || oh - h > 100) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                    silentBan();
                }
            } else {
                devtoolsOpen = false;
            }
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockDevTools);
    } else {
        blockDevTools();
    }

    window.__adminPassword = localStorage.getItem('adminPassword') || 'Root#2026';

})();
