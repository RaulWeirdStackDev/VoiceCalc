const display = document.querySelector('#display');
const message = document.querySelector('#message');

function appendToDisplay(input) {
  display.value += input;  // corregido: actúa sobre display
}

function clearDisplay() {
  display.value = '';      // corregido: limpia display
}

function calculate() {
  try {
    display.value = eval(display.value);
  } catch (err) {
    display.value = "Error";
  }
}

let isRecognizing = false;
let recognition;

function startVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Tu navegador no soporta reconocimiento de voz.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "es-ES";

  recognition.onstart = function () {
    isRecognizing = true;
    message.textContent = "Escuchando...";
    toggleButtons(true);
  };

  recognition.onresult = function (event) {
    const result = event.results[0][0].transcript;
    const parsedResult = parseSpeechToMath(result);

    display.value = parsedResult;

    try {
      const calcResult = eval(parsedResult);
      if (!isNaN(calcResult)) {
        display.value = calcResult;
      }
    } catch (err) {
      // dejamos el texto reconocido si eval falla
    }

    message.textContent = ""; // limpio mensaje al obtener resultado
  };

  recognition.onerror = function (event) {
    message.textContent = "Error al reconocer la voz: " + event.error;
  };

  recognition.onend = function () {
    if (isRecognizing) {
      message.textContent = "Reconocimiento finalizado.";
      toggleButtons(false);
      isRecognizing = false;
    }
  };

  recognition.start();
}

function stopVoiceRecognition() {
  if (isRecognizing && recognition) {
    isRecognizing = false;
    recognition.stop();
  }
}

function parseSpeechToMath(speech) {
  return speech
    .toLowerCase()
    .replace(/más/g, "+")
    .replace(/menos/g, "-")
    .replace(/por/g, "*")
    .replace(/dividido/g, "/")
    .replace(/punto/g, ".")
    .replace(/\s/g, "");
}

function toggleButtons(isActive) {
  const startButton = document.querySelector("#voiceStartButton");
  const stopButton = document.querySelector("#voiceStopButton");
  startButton.disabled = isActive;
  stopButton.disabled = !isActive;
}

document.addEventListener("DOMContentLoaded", () => {
  const calculator = document.getElementById("calculator");

  const voiceStartButton = document.createElement("button");
  voiceStartButton.id = "voiceStartButton";
  voiceStartButton.innerText = "🎤 Grabar";
  voiceStartButton.onclick = startVoiceRecognition;

  const voiceStopButton = document.createElement("button");
  voiceStopButton.id = "voiceStopButton";
  voiceStopButton.innerText = "🛑 Detener";
  voiceStopButton.onclick = stopVoiceRecognition;
  voiceStopButton.disabled = true;

  calculator.appendChild(voiceStartButton);
  calculator.appendChild(voiceStopButton);
});
