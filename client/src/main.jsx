import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'

import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import axios from 'axios'

// Configure default base URL dynamically (empty string defaults to relative paths / vite proxy in dev)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

// Configure global axios interceptor for auth token and club context
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    try {
        const verifiedEntityStr = localStorage.getItem('verifiedEntity');
        if (verifiedEntityStr && verifiedEntityStr !== 'undefined' && verifiedEntityStr !== 'null') {
            const entityObj = JSON.parse(verifiedEntityStr);
            if (entityObj && entityObj.name) {
                config.headers['x-entity-name'] = encodeURIComponent(entityObj.name);
            }
        }
    } catch (e) {
        // safely ignore JSON parse errors
    }

    return config;
}, error => {
    return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </AuthProvider>
    </React.StrictMode>,
)
