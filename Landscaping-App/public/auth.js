// Auth guard — include this script in all protected pages
(function() {
  const token = sessionStorage.getItem('adminToken');
  if (!token) {
    sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    location.replace('login.html');
  }
})();
