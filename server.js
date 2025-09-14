/**
 * Simple HTTP server to serve Championship Data Stories
 * Serves the HTML interface and connects to the API
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));
app.use('/data-stories', express.static(path.join(__dirname, 'data-stories')));

// Main route - serve the championship case studies
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'data-stories', 'championship-case-studies.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Championship Data Stories Web Server',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.listen(PORT, () => {
    console.log('🏆 Championship Data Stories Web Server');
    console.log('=====================================');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📊 Case Studies: http://localhost:${PORT}/`);
    console.log(`🔗 API Server: http://localhost:3005`);
    console.log('');
    console.log('🎯 Championship platform is LIVE!');
    console.log('Open http://localhost:3000 in your browser to see the data stories.');
});

export default app;