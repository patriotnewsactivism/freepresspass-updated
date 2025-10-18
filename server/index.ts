import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve env config with injected environment variables
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    window.SUPABASE_URL = "${process.env.SUPABASE_URL || ''}";
    window.SUPABASE_ANON_KEY = "${process.env.SUPABASE_ANON_KEY || ''}";
  `);
});

app.use(express.static('.'));

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
