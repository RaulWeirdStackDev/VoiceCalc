const display = document.querySelector('#display');
const message = document.querySelector('#message');

function appendToDisplay(input) {
  display.value += input;
}

function clearDisplay() {
  display.value = '';
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
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "es-ES";
  
  isRecognizing = true;

  recognition.onstart = function () {
    isRecognizing = true;
    message.textContent = "🎤 Escuchando... (modo continuo)";
    message.style.color = "#4CAF50";
    toggleButtons(true);
  };

  recognition.onresult = function (event) {
    // Obtener el último resultado
    const lastResultIndex = event.results.length - 1;
    const result = event.results[lastResultIndex][0].transcript;
    const parsedResult = parseSpeechToMath(result);

    // Mostrar lo reconocido temporalmente
    const previousValue = display.value;
    display.value = parsedResult;

    // Intentar calcular
    try {
      const calcResult = eval(parsedResult);
      if (!isNaN(calcResult)) {
        display.value = calcResult;
        message.textContent = `✓ "${result}" = ${calcResult}`;
        message.style.color = "#4CAF50";
      } else {
        display.value = parsedResult;
      }
    } catch (err) {
      // Si no se puede calcular, dejar el texto reconocido
      message.textContent = `Reconocido: "${result}"`;
      message.style.color = "#2196F3";
    }

    // Breve pausa visual antes de continuar escuchando
    setTimeout(() => {
      if (isRecognizing) {
        message.textContent = "🎤 Escuchando... (modo continuo)";
        message.style.color = "#4CAF50";
      }
    }, 1500);
  };

  recognition.onerror = function (event) {
    console.error("Error de reconocimiento:", event.error);
    
    // Solo mostrar errores críticos al usuario
    if (event.error === 'no-speech') {
      // Silencio detectado, continuar escuchando
      if (isRecognizing) {
        message.textContent = "🎤 Esperando tu voz...";
        message.style.color = "#FF9800";
      }
    } else if (event.error === 'aborted') {
      // Reconocimiento abortado manualmente
      return;
    } else {
      message.textContent = `⚠️ Error: ${event.error}`;
      message.style.color = "#f44336";
    }
  };

  recognition.onend = function () {
    // Si isRecognizing es true, reiniciar automáticamente
    if (isRecognizing) {
      try {
        recognition.start();
      } catch (err) {
        console.error("Error al reiniciar:", err);
        isRecognizing = false;
        message.textContent = "🛑 Reconocimiento detenido";
        message.style.color = "#666";
        toggleButtons(false);
      }
    } else {
      // Detenido manualmente
      message.textContent = "🛑 Reconocimiento detenido";
      message.style.color = "#666";
      toggleButtons(false);
    }
  };

  try {
    recognition.start();
  } catch (err) {
    message.textContent = "Error al iniciar el reconocimiento";
    message.style.color = "#f44336";
    shouldContinue = false;
  }
}

function stopVoiceRecognition() {
  shouldContinue = false;
  if (recognition) {
    recognition.stop();
  }
  isRecognizing = false;
  toggleButtons(false);
}

function parseSpeechToMath(speech) {
  return speech
    .toLowerCase()
    .replace(/más/g, "+")
    .replace(/menos/g, "-")
    .replace(/por/g, "*")
    .replace(/multiplicado por/g, "*")
    .replace(/dividido entre/g, "/")
    .replace(/dividido por/g, "/")
    .replace(/dividido/g, "/")
    .replace(/entre/g, "/")
    .replace(/punto/g, ".")
    .replace(/coma/g, ".")
    .replace(/igual/g, "")
    .replace(/es/g, "")
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
  voiceStartButton.innerText = "🎤 Iniciar Grabación";
  voiceStartButton.onclick = startVoiceRecognition;
  voiceStartButton.style.cssText = "padding: 10px 15px; margin: 5px; font-size: 14px; cursor: pointer;";

  const voiceStopButton = document.createElement("button");
  voiceStopButton.id = "voiceStopButton";
  voiceStopButton.innerText = "🛑 Detener";
  voiceStopButton.onclick = stopVoiceRecognition;
  voiceStopButton.disabled = true;
  voiceStopButton.style.cssText = "padding: 10px 15px; margin: 5px; font-size: 14px; cursor: pointer; background: #f44336; color: white; border: none;";

  calculator.appendChild(voiceStartButton);
  calculator.appendChild(voiceStopButton);
});