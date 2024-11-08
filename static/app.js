const record = document.querySelector(".record");
const output = document.querySelector(".prompt");

document.addEventListener('DOMContentLoaded', async () => {
  try {
      const response = await fetch('/get_transcription');
      const data = await response.json();
      document.getElementById('transcription').textContent = data.transcription;
  } catch (error) {
      console.error("Error fetching transcription:", error);
  }
});

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
            alert("Recording stopped");
            let blob = new Blob(chunks, {type: "audio/webm"});
            chunks = [];

            let formData = new FormData();
            formData.append("audio", blob);

            fetch("/transcribe", {
                method: "POST",
                body: formData
            }).then((response) => response.json())
            .then((data) => {
                output.innerHTML = data.output;
                document.getElementById('generateButton').style.display = 'inline'
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


let generatedFairytale = ''

async function generateFairytale() {
  const transcription = document.getElementById('transcription').textContent
  alert(transcription)
  if (!transcription) {
    alert('No transcription provided!')
    return
  }

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
    generatedFairytale = data.fairytale
    document.getElementById('fairytale').textContent = data.fairytale
    document.getElementById('voiceOverButton').style.display = 'inline'
  }
}

async function voiceOverFairytale() {
  if (!generatedFairytale) {
    alert('No fairytale to voice over!')
    return
  }

  const response = await fetch('/voice-over', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fairytale: generatedFairytale }),
  })

  const data = await response.json()
  if (data.audioUrl) {
    const audioPlayer = document.createElement('audio')
    audioPlayer.src = data.audioUrl
    audioPlayer.controls = true
    document.body.appendChild(audioPlayer)
    audioPlayer.play()
  }
}
