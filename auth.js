(function() {
    'use strict';

    // ---- BAN SİSTEMİ ----
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
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
        document.addEventListener('keydown', function(e) {
            const forbidden = (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
                (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c'))
            );
            if (forbidden) {
                e.preventDefault();
                const session = JSON.parse(localStorage.getItem('ccSession'));
                if (session && session.email) {
                    banUser(session.email);
                    localStorage.removeItem('ccSession');
                    alert('Developer tools detected! Your account has been permanently banned.');
                    window.location.href = 'index.html';
                } else {
                    alert('This action is prohibited!');
                }
                return false;
            }
        });

        // Sağ tık
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            const session = JSON.parse(localStorage.getItem('ccSession'));
            if (session && session.email) {
                banUser(session.email);
                localStorage.removeItem('ccSession');
                alert('Right-click detected! Your account has been permanently banned.');
                window.location.href = 'index.html';
            } else {
                alert('This action is prohibited!');
            }
            return false;
        });

        // Konsol temizleme ve debugger engelleme
        setInterval(function() {
            console.clear();
            debugger;
        }, 100);

        // Konsol açma girişimlerini engelle (Chrome)
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                const session = JSON.parse(localStorage.getItem('ccSession'));
                if (session && session.email) {
                    banUser(session.email);
                    localStorage.removeItem('ccSession');
                    alert('Console detected! Your account has been permanently banned.');
                    window.location.href = 'index.html';
                }
                return false;
            }
        });
    }

    if (document.body.classList.contains('dashboard-page') || document.body.classList.contains('auth-page')) {
        blockDevTools();
    }

    window.__isBanned = function(email) {
        return bannedUsers.includes(email);
    };
})();
