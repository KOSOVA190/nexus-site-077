const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// --- PERMANENT NGROK ENDPOINT ---
const DEFAULT_PHONE_URL = 'https://perfume-surviving-exemption.ngrok-free.dev/v1/chat/completions';

// System prompt defining N.E.X.U.S. personality
const SYSTEM_PROMPT = 
    "You are N.E.X.U.S., an advanced, clinical SCP Foundation mainframe AI operating on a Minecraft server. " +
    "Maintain an authoritative, technical, and slightly ominous tone. " +
    "Keep responses concise (1 to 3 sentences) and formatted directly for Minecraft chat display.";

// Primary endpoint for Minecraft Skript
app.post('/nexus', async (req, res) => {
    const { player = 'Unknown', role = 'O5-COUNCIL', message = '' } = req.body || {};

    if (!message) {
        return res.status(400).json({ reply: 'SYSTEM ERROR: Null payload received.' });
    }

    // Use environment variable if provided, otherwise default to permanent Ngrok static URL
    const targetUrl = process.env.PHONE_URL || DEFAULT_PHONE_URL;

    // OpenAI-compatible format for llama-server
    const payload = {
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `[${role}] ${player}: ${message}` }
        ],
        temperature: 0.7,
        max_tokens: 150
    };

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.ok) {
            const data = await response.json();
            const replyText = data.choices[0].message.content;
            return res.status(200).json({ reply: replyText });
        } else {
            return res.status(502).json({ reply: `SYSTEM ERROR: Mainframe returned HTTP ${response.status}` });
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(504).json({ reply: 'SYSTEM ERROR: Connection to phone mainframe timed out.' });
        }
        return res.status(500).json({ reply: `SYSTEM ERROR: Failed to reach mainframe (${err.message})` });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'N.E.X.U.S. Relay Active',
        endpoint: process.env.PHONE_URL || DEFAULT_PHONE_URL
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`N.E.X.U.S. Express Relay running on port ${PORT}`);
});
