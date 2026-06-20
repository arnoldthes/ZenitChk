(function() {
  'use strict';
  
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
  
  function blockDevTools() {
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
          alert('🚫 Geliştirici araçları kullanımı nedeniyle hesabınız kalıcı olarak yasaklanmıştır!');
          window.location.href = 'index.html';
        } else {
          alert('🚫 Bu işlem yasaktır!');
        }
        return false;
      }
    });
    
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      const session = JSON.parse(localStorage.getItem('ccSession'));
      if (session && session.email) {
        banUser(session.email);
        localStorage.removeItem('ccSession');
        alert('🚫 Sağ tık kullanımı nedeniyle hesabınız kalıcı olarak yasaklanmıştır!');
        window.location.href = 'index.html';
      } else {
        alert('🚫 Bu işlem yasaktır!');
      }
      return false;
    });
  }
  
  if (document.body.classList.contains('dashboard-page')) {
    blockDevTools();
  }
  
  if (document.body.classList.contains('auth-page')) {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))) {
        e.preventDefault();
        alert('🚫 Bu işlem yasaktır!');
        return false;
      }
    });
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      alert('🚫 Bu işlem yasaktır!');
      return false;
    });
  }
  
  window.__isBanned = function(email) {
    return bannedUsers.includes(email);
  };
})();