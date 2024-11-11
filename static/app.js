const record = document.querySelector(".record");
const output = document.querySelector(".prompt");
const transcriptionBox = document.getElementById("transcription");
const fairytaleBox = document.getElementById("fairytale");
const generateButton = document.getElementById("generateButton");
const voiceOverButton = document.getElementById("voiceOverButton");
const loadingIndicator = document.getElementById("loading");
const screens = Array.from(document.getElementsByClassName("screen"));
let currentScreen = 0;
let generatedFairytale = "";

// Function to transition to the next screen with parallax effect
function showScreen(index) {
  screens.forEach((screen, i) => {
    screen.style.transform = `translateY(${(i - index) * 100}vh)`;
  });
  currentScreen = index;
}

if (navigator.mediaDevices.getUserMedia) {

    let onMediaSetupSuccess = function (stream) {
        const mediaRecorder = new MediaRecorder(stream);
        let chunks = [];

        record.onclick = function() {
            if (mediaRecorder.state == "recording") {
                mediaRecorder.stop();
                record.classList.remove("btn-danger");
                record.classList.add("btn-primary");
            } else {
                mediaRecorder.start();
                record.classList.remove("btn-primary");
                record.classList.add("btn-danger");
            }
        }

        mediaRecorder.ondataavailable = function (e) {
            chunks.push(e.data);
        }

        mediaRecorder.onstop = function () {

            let blob = new Blob(chunks, {type: "audio/webm"});
            chunks = [];

            let formData = new FormData();
            formData.append("audio", blob);

            fetch("/transcribe", {
                method: "POST",
                body: formData
            }).then((response) => response.json())
            .then((data) => {
                transcriptionBox.textContent = data.transcription;
                showScreen(1);  // Move to transcription confirmation screen
            })
        }
    }

    let onMediaSetupFailure = function(err) {
        alert(err);
    }

    navigator.mediaDevices.getUserMedia({ audio: true}).then(onMediaSetupSuccess, onMediaSetupFailure);

} else {
    alert("getUserMedia is not supported in your browser!")
}


// Function to generate a fairytale based on the transcribed prompt
async function generateFairytale() {
  const transcription = transcriptionBox.textContent;
  if (!transcription) {
    alert("No transcription available to generate a story!");
    return;
  }

  // Display loading animation
  loadingIndicator.style.display = "block";
  fairytaleBox.style.display = "none";

  const response = await fetch('/generate-fairytale', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userprompt: transcription }),
  })

  const data = await response.json()
  if (data.error) {
    document.getElementById('fairytale').textContent = 'Error generating fairytale: ' + data.error
  } else {
    loadingIndicator.style.display = "none";  // Hide loading animation
    fairytaleBox.style.display = "block";     // Show generated story
    generatedFairytale = data.fairytale;
    fairytaleBox.textContent = data.fairytale;
    showScreen(2);  // Move to generated fairytale screen
  }
}


// Function to generate a voice-over for the generated fairytale
function voiceOverFairytale() {
  if (!generatedFairytale) {
    alert("No fairytale available for voice-over!");
    return;
  }

  fetch('/voice-over', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fairytale: generatedFairytale })
  })
  .then(response => response.json())
  .then(data => {
    if (data.audioUrl) {
      const audioPlayer = document.getElementById("audioPlayer");
      audioPlayer.src = data.audioUrl;
      showScreen(3);  // Move to voice-over playback screen
      audioPlayer.play();
    }
  });
}

async function voiceOverFairytale() {
  if (!generatedFairytale) {
    alert('No fairytale to voice over!')
    return
  }

  loadingIndicator.textContent = "Generating voiceover..."; // Update loading text for voiceover
  loadingIndicator.style.display = "block"; // Show loading animation for voice-over

  const response = await fetch('/voice-over', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fairytale: generatedFairytale }),
  })

  const data = await response.json()
  if (data.audioUrl) {
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = data.audioUrl;
    showScreen(3);  // Move to voice-over playback screen
    audioPlayer.play();
  }
}

// Initialize by showing the first screen
showScreen(0);
