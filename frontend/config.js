// Dynamic configuration based on environment
const config = {
    API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5050' 
        : window.location.origin
};

export default config; 