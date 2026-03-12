// IP Address Display Module
function fetchUserIP() {
    const userAgent = navigator.userAgent;
    let deviceName = 'Unknown Device';
    
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
        if (/iPhone/i.test(userAgent)) deviceName = 'iPhone';
        else if (/iPad/i.test(userAgent)) deviceName = 'iPad';
        else if (/Android/i.test(userAgent)) deviceName = 'Android Device';
        else deviceName = 'Mobile Device';
    } else {
        if (/Windows/i.test(userAgent)) deviceName = 'Windows PC';
        else if (/Mac/i.test(userAgent)) deviceName = 'Mac';
        else if (/Linux/i.test(userAgent)) deviceName = 'Linux PC';
        else deviceName = 'Desktop';
    }
    
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            const ipAddress = data.ip;
            const city = data.city || 'Unknown';
            document.getElementById('ipAddress').textContent = `${ipAddress} | ${city} | ${deviceName}`;
        })
        .catch(error => {
            console.error('Error fetching IP:', error);
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('ipAddress').textContent = `${data.ip} | ${deviceName}`;
                })
                .catch(() => {
                    document.getElementById('ipAddress').textContent = `IP unavailable | ${deviceName}`;
                });
        });
}
