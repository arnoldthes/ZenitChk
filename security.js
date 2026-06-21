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

    // ---- GELİŞTİRİCİ ARAÇLARINI ENGELLEME YOK, SADECE ADMIN PANELİ KORUMASI ----
    // Admin paneli şifresi kontrolü zaten dashboard.js'de var.
    // Burada ekstra olarak console.log'ları temizleyelim (isteğe bağlı)
    console.clear();
    // console.log'u pasifleştir (opsiyonel)
    // console.log = function() {};

    // Sayfa kapanırken oturumu temizleme (isteğe bağlı)
    window.addEventListener('beforeunload', function() {
        // İsteğe bağlı
    });

    // Kullanıcı admin paneli şifresini değiştirebilir
    window.__adminPassword = localStorage.getItem('adminPassword') || 'root2025';

})();
