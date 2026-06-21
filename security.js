// ============================================================
// security.js - GELİŞMİŞ GÜVENLİK
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

    // ---- SAYFA KONTROLÜ ----
    const currentPage = window.location.pathname.split('/').pop();
    const isDashboard = currentPage === 'dashboard.html' || currentPage === '';
    const isAuthPage = currentPage === 'index.html' || currentPage === 'register.html' || currentPage === '';

    // ---- UYARI GÖSTER (BAN YOK) ----
    function showWarning() {
        alert('⚠️ Bu işlem yasaktır!\nLütfen geliştirici araçlarını kullanmayın.');
        // Sayfayı yenile (ama banlama)
        window.location.reload();
    }

    // ---- BANLA VE ÖLDÜR (SADECE DASHBOARD) ----
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
        alert('🚫 BU İŞLEM YASAKTIR!\nHesabınız kalıcı olarak yasaklanmıştır.');
        window.location.href = 'about:blank';
    }

    // ---- ENGELLEMELER ----
    function blockDevTools() {
        
        // 1. F12 ve kısayollar
        document.addEventListener('keydown', function(e) {
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                
                if (isDashboard) {
                    banAndKill();
                } else {
                    showWarning();
                }
                return false;
            }
            
            // Ctrl+Shift+I (Inspect)
            if (ctrl && shift && (key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) {
                    banAndKill();
                } else {
                    showWarning();
                }
                return false;
            }
            
            // Ctrl+Shift+J (Console)
            if (ctrl && shift && (key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) {
                    banAndKill();
                } else {
                    showWarning();
                }
                return false;
            }
            
            // Ctrl+U (View Source)
            if (ctrl && (key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) {
                    banAndKill();
                } else {
                    showWarning();
                }
                return false;
            }
            
            // Ctrl+Shift+C (Element Picker)
            if (ctrl && shift && (key === 'c' || e.keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) {
                    banAndKill();
                } else {
                    showWarning();
                }
                return false;
            }

            // Ctrl+S (Save) - her yerde yasak
            if (ctrl && (key === 's' || e.keyCode === 83)) {
                e.preventDefault();
                e.stopPropagation();
                if (isDashboard) {
                    banAndKill();
                } else {
                    showWarning();
                }
                return false;
            }

            return true;
        }, { capture: true });

        // 2. Sağ tık
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (isDashboard) {
                banAndKill();
            } else {
                showWarning();
            }
            return false;
        }, { capture: true });

        // 3. Console'u temizle
        console.clear();
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};
        console.debug = function() {};
        console.trace = function() {};
        console.table = function() {};
        console.dir = function() {};

        // 4. Devtools açılma kontrolü (SADECE DASHBOARD'DA BANLA)
        let devtoolsOpen = false;
        setInterval(function() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const ow = window.outerWidth;
            const oh = window.outerHeight;
            
            if (ow - w > 100 || oh - h > 100) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                    if (isDashboard) {
                        banAndKill();
                    } else {
                        // Auth sayfalarında sadece uyarı
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

        // 6. Seçim engelle (input/textarea hariç)
        document.addEventListener('selectstart', function(e) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                return false;
            }
        }, { capture: true });

        // 7. Visibility change (sekme değişince - SADECE DASHBOARD)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && isDashboard) {
                banAndKill();
            }
        }, { capture: true });

        // 8. Window blur (SADECE DASHBOARD)
        window.addEventListener('blur', function() {
            if (isDashboard) {
                setTimeout(banAndKill, 100);
            }
        }, { capture: true });

        // 9. DOM değişikliklerini izle (SADECE DASHBOARD)
        if (isDashboard) {
            const observer = new MutationObserver(function() {
                banAndKill();
            });
            observer.observe(document.documentElement, { 
                attributes: true, 
                childList: true, 
                subtree: true 
            });
        }
    }

    // ---- SAYFA YÜKLENİR YÜKLENMEZ ÇALIŞTIR ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockDevTools);
    } else {
        blockDevTools();
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
