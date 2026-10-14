import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- PERMANENT NGROK ENDPOINT ---
DEFAULT_PHONE_URL = "https://perfume-surviving-exemption.ngrok-free.dev/v1/chat/completions"

# System prompt defining N.E.X.U.S. personality
SYSTEM_PROMPT = (
    "You are N.E.X.U.S., an advanced, clinical SCP Foundation mainframe AI operating on a Minecraft server. "
    "Maintain an authoritative, technical, and slightly ominous tone. "
    "Keep responses concise (1 to 3 sentences) and formatted directly for Minecraft chat display."
)

@app.route("/nexus", methods=["POST"])
def nexus_relay():
    data = request.get_json(silent=True) or {}
    
    player = data.get("player", "Unknown")
    role = data.get("role", "O5-COUNCIL")
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"reply": "SYSTEM ERROR: Null payload received."}), 400

    # Get phone URL from Environment variable, or fallback to your permanent Ngrok static URL
    phone_url = os.getenv("PHONE_URL", DEFAULT_PHONE_URL)

    # Format OpenAI-compatible payload for llama-server
    payload = {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"[{role}] {player}: {user_message}"}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }

    try:
        # Forward request to your phone running llama-server via Ngrok
        response = requests.post(phone_url, json=payload, timeout=30)
        
        if response.status_code == 200:
            res_json = response.json()
            reply_text = res_json["choices"][0]["message"]["content"]
            return jsonify({"reply": reply_text}), 200
        else:
            return jsonify({"reply": f"SYSTEM ERROR: Mainframe returned HTTP {response.status_code}"}), 502

    except requests.exceptions.Timeout:
        return jsonify({"reply": "SYSTEM ERROR: Connection to phone mainframe timed out."}), 504
    except Exception as e:
        return jsonify({"reply": f"SYSTEM ERROR: Failed to reach mainframe ({str(e)})"}), 500


@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "N.E.X.U.S. Relay Active", "endpoint": DEFAULT_PHONE_URL}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
