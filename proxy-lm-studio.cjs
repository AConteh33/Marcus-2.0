const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const LM_STUDIO_URL = 'http://localhost:1234';

// Proxy all requests to LM Studio
app.use('/api/lm-studio', async (req, res) => {
    try {
        const lmStudioPath = req.path.replace('/api/lm-studio', '');
        const targetUrl = `${LM_STUDIO_URL}${lmStudioPath}`;
        
        console.log(`Proxying ${req.method} ${req.path} to ${targetUrl}`);
        
        // Prepare headers for LM Studio
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        // Copy relevant headers from original request
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }
        
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`LM Studio error: ${response.status} ${errorText}`);
            return res.status(response.status).json({ 
                error: `LM Studio error: ${response.status}`,
                details: errorText
            });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy failed', message: error.message });
    }
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`LM Studio proxy running on http://localhost:${PORT}`);
});
