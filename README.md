## Bedtime Story Generation and Voice Over Application

This is a Flask (Python) based web application that generates a bedtime story for my 2 years old son, based on voice instructions about the content/title of the story.
It uses OpenAI whisperer and gpt-4o-mini model to transcribe the prompt and to generate the story, and performs a voice-over of the generated poem using ElevenLabs' text-to-speech API.
The story is generated in the language of the prompt, the voice over is performed by a calming female voice, and the story always ends with everyone getting tired and going to bed! :)

### Requirements:

    Python 3.11.5

### Installation

- Clone the repository:

```
git clone https://github.com/Morgenmuffel/py-ai-bedtime-story.git
```

- Go to the project directory

- Create and activate a virtual environment:

```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

- Install required dependencies:

```
pip install -r requirements.txt
```

Create a .env file and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY = your_elevenlabs_api_key
```

- Go to [elevenlabs voice lab](https://elevenlabs.io/app/voice-lab), upload sylviaplath.mp3 (or any other audio file of your choice) and obtain VOICE_ID. Replace the VOICE_ID in app.py with the one you obtained.
- Run the application:

```
python app.py
```
# py-ai-bedtime-story
