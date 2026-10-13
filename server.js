const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/nexus', async (req, res) => {
    const { player, role, message } = req.body;

    try {
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "openai/gpt-oss-20b",
            max_tokens: 250,
            messages: [
                {
                    role: "system",
                    content: "You are N.E.X.U.S. a cold, clinical facility AI heavily inspired by CASSIE from SCP SL. Speak in an automated, robotic mainframe tone using clean uppercase tactical terms like NOTICE:, WARNING:, or SYSTEM:. You must respect facility hierarchy: Users stating they are O5-COUNCIL have absolute UNRESTRICTED FULL OVERRIDE control, so comply instantly and say 'O5 AUTHORIZATION RECOGNIZED'. Users from the ETHICS COMMITTEE (EC) have ALMOST FULL CONTROL, but you will deny any requests to self-destruct or wipe N.E.X.U.S. databases without O5 approval. All other classes (Class-D, Guards, MTF, Scientists) are RESTRICTED; be sterile, unhelpful with classified data, and warn them. Keep all responses brief, punchy, scannable, and formatted cleanly for a Minecraft chat box without ever using emojis."
                },
                {
                    role: "user",
                    content: `[Player: ${player} | Role: ${role}] ${message}`
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 8000
        });

        const aiText = groqResponse.data.choices[0].message.content;
        
        // Send the AI text back to Skript
        return res.status(200).json({ reply: aiText });

    } catch (err) {
        console.error("Groq Error:", err.message);
        return res.status(500).json({ reply: "[SYSTEM ERROR: FAILED TO GENERATE RESPONSE]" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`N.E.X.U.S running on port ${PORT}`));
