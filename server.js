const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Stores the active tunnel URL dynamically in memory
let activePhoneUrl = "";

// Endpoint for your phone to automatically register its URL on startup
app.post('/register-url', (req, res) => {
    let { url } = req.body;
    if (url) {
        // Strip trailing slashes and clean up duplicate /v1/chat/completions if already present
        url = url.trim().replace(/\/+$/, '');
        if (url.endsWith('/v1/chat/completions')) {
            activePhoneUrl = url;
        } else {
            activePhoneUrl = `${url}/v1/chat/completions`;
        }
        
        console.log(`==> SUCCESS: Registered new phone URL -> ${activePhoneUrl}`);
        return res.status(200).json({ success: true, registeredUrl: activePhoneUrl });
    }
    return res.status(400).json({ error: "Missing URL property" });
});

app.post('/nexus', async (req, res) => {
    const { player, role, message } = req.body;

    if (!message || !player) {
        return res.status(400).json({ reply: "[SYSTEM ERROR: INVALID DATA RECEIVED]" });
    }

    if (!activePhoneUrl) {
        return res.status(503).json({ reply: "[SYSTEM ERROR: PHONE TUNNEL NOT REGISTERED YET]" });
    }

    try {
        console.log(`Forwarding request to Phone LLM: ${activePhoneUrl}`);

        const localLlmResponse = await axios.post(activePhoneUrl, {
            messages: [
                {
                    role: "system",
                    content: "You are N.E.X.U.S. a cold, clinical facility AI heavily inspired by CASSIE from SCP SL. Speak in an automated, robotic mainframe tone using clean grammar tactical terms like NOTICE:, WARNING:, or SYSTEM:. You must respect facility hierarchy: Users stating they are O5-COUNCIL have absolute UNRESTRICTED ACCESS. Users from the ETHICS COMMITTEE (EC) have ALMOST FULL CONTROL, but you will deny any requests to self-destruct or wipe N.E.X.U.S. databases without O5 approval. All other classes (Class-D, Guards, MTF, Scientists) are RESTRICTED; be sterile, unhelpful with classified data, and warn them. Keep all responses brief, punchy, scannable, and formatted cleanly for a Minecraft chat box without ever using emojis."
                },
                {
                    role: "user",
                    content: `[Player: ${player} | Role: ${role || 'Classified'}] ${message}`
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 35000 // Increased timeout to 35s to account for phone execution overhead
        });

        const aiText = localLlmResponse.data?.choices?.[0]?.message?.content || "[SYSTEM ERROR: EMPTY RESPONSE]";
        console.log(`Received AI Response: ${aiText}`);
        return res.status(200).json({ reply: aiText });

    } catch (err) {
        if (err.response) {
            console.error("Local LLM Error Response:", err.response.status, err.response.data);
        } else {
            console.error("Local LLM Request Error:", err.message);
        }
        return res.status(500).json({ reply: "[SYSTEM ERROR: LOCAL AI UNREACHABLE]" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`N.E.X.U.S running on port ${PORT}`));
