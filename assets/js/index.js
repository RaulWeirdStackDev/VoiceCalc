const display = document.querySelector('#display');

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
  if (!('webkitSpeechRecognition' in window)) {
    alert("Tu navegador no soporta reconocimiento de voz.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true; 
  recognition.interimResults = false;
  recognition.lang = "es-ES";

  recognition.onstart = function () {
    isRecognizing = true;
    display.value = "Escuchando...";
    toggleButtons(true); 
  };

  recognition.onresult = function (event) {
    const result = event.results[event.results.length - 1][0].transcript; 
    const parsedResult = parseSpeechToMath(result);
    
  
    display.value = parsedResult;


    try {
      const calcResult = eval(parsedResult);
      if (!isNaN(calcResult)) {
        display.value = calcResult;
      }
    } catch (err) {
      // Si hay error, no hacemos nada, dejamos el texto como está
    }
  };

  recognition.onerror = function (event) {
    display.value = "Error al reconocer la voz: " + event.error;
  };

  recognition.onend = function () {
    if (isRecognizing) {
      recognition.start(); // Reiniciar si sigue activo
    } else {
      display.value = "Reconocimiento detenido";
      toggleButtons(false); // Actualizar botones
    }
  };

  recognition.start();
}

// ---- Detener reconocimiento de voz ----
function stopVoiceRecognition() {
  if (isRecognizing && recognition) {
    isRecognizing = false;
    recognition.stop();
  }
}

// ---- Convertir palabras habladas a operadores matemáticos ----
function parseSpeechToMath(speech) {
  return speech
    .toLowerCase()
    .replace(/más/g, "+")
    .replace(/menos/g, "-")
    .replace(/por/g, "*")
    .replace(/dividido/g, "/")
    .replace(/punto/g, ".")
    .replace(/\s/g, ""); // Eliminar espacios
}

// ---- Alternar botones de iniciar/detener ----
function toggleButtons(isActive) {
  const startButton = document.querySelector("#voiceStartButton");
  const stopButton = document.querySelector("#voiceStopButton");
  startButton.disabled = isActive;
  stopButton.disabled = !isActive;
}

// ---- Agregar botones para iniciar y detener el reconocimiento de voz ----
document.addEventListener("DOMContentLoaded", () => {
  const calculator = document.getElementById("calculator");

  // Botón para iniciar
  const voiceStartButton = document.createElement("button");
  voiceStartButton.id = "voiceStartButton";
  voiceStartButton.innerText = "🎤 Grabar";
  voiceStartButton.onclick = startVoiceRecognition;

  // Botón para detener
  const voiceStopButton = document.createElement("button");
  voiceStopButton.id = "voiceStopButton";
  voiceStopButton.innerText = "🛑 Detener";
  voiceStopButton.onclick = stopVoiceRecognition;
  voiceStopButton.disabled = true; // Deshabilitado inicialmente

  calculator.appendChild(voiceStartButton);
  calculator.appendChild(voiceStopButton);
});