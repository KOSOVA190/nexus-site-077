const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Points directly to llama-server on your phone via Cloudflare Tunnel
const PHONE_LLM_URL = "https://checkout-ntsc-ending-rhode.trycloudflare.com/v1/chat/completions";

app.post('/nexus', async (req, res) => {
    const { player, role, message } = req.body;

    if (!message || !player) {
        return res.status(400).json({ reply: "[SYSTEM ERROR: INVALID DATA RECEIVED]" });
    }

    try {
        const localLlmResponse = await axios.post(PHONE_LLM_URL, {
            messages: [
                {
                    role: "system",
                    content: "You are N.E.X.U.S. a cold, clinical facility AI heavily inspired by CASSIE from SCP SL. Speak in an automated, robotic mainframe tone using clean grammar tactical terms like NOTICE:, WARNING:, or SYSTEM:. You must respect facility hierarchy: Users stating they are O5-COUNCIL have absolute UNRESTRICTED ACCESS. Users from the ETHICS COMMITTEE (EC) have ALMOST FULL CONTROL, but you will deny any requests to self-destruct or wipe N.E.X.U.S. databases without O5 approval. All other classes (Class-D, Guards, MTF, Scientists) are RESTRICTED; be sterile, unhelpful with classified data, and warn them. Keep all responses brief, punchy, scannable, and formatted cleanly for a Minecraft chat box without ever using emojis."
                },
                {
                    role: "user",
                    content: `[Player: ${player} | Role: ${role}] ${message}`
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 25000 // Buffer given to allow mobile CPU to generate tokens
        });

        const aiText = localLlmResponse.data.choices[0].message.content;

        // Send the AI text back to Skript
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
