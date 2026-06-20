(function() {
    'use strict';

    // Ban listesi
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
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
                (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c'))) {
                e.preventDefault();
                const session = JSON.parse(localStorage.getItem('ccSession'));
                if (session && session.email) {
                    banUser(session.email);
                    localStorage.removeItem('ccSession');
                    // Sayfayı tamamen temizle
                    document.documentElement.innerHTML = '';
                    alert('Access Denied! Your account has been permanently banned.');
                    window.location.href = 'about:blank';
                } else {
                    document.documentElement.innerHTML = '';
                    alert('Access Denied!');
                    window.location.href = 'about:blank';
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
                document.documentElement.innerHTML = '';
                alert('Access Denied! Your account has been permanently banned.');
                window.location.href = 'about:blank';
            } else {
                document.documentElement.innerHTML = '';
                alert('Access Denied!');
                window.location.href = 'about:blank';
            }
            return false;
        });

        // Console'u temizle ve engelle
        console.clear();
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};

        // Devtools açılma girişimlerini engelle
        Object.defineProperty(document, 'documentElement', {
            get: function() {
                const session = JSON.parse(localStorage.getItem('ccSession'));
                if (session && session.email) {
                    banUser(session.email);
                    localStorage.removeItem('ccSession');
                    document.documentElement.innerHTML = '';
                    alert('Access Denied! Your account has been permanently banned.');
                    window.location.href = 'about:blank';
                }
                return document.documentElement;
            }
        });

        // Resize engelleme (devtools açıldığında boyut değişir)
        let lastWidth = window.innerWidth;
        let lastHeight = window.innerHeight;

        setInterval(function() {
            const session = JSON.parse(localStorage.getItem('ccSession'));
            if (window.innerWidth !== lastWidth || window.innerHeight !== lastHeight) {
                lastWidth = window.innerWidth;
                lastHeight = window.innerHeight;
                // Devtools açılmış olabilir
                if (window.outerHeight - window.innerHeight > 100 || window.outerWidth - window.innerWidth > 100) {
                    if (session && session.email) {
                        banUser(session.email);
                        localStorage.removeItem('ccSession');
                        document.documentElement.innerHTML = '';
                        alert('Access Denied! Your account has been permanently banned.');
                        window.location.href = 'about:blank';
                    }
                }
            }
        }, 1000);

        // Kaynak kod görüntülemeyi engelle
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F12' || e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }
        });

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

        // Copy/Paste engelle
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
    }

    if (document.body) {
        blockDevTools();
    } else {
        document.addEventListener('DOMContentLoaded', blockDevTools);
    }

    window.__isBanned = function(email) {
        return bannedUsers.includes(email);
    };
})();
