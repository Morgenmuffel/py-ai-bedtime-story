import pyaudio
import wave
import requests
import os
from dotenv import load_dotenv

load_dotenv()
HUGGINGFACE_API_KEY = os.getenv("HUGGING_FACE_API_KEY_READ_ONLY")

def record_audio(output_filename="output.wav", record_seconds=5, sample_rate=16000):

    chunk = 1024  # Record in chunks of 1024 samples
    format = pyaudio.paInt16  # 16-bit resolution
    channels = 1  # Mono audio
    rate = sample_rate  # 16k sample rate
    record_seconds = record_seconds  # Duration to record in seconds
    output_filename = output_filename  # Output file name

    # Initialize PyAudio object
    p = pyaudio.PyAudio()

    # Open stream for recording
    stream = p.open(format=format, channels=channels, rate=rate, input=True, frames_per_buffer=chunk)
    print(f"Recording for {record_seconds} seconds...")
    frames = []

    # Record audio in chunks
    for _ in range(int(rate / chunk * record_seconds)):
        data = stream.read(chunk)
        frames.append(data)

    print("Recording complete.")

    # Stop and close the stream
    stream.stop_stream()
    stream.close()
    p.terminate()

    # Save the recorded audio as a .wav file
    wf = wave.open(output_filename, 'wb')
    wf.setnchannels(channels)
    wf.setsampwidth(p.get_sample_size(format))
    wf.setframerate(rate)
    wf.writeframes(b''.join(frames))
    wf.close()

    return output_filename


def transcribe_audio_with_huggingface(file_path, api_token=HUGGINGFACE_API_KEY,language="ru"):

    model = "openai/whisper-base"  # You can use other model sizes like "tiny", "medium", etc.

    # Hugging Face API URL
    api_url = f"https://api-inference.huggingface.co/models/{model}"

    # Read audio file in binary mode
    with open(file_path, 'rb') as audio_file:
        audio_data = audio_file.read()
        headers = {
        "Authorization": f"Bearer {api_token}"
        }
    # Add the "language" option to the payload
    payload = {
        "inputs": audio_data,
        "options": {
            "language": language  # Set the language code to 'ru' for Russian
        }
    }

    # Send the POST request to Hugging Face's API with payload as JSON
    response = requests.post(api_url, headers=headers, json=payload)

    if response.status_code == 200:
        transcription = response.json()
        return transcription['text']
    else:
        raise Exception(f"Request failed with status code {response.status_code}: {response.text}")
