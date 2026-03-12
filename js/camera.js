// Camera Module
let cameraStream = null;

function initCamera() {
    document.getElementById('toggleCameraBtn').addEventListener('click', function() {
        const container = document.getElementById('cameraContainer');
        const video = document.getElementById('cameraVideo');
        const btn = document.getElementById('toggleCameraBtn');
        
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            alert('Camera requires HTTPS connection. Please access via https:// or localhost');
            return;
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Camera not supported in this browser. Please use Chrome, Firefox, or Edge.');
            return;
        }
        
        if (container.style.display === 'none') {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                .then(stream => {
                    cameraStream = stream;
                    video.srcObject = stream;
                    container.style.display = 'block';
                    btn.style.display = 'none';
                })
                .catch(error => {
                    console.error('Camera error:', error);
                    if (error.name === 'NotAllowedError') {
                        alert('Camera access denied. Please allow camera permissions in your browser settings.');
                    } else if (error.name === 'NotFoundError') {
                        alert('No camera found on this device.');
                    } else if (error.name === 'NotReadableError') {
                        alert('Camera is already in use by another application.');
                    } else {
                        alert('Camera error: ' + error.message);
                    }
                });
        }
    });
    
    document.getElementById('closeCameraBtn').addEventListener('click', function() {
        const container = document.getElementById('cameraContainer');
        const video = document.getElementById('cameraVideo');
        const btn = document.getElementById('toggleCameraBtn');
        
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        video.srcObject = null;
        container.style.display = 'none';
        btn.style.display = 'flex';
    });
}
