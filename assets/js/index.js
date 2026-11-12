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
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (!event.results[i].isFinal) continue;
      const result = event.results[i][0].transcript;
      const parsedResult = parseSpeechToMath(result);
      if (parsedResult === null) continue; // Ignorar conversaciones ajenas a la calculadora.

      const calcResult = evaluateMath(parsedResult);
      if (calcResult === null) continue;
      display.value = String(calcResult);
      message.textContent = `✓ "${result}" = ${calcResult}`;
      message.style.color = "#4CAF50";
    }
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
    isRecognizing = false;
  }
}

function stopVoiceRecognition() {
  isRecognizing = false;
  if (recognition) {
    recognition.stop();
  }
  isRecognizing = false;
  toggleButtons(false);
}

function parseSpeechToMath(speech) {
  // Aceptar únicamente expresiones compuestas de números y operadores conocidos.
  // No extraer números sueltos de una frase ajena al cálculo.
  const normalized = speech.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!]/g, " ")
    .trim();

  const tokens = normalized.match(/\d+(?:[.,]\d+)?|[+*/()=-]|[a-z]+/g);
  if (!tokens || !tokens.length) return null;

  const operators = { mas: "+", menos: "-", por: "*", entre: "/", punto: ".", coma: "." };
  const words = { cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4,
    cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
    dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
    veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50,
    sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
    cien: 100, ciento: 100, mil: 1000 };
  const ignored = new Set(["cuanto", "cuantos", "cuanta", "cuantas", "es", "son", "igual", "a", "calcula", "calcular"]);
  const converted = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (ignored.has(token)) continue;
    if (token === "multiplicado" || token === "dividido") {
      if (tokens[i + 1] === "por" || tokens[i + 1] === "entre") i++;
      converted.push(token === "multiplicado" ? "*" : "/");
    } else if (token in operators) converted.push(operators[token]);
    else if (token in words) {
      // Combinar decenas y unidades: treinta y dos -> 32.
      let value = words[token];
      if (value >= 20 && value <= 90 && value % 10 === 0 && tokens[i + 1] === "y" && tokens[i + 2] in words && words[tokens[i + 2]] < 10) {
        value += words[tokens[i + 2]];
        i += 2;
      }
      converted.push(String(value));
    } else if (/^\d+(?:[.,]\d+)?$/.test(token)) converted.push(token.replace(",", "."));
    else if (/^[+*/()=-]$/.test(token)) converted.push(token === "=" ? "" : token);
    else return null;
  }
  const expression = converted.join("");
  // Exigir una expresión completa, no una palabra aislada ni un operador.
  if (!/^-?\d+(?:\.\d+)?(?:[+*/-]-?\d+(?:\.\d+)?)+$/.test(expression)) return null;
  return expression;
}

function evaluateMath(expression) {
  if (!/^-?\d+(?:\.\d+)?(?:[+*/-]-?\d+(?:\.\d+)?)+$/.test(expression)) return null;
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    return Number.isFinite(result) ? result : null;
  } catch (_) {
    return null;
  }
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