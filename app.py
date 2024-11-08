from flask import Flask, request, jsonify, render_template, requests
import os
import io
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "OOTZSkkPGHD1csczSCmT"
# or use premade voices in elevenlabs like CwhRBWXzGAHq8TQ4Fs17

app = Flask(__name__)

client = OpenAI()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/transcribe", methods=["POST"])
def transcribe():
    file = request.files["audio"]
    buffer = io.BytesIO(file.read())
    buffer.name = "audio.webm"

    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=buffer,
        language="ru"
    )

    return {"output": transcript.text}

@app.route("/generate-fairytale", methods=["POST"])
def generate_fairytale():
    data = request.json
    transcription = data.get("transcription")

    if not transcription or len(transcription) < 3:
        return jsonify({"error": "Please provide prompt"}), 400

    prompt = f"Write a bed-time story in Russian that fits 2.5 years old about: {transcription}. \
                The story should be 8-10 short sentences long and end with everybody get tired and going to bed."

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,
            },
        )

        response_data = response.json()
        if "choices" in response_data and len(response_data["choices"]) > 0:
            fairytale = response_data["choices"][0]["message"]["content"].strip()
            return jsonify({"fairytale": fairytale})
        else:
            return jsonify({"error": "Invalid response from OpenAI API."}), 500

    except Exception as e:
        print(f"Error generating fairytale: {e}")
        return jsonify({"error": "Failed to generate fairytale."}), 500


@app.route("/voice-over", methods=["POST"])
def voice_over():
    data = request.json
    fairytale = data.get("fairytale")

    if not fairytale:
        return jsonify({"error": "No fairytale provided."}), 400

    try:
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": fairytale,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,  # Adjusted style for a warmer, motherly tone
                    #"use_speaker_boost": True
                },
            },
            stream=True,
        )

        if response.status_code != 200:
            return (
                jsonify({"error": f"ElevenLabs API error: {response.text}"}),
                response.status_code,
            )

        file_path = "./static/generated_audio.mp3"
        with open(file_path, "wb") as audio_file:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    audio_file.write(chunk)

        return jsonify({"audioUrl": "/static/generated_audio.mp3"})

    except Exception as e:
        print(f"Error generating voice-over: {e}")
        return jsonify({"error": "Failed to generate voice-over."}), 500


if __name__ == "__main__":
    app.run(port=3000)
