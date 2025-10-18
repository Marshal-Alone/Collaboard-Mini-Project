// Dynamic configuration based on environment
const config = {
    API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5050' 
        : 'https://collaborative-whiteboard-i6ri.onrender.com'
};

export default config; 