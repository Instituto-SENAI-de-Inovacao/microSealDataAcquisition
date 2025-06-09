(function() {
  "use strict";

  // Função para perguntar se deseja gravar os logs desde o início
  var loggingEnabled = false;
  if (confirm("Deseja gravar todos os logs desde o início?")) {
    loggingEnabled = true;
    const messagesContainer = document.getElementById("messages");
    if (messagesContainer) {
      messagesContainer.innerHTML += "<div>Gravação de logs ativada.</div>";
    }
  }

  // Função para obter timestamp local formatado
  function getLocalTimestamp() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, -1);
    return localISOTime.replace('T', ' ').replace(/\.\d+/, '');
  }

  // Evento para solicitar confirmação ao encerrar o programa
  window.addEventListener("beforeunload", function(e) {
    var confirmationMessage = "Deseja realmente encerrar o programa?\nOs logs não exportados serão perdidos.";
    e.returnValue = confirmationMessage;
    return confirmationMessage;
  });

  //////////// Variáveis Globais e Configurações ////////////
  let sessionStart = Date.now();
  let sessionTime = 0;
  const MAX_RETRIES = 2;
  let modbusTimeout = 50;

  // Criação do Horímetro
  const horimetroDisplay = document.createElement("div");
  horimetroDisplay.id = "horimetro";
  horimetroDisplay.style.position = "fixed";
  horimetroDisplay.style.bottom = "10px";
  horimetroDisplay.style.left = "10px";
  horimetroDisplay.style.padding = "5px 10px";
  horimetroDisplay.style.backgroundColor = "#fff";
  horimetroDisplay.style.border = "1px solid #ccc";
  horimetroDisplay.style.zIndex = "10000";
  document.body.appendChild(horimetroDisplay);

  function formatTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    let minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  setInterval(() => {
    sessionTime = Date.now() - sessionStart;
    horimetroDisplay.textContent = "Horímetro: " + formatTime(sessionTime);
  }, 1000);

  //////////// Funções Wake Lock ////////////
  let wakeLock = null;
  async function requestWakeLock() {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        console.log("Wake Lock foi liberado.");
      });
      console.log("Wake Lock ativo.");
    } catch (err) {
      console.error(`Erro ao solicitar Wake Lock: ${err.name}, ${err.message}`);
    }
  }

  async function releaseWakeLock() {
    if (wakeLock !== null) {
      await wakeLock.release();
      wakeLock = null;
      console.log("Wake Lock liberado manualmente.");
    }
  }

  //////////// Classe Mutex para acesso exclusivo à porta serial ////////////
  class Mutex {
    constructor() {
      this._locked = false;
      this._queue = [];
    }
    lock() {
      const unlock = () => {
        if (this._queue.length > 0) {
          const nextResolve = this._queue.shift();
          nextResolve(unlock);
        } else {
          this._locked = false;
        }
      };
      if (this._locked) {
        return new Promise(resolve => {
          this._queue.push(resolve);
        });
      } else {
        this._locked = true;
        return Promise.resolve(unlock);
      }
    }
  }
  const portMutex = new Mutex();

  //////////// Constantes e Funções de Conversão para Sensores ////////////
  const PRESSURE_CONVERSION_FACTORS = { 1: 40.0, 2: 40.0 };
  const DISTANCE_CONVERSION_FACTOR = 30.0;
  const PRESSURE_CORRECTION_VALUES = { 1: 0.0, 2: 6.0 };
  const DISTANCE_CORRECTION_VALUE = 0.0;

  function convertPressure(deviceId, voltage) {
    const factor = PRESSURE_CONVERSION_FACTORS[deviceId] || 1.0;
    const correction = PRESSURE_CORRECTION_VALUES[deviceId] || 0.0;
    return (voltage * factor) - correction;
  }

  function convertDistance(voltage) {
    return (voltage * DISTANCE_CONVERSION_FACTOR) - DISTANCE_CORRECTION_VALUE;
  }

  //////////// Variáveis Globais da Porta e de Comunicação ////////////
  let port;
  let currentBaudRate = null;
  let deviceIds = [];
  let isRunning = false;
  let debugBuffer = [];
  let isRecording = false;
  let recordedData = [];
  let deviceHistory = {};
  let communicationLog = [];
  let mainChart;
  let tempChart;
  let humidityChart;
  let dewPointChart;
  let deviceDatasetIndex = {};
  let lastUnifiedValues = {};

  // Variável global para armazenar o reader ativo
  let activeReader = null;
  let portOpen = false;

  //////////// Elementos DOM ////////////
  const connectButton = document.getElementById("connect");
  const btnToggleAcquisition = document.getElementById("btnToggleAcquisition");
  const sendRequestButton = document.getElementById("sendRequest");
  const toggleRecordingButton = document.getElementById("toggleRecording");
  const recordingIndicator = document.getElementById("recording-indicator");
  const exportDataButton = document.getElementById("exportData");
  const clearDataButton = document.getElementById("clearData");
  const exportLogButton = document.getElementById("exportLog");
  const showHistoryButton = document.getElementById("showHistory");
  const exportHistoryButton = document.getElementById("exportHistory");
  const btnChangeBg = document.getElementById("btnChangeBg");
  const updateIntervalSelect = document.getElementById("updateInterval");
  const manualBaudRateSelect = document.getElementById("manualBaudRate");
  const manualParitySelect = document.getElementById("manualParity");
  const manualStopBitsSelect = document.getElementById("manualStopBits");
  const applyManualParamsButton = document.getElementById("applyManualParams");
  const messagesContainer = document.getElementById("messages");
  const debugDiv = document.getElementById("debug");
  const historyWindowInput = document.getElementById("historyWindow");
  const yAmplitudeInput = document.getElementById("yAmplitude");
  const exitProgramButton = document.getElementById("exitProgram");

  // Força o intervalo de atualização para 50 ms (20 amostras/s)
  updateIntervalSelect.value = "50";

  //////////// Função de Gravação de Logs (apenas se ativado) ////////////
  function addToCommunicationLog(direction, message) {
    if (!loggingEnabled) return;
    const timestamp = new Date().toISOString();
    communicationLog.push({ timestamp, direction, message });
  }

  function logDebug(message) {
    const time = new Date().toLocaleTimeString();
    debugBuffer.push(`[${time}] ${message}`);
    if (debugBuffer.length > 100) {
      debugBuffer.shift();
    }
    debugDiv.innerHTML = debugBuffer.join("<br>");
    debugDiv.scrollTop = debugDiv.scrollHeight;
    addToCommunicationLog("DEBUG", message);
  }

  //////////// Funções para manipulação da porta, gráficos e dados ////////////

  function setPortBaudRate(newBaudRate, parity = "none", stopBits = 1) {
    if (!port || !portOpen) {
      logDebug("A porta já está fechada ou não existe.");
      return;
    }
  }

  function calculateCRC(buffer) {
    let crc = 0xFFFF;
    for (let pos = 0; pos < buffer.length; pos++) {
      crc ^= buffer[pos];
      for (let i = 0; i < 8; i++) {
        crc = (crc & 0x0001) ? (crc >> 1) ^ 0xA001 : crc >> 1;
      }
    }
    return crc;
  }

  function bytesToHexString(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join(" ");
  }

  function buildReadRegistersFrame(deviceId, startAddress, quantity) {
    const frame = new Uint8Array(6);
    frame[0] = deviceId;
    frame[1] = 3;
    frame[2] = (startAddress >> 8) & 0xff;
    frame[3] = startAddress & 0xff;
    frame[4] = (quantity >> 8) & 0xff;
    frame[5] = quantity & 0xff;
    const crc = calculateCRC(frame);
    const fullFrame = new Uint8Array(8);
    fullFrame.set(frame, 0);
    fullFrame[6] = crc & 0xff;
    fullFrame[7] = (crc >> 8) & 0xff;
    return fullFrame;
  }

  function parseRegisterValue(highByte, lowByte) {
    let value = (highByte << 8) | lowByte;
    if (value & 0x8000) {
      value -= 0x10000;
    }
    return value;
  }

  function processS15STHMQData(frame) {
    if (frame.data.length < 10) return null;
    const humidityRaw = parseRegisterValue(frame.data[0], frame.data[1]);
    const humidity = humidityRaw / 100;
    const tempCRaw = parseRegisterValue(frame.data[2], frame.data[3]);
    const temperatureC = tempCRaw * 0.05;
    const tempFRaw = parseRegisterValue(frame.data[4], frame.data[5]);
    const temperatureF = tempFRaw * 0.05;
    const dewCRaw = parseRegisterValue(frame.data[6], frame.data[7]);
    const dewPointC = dewCRaw / 100;
    const dewFRaw = parseRegisterValue(frame.data[8], frame.data[9]);
    const dewPointF = dewFRaw / 100;
    return { humidity, temperatureC, temperatureF, dewPointC, dewPointF };
  }

  function processS15CUMQData(frame, deviceId) {
    if (deviceId === 3) {
      if (frame.data.length < 2) return null;
      const raw = parseRegisterValue(frame.data[0], frame.data[1]);
      const voltage = raw / 1000;
      return { voltage };
    } else {
      if (frame.data.length < 10) return null;
      const raw = parseRegisterValue(frame.data[0], frame.data[1]);
      const voltage = raw / 1000;
      return { voltage };
    }
  }

  function parseModbusFrame(bytes) {
    if (bytes.length < 4) return null;
    const messageWithoutCRC = bytes.slice(0, bytes.length - 2);
    const receivedCRC = bytes[bytes.length - 2] | (bytes[bytes.length - 1] << 8);
    const calculatedCRC = calculateCRC(messageWithoutCRC);
    if (receivedCRC !== calculatedCRC) {
      return { error: "CRC inválido", receivedCRC, calculatedCRC };
    }
    return {
      id: bytes[0],
      functionCode: bytes[1],
      byteCount: bytes[2],
      data: bytes.slice(3, bytes.length - 2)
    };
  }

  async function readModbusResponse(reader, minBytes, totalTimeout) {
    const chunks = [];
    let totalLength = 0;
    const startTime = Date.now();
    while (Date.now() - startTime < totalTimeout) {
      const chunkResult = await Promise.race([
        reader.read(),
        new Promise(resolve => setTimeout(resolve, 50))
      ]);
      if (!chunkResult || chunkResult.done || !chunkResult.value) continue;
      const chunk = chunkResult.value;
      chunks.push(chunk);
      totalLength += chunk.length;
      if (totalLength >= minBytes) {
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const c of chunks) {
          buffer.set(c, offset);
          offset += c.length;
        }
        const frame = parseModbusFrame(buffer);
        if (frame && !frame.error) {
          return { raw: buffer, frame };
        }
      }
    }
    return null;
  }

  function createUnifiedChart(devices) {
    const ctx = document.getElementById("mainChart").getContext("2d");
    const yPressureAmplitude = parseInt(yAmplitudeInput.value) || 400;
    const yDistanceAmplitude = 200;
    const datasets = [];
    deviceDatasetIndex = {};
    devices.forEach(deviceId => {
      if (deviceId === 4) return;
      let label = "";
      let yAxisID = "yDefault";
      if (deviceId === 1) {
        label = "Pressão (P1)";
        yAxisID = "yPressure";
      } else if (deviceId === 2) {
        label = "Pressão (P2)";
        yAxisID = "yPressure";
      } else if (deviceId === 3) {
        label = "Distância (D1)";
        yAxisID = "yDistance";
      } else {
        label = `Dispositivo ${deviceId}`;
      }
      datasets.push({
        label: label,
        data: [],
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0.5,
        yAxisID: yAxisID
      });
      deviceDatasetIndex[deviceId] = datasets.length - 1;
    });

    mainChart = new Chart(ctx, {
      type: "line",
      data: { datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: { type: "time", time: { unit: "second" }, title: { display: true, text: "Tempo" } },
          yPressure: { type: "linear", position: "left", min: 0, max: yPressureAmplitude, title: { display: true, text: "Pressão (bar)" } },
          yDistance: { type: "linear", position: "right", min: 0, max: yDistanceAmplitude, title: { display: true, text: "Distância (mm)" }, grid: { drawOnChartArea: false } },
          yDefault: { type: "linear", display: false }
        }
      }
    });
  }

  function createTempChart() {
    const ctx = document.getElementById("tempChart").getContext("2d");
    tempChart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [{
          label: "Temperatura (°C)",
          data: [],
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: { type: "time", time: { unit: "second" }, title: { display: true, text: "Tempo" } },
          y: { title: { display: true, text: "Temperatura (°C)" } }
        }
      }
    });
  }

  function createHumidityChart() {
    const ctx = document.getElementById("humidityChart").getContext("2d");
    humidityChart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [{
          label: "Umidade (%RH)",
          data: [],
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: { type: "time", time: { unit: "second" }, title: { display: true, text: "Tempo" } },
          y: { title: { display: true, text: "Umidade (%RH)" }, min: 0, max: 100 }
        }
      }
    });
  }

  function createDewPointChart() {
    const ctx = document.getElementById("dewPointChart").getContext("2d");
    dewPointChart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [{
          label: "Ponto de Orvalho (°C)",
          data: [],
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: { type: "time", time: { unit: "second" }, title: { display: true, text: "Tempo" } },
          y: { title: { display: true, text: "Ponto de Orvalho (°C)" }, min: 0, max: 50 }
        }
      }
    });
  }

  function computeMovingAverage(dataArray, windowSize = 5) {
    const n = dataArray.length;
    if (n < windowSize) return dataArray[n - 1].y;
    const subset = dataArray.slice(n - windowSize);
    const sum = subset.reduce((acc, point) => acc + point.y, 0);
    return sum / subset.length;
  }

  function updateUnifiedChart(deviceId, timestamp, value) {
    const dsIndex = deviceDatasetIndex[deviceId];
    if (dsIndex === undefined || !mainChart) return;
    const dataset = mainChart.data.datasets[dsIndex].data;
    dataset.push({ x: timestamp, y: value });
    const historyWindow = parseInt(historyWindowInput.value) || 30;
    const cutoffTime = Date.now() - historyWindow * 60 * 1000;
    while (dataset.length && new Date(dataset[0].x).getTime() < cutoffTime) {
      dataset.shift();
    }
    if (deviceId === 1 || deviceId === 2) {
      lastUnifiedValues[deviceId] = (dataset.length >= 5) ? computeMovingAverage(dataset, 5) : value;
    } else {
      lastUnifiedValues[deviceId] = value;
      if (deviceId === 3) {
        mainChart.options.scales.yDistance.min = 0;
        mainChart.options.scales.yDistance.max = 200;
      }
    }
    mainChart.update("none");
    updateUnifiedDisplay();
  }

  function updateUnifiedDisplay() {
    const displayElement = document.getElementById("unifiedDisplay");
    if (!displayElement) return;
    let displayText = "";
    Object.keys(lastUnifiedValues).forEach(deviceId => {
      const id = parseInt(deviceId);
      let label = (id === 1) ? "P1" : (id === 2) ? "P2" : (id === 3) ? "D1" : `Disp ${deviceId}`;
      displayText += `${label}: ${lastUnifiedValues[deviceId].toFixed(2)}   `;
    });
    displayElement.textContent = displayText;
  }

  function updateTempChart(timestamp, temperature) {
    if (!tempChart) return;
    const dataset = tempChart.data.datasets[0].data;
    dataset.push({ x: timestamp, y: temperature });
    const historyWindow = parseInt(historyWindowInput.value) || 30;
    const cutoffTime = Date.now() - historyWindow * 60 * 1000;
    while (dataset.length && new Date(dataset[0].x).getTime() < cutoffTime) {
      dataset.shift();
    }
    tempChart.options.scales.y.min = temperature - 5;
    tempChart.options.scales.y.max = temperature + 5;
    tempChart.update("none");
    const tempDisplay = document.getElementById("tempDisplay");
    if (tempDisplay) {
      tempDisplay.textContent = "Temperatura: " + temperature.toFixed(2) + " °C";
    }
  }

  function updateHumidityChart(timestamp, humidity) {
    if (!humidityChart) return;
    const dataset = humidityChart.data.datasets[0].data;
    dataset.push({ x: timestamp, y: humidity });
    const historyWindow = parseInt(historyWindowInput.value) || 30;
    const cutoffTime = Date.now() - historyWindow * 60 * 1000;
    while (dataset.length && new Date(dataset[0].x).getTime() < cutoffTime) {
      dataset.shift();
    }
    humidityChart.options.scales.y.min = Math.max(0, humidity - 5);
    humidityChart.options.scales.y.max = humidity + 5;
    humidityChart.update("none");
    const humidityDisplay = document.getElementById("humidityDisplay");
    if (humidityDisplay) {
      humidityDisplay.textContent = "Umidade: " + humidity.toFixed(2) + " %RH";
    }
  }

  function updateDewPointChart(timestamp, dewPoint) {
    if (!dewPointChart) return;
    const dataset = dewPointChart.data.datasets[0].data;
    dataset.push({ x: timestamp, y: dewPoint });
    const historyWindow = parseInt(historyWindowInput.value) || 30;
    const cutoffTime = Date.now() - historyWindow * 60 * 1000;
    while (dataset.length && new Date(dataset[0].x).getTime() < cutoffTime) {
      dataset.shift();
    }
    dewPointChart.options.scales.y.min = dewPoint - 5;
    dewPointChart.options.scales.y.max = dewPoint + 5;
    dewPointChart.update("none");
    const dewPointDisplay = document.getElementById("dewPointDisplay");
    if (dewPointDisplay) {
      dewPointDisplay.textContent = "Ponto de Orvalho: " + dewPoint.toFixed(2) + " °C";
    }
  }

  async function readDevice(deviceId) {
    while (isRunning) {
      const release = await portMutex.lock();
      try {
        let retries = 0;
        let response = null;
        while (retries < MAX_RETRIES) {
          const requestFrame = buildReadRegistersFrame(deviceId, 0, 5);
          logDebug(`Enviando para ${deviceId} [${currentBaudRate}bps]: ${bytesToHexString(requestFrame)}`);
          addToCommunicationLog("ENVIO", `Dispositivo ${deviceId}: ${bytesToHexString(requestFrame)}`);
          const writer = port.writable.getWriter();
          await writer.write(requestFrame);
          writer.releaseLock();

          activeReader = port.readable.getReader();
          try {
            response = await readModbusResponse(activeReader, 15, modbusTimeout);
          } finally {
            activeReader.releaseLock();
            activeReader = null;
          }
          if (response && !(response.frame && response.frame.error)) {
            break;
          } else {
            retries++;
            logDebug(`Tentativa ${retries} falhou para dispositivo ${deviceId}. Retentando...`);
            await new Promise(resolve => setTimeout(resolve, 20));
            response = null;
          }
        }
        if (response) {
          logDebug(`Recebido de ${deviceId}: ${bytesToHexString(response.raw)}`);
          addToCommunicationLog("RECEPÇÃO", `Dispositivo ${deviceId}: ${bytesToHexString(response.raw)}`);
          const frame = response.frame;
          if (frame.error) {
            logDebug(`Dispositivo ${deviceId}: erro no frame (${frame.error}).`);
          } else {
            let sensorData =
              deviceId === 4
                ? processS15STHMQData(frame)
                : processS15CUMQData(frame, deviceId);
            if (sensorData) {
              sensorData.deviceId = deviceId;
              sensorData.timestamp = new Date();
              if (isRecording) {
                recordedData.push({ timestamp: sensorData.timestamp.toISOString(), deviceId, ...sensorData });
                if (!deviceHistory[deviceId]) deviceHistory[deviceId] = [];
                deviceHistory[deviceId].push(sensorData);
              }
              if (deviceId === 4) {
                updateTempChart(sensorData.timestamp, sensorData.temperatureC);
                updateHumidityChart(sensorData.timestamp, sensorData.humidity);
                updateDewPointChart(sensorData.timestamp, sensorData.dewPointC);
              } else {
                let value;
                if (deviceId === 1 || deviceId === 2) {
                  value = convertPressure(deviceId, sensorData.voltage);
                } else if (deviceId === 3) {
                  value = convertDistance(sensorData.voltage);
                } else {
                  value = sensorData.voltage;
                }
                updateUnifiedChart(deviceId, sensorData.timestamp, value);
              }
            }
          }
        } else {
          logDebug(`Dispositivo ${deviceId}: nenhuma resposta válida após ${MAX_RETRIES} tentativas.`);
        }
      } catch (error) {
        logDebug(`Erro ao ler dispositivo ${deviceId}: ${error.message}`);
      } finally {
        release();
      }
      await new Promise(resolve => setTimeout(resolve, parseInt(updateIntervalSelect.value)));
    }
  }

  function fallbackExport(content, type) {
    const timestamp = getLocalTimestamp();
    const blob = new Blob([content], { 
      type: type === 'csv' ? "text/csv;charset=utf-8;" : "text/html;charset=utf-8;" 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = type === 'csv' ? 
      `dados_exportados_${timestamp.replace(/[: ]/g, "-")}.csv` :
      `historico_exportado_${timestamp.replace(/[: ]/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function exportData() {
    try {
      if (recordedData.length === 0) {
        alert("Nenhum dado registrado para exportação.");
        return;
      }

      let header = "NL,Disp,Timestamp,VVal,Temp,Umid,PDOrv\n";
      let csvContent = header;

      recordedData.forEach((reading, index) => {
        const lineNumber = index + 1;
        const disp = reading.deviceId;
        const dateObj = new Date(reading.timestamp);
        const isoTimestamp = dateObj.toISOString();
        let vval = "";
        let temp = "";
        let umid = "";
        let pdorv = "";

        if (reading.voltage !== undefined) {
          let converted;
          if (reading.deviceId === 1 || reading.deviceId === 2) {
            converted = convertPressure(reading.deviceId, reading.voltage);
          } else if (reading.deviceId === 3) {
            converted = convertDistance(reading.voltage);
          } else {
            converted = reading.voltage;
          }
          vval = parseFloat(converted.toFixed(2));
          temp = "N/A";
          umid = "N/A";
          pdorv = "N/A";
        } else {
          vval = "N/A";
          temp = reading.temperatureC !== undefined ? parseFloat(reading.temperatureC.toFixed(2)) : "N/A";
          umid = reading.humidity !== undefined ? parseFloat(reading.humidity.toFixed(2)) : "N/A";
          pdorv = reading.dewPointC !== undefined ? parseFloat(reading.dewPointC.toFixed(2)) : "N/A";
        }

        let line = `${lineNumber},${disp},${isoTimestamp},${vval},${temp},${umid},${pdorv}\n`;
        csvContent += line;
      });

      if ('showSaveFilePicker' in window) {
        try {
          const timestamp = getLocalTimestamp();
          const handle = await window.showSaveFilePicker({
            types: [{
              description: 'CSV Files',
              accept: {'text/csv': ['.csv']},
            }],
            suggestedName: `dados_exportados_${timestamp.replace(/[: ]/g, "-")}.csv`
          });
          const writable = await handle.createWritable();
          await writable.write(csvContent);
          await writable.close();
          logDebug("Dados exportados com sucesso para arquivo selecionado.");
        } catch (err) {
          if (err.name !== 'AbortError') {
            fallbackExport(csvContent, 'csv');
          }
        }
      } else {
        fallbackExport(csvContent, 'csv');
      }
    } catch (error) {
      logDebug(`Erro ao exportar dados: ${error.message}`);
      alert("Erro ao exportar dados. Verifique o console para mais detalhes.");
    }
  }

  async function exportLog() {
    try {
      if (communicationLog.length === 0) {
        alert("Nenhum log registrado para exportação.");
        return;
      }

      const header = "timestamp,direction,message\n";
      let csvContent = header;
      communicationLog.forEach(entry => {
        const msg = entry.message.replace(/"/g, '""');
        csvContent += `${entry.timestamp},${entry.direction},"${msg}"\n`;
      });

      if ('showSaveFilePicker' in window) {
        try {
          const timestamp = getLocalTimestamp();
          const handle = await window.showSaveFilePicker({
            types: [{
              description: 'CSV Files',
              accept: {'text/csv': ['.csv']},
            }],
            suggestedName: `communication_log_${timestamp.replace(/[: ]/g, "-")}.csv`
          });
          const writable = await handle.createWritable();
          await writable.write(csvContent);
          await writable.close();
          logDebug("Log de comunicação exportado com sucesso para arquivo selecionado.");
        } catch (err) {
          if (err.name !== 'AbortError') {
            fallbackExport(csvContent, 'csv');
          }
        }
      } else {
        fallbackExport(csvContent, 'csv');
      }
    } catch (error) {
      logDebug(`Erro ao exportar log: ${error.message}`);
      alert("Erro ao exportar log. Verifique o console para mais detalhes.");
    }
  }

  async function exportHistory() {
    try {
      if (Object.keys(deviceHistory).length === 0) {
        alert("Nenhum histórico registrado para exportação.");
        return;
      }

      let html = `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Histórico de Dados Exportado</title>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 5px; text-align: center; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>Histórico de Dados Exportado</h1>`;
      
      for (let deviceId in deviceHistory) {
        html += `<h2>Dispositivo ${deviceId}</h2>`;
        if (deviceHistory[deviceId].length === 0) {
          html += "<p>Nenhum dado registrado.</p>";
          continue;
        }
        html += "<table><tr><th>Timestamp</th><th>Valor</th></tr>";
        deviceHistory[deviceId].forEach(reading => {
          let value = "";
          if (reading.voltage !== undefined) {
            if (parseInt(deviceId) === 1 || parseInt(deviceId) === 2) {
              value = convertPressure(parseInt(deviceId), reading.voltage);
            } else if (parseInt(deviceId) === 3) {
              value = convertDistance(reading.voltage);
            } else {
              value = reading.voltage;
            }
            value = value.toFixed(2);
          } else {
            value = reading.temperatureC !== undefined ? reading.temperatureC.toFixed(2) : "";
          }
          html += `<tr>
            <td>${new Date(reading.timestamp).toLocaleString()}</td>
            <td>${value}</td>
          </tr>`;
        });
        html += "</table>";
      }
      html += "</body></html>";

      if ('showSaveFilePicker' in window) {
        try {
          const timestamp = getLocalTimestamp();
          const handle = await window.showSaveFilePicker({
            types: [{
              description: 'HTML Files',
              accept: {'text/html': ['.html']},
            }],
            suggestedName: `historico_exportado_${timestamp.replace(/[: ]/g, "-")}.html`
          });
          const writable = await handle.createWritable();
          await writable.write(html);
          await writable.close();
          logDebug("Histórico exportado com sucesso para arquivo selecionado.");
        } catch (err) {
          if (err.name !== 'AbortError') {
            fallbackExport(html, 'html');
          }
        }
      } else {
        fallbackExport(html, 'html');
      }
    } catch (error) {
      logDebug(`Erro ao exportar histórico: ${error.message}`);
      alert("Erro ao exportar histórico. Verifique o console para mais detalhes.");
    }
  }

  // Event listeners
  toggleRecordingButton.addEventListener("click", () => {
    isRecording = !isRecording;
    if (isRecording) {
      recordedData = [];
      deviceHistory = {};
      btnToggleAcquisition.disabled = true;
      toggleRecordingButton.textContent = "Parar Gravação";
      toggleRecordingButton.classList.add("recording");
      recordingIndicator.style.display = "inline";
      logDebug("Gravação iniciada.");
    } else {
      toggleRecordingButton.textContent = "Iniciar Gravação";
      toggleRecordingButton.classList.remove("recording");
      recordingIndicator.style.display = "none";
      btnToggleAcquisition.disabled = false;
      logDebug(`Gravação finalizada. ${recordedData.length} registros gravados.`);
      if (recordedData.length > 0 && confirm(`Gravação finalizada com ${recordedData.length} registros. Deseja exportar os dados agora?`)) {
        exportData();
      }
    }
  });

  exportDataButton.addEventListener("click", exportData);
  exportLogButton.addEventListener("click", exportLog);
  exportHistoryButton.addEventListener("click", exportHistory);

  showHistoryButton.addEventListener("click", () => {
    let html = "";
    for (let deviceId in deviceHistory) {
      html += `<h2>Dispositivo ${deviceId}</h2>`;
      if (deviceHistory[deviceId].length === 0) {
        html += "<p>Nenhum dado registrado.</p>";
        continue;
      }
      html += "<table border='1' cellpadding='5' cellspacing='0' style='width:100%; border-collapse: collapse;'>";
      if (parseInt(deviceId) === 4) {
        html += "<tr><th>Timestamp</th><th>Umidade (%RH)</th><th>Temp (°C)</th><th>Temp (°F)</th><th>Ponto de Orvalho (°C)</th><th>Ponto de Orvalho (°F)</th></tr>";
        deviceHistory[deviceId].forEach(reading => {
          html += `<tr>
            <td>${new Date(reading.timestamp).toLocaleString()}</td>
            <td>${reading.humidity ? reading.humidity.toFixed(2) : ""}</td>
            <td>${reading.temperatureC ? reading.temperatureC.toFixed(2) : ""}</td>
            <td>${reading.temperatureF ? reading.temperatureF.toFixed(2) : ""}</td>
            <td>${reading.dewPointC ? reading.dewPointC.toFixed(2) : ""}</td>
            <td>${reading.dewPointF ? reading.dewPointF.toFixed(2) : ""}</td>
          </tr>`;
        });
      } else {
        html += "<tr><th>Timestamp</th><th>Valor</th></tr>";
        deviceHistory[deviceId].forEach(reading => {
          let value = "";
          if (reading.voltage !== undefined) {
            if (parseInt(deviceId) === 1 || parseInt(deviceId) === 2) {
              value = convertPressure(parseInt(deviceId), reading.voltage);
            } else if (parseInt(deviceId) === 3) {
              value = convertDistance(reading.voltage);
            } else {
              value = reading.voltage;
            }
            value = value.toFixed(2);
          }
          html += `<tr>
            <td>${new Date(reading.timestamp).toLocaleString()}</td>
            <td>${value}</td>
          </tr>`;
        });
      }
      html += "</table>";
    }
    const modal = document.getElementById("historyModal");
    modal.innerHTML = html;
    $(modal).dialog({
      width: 600,
      height: 400,
      modal: true,
      title: "Histórico de Dados"
    });
  });

  clearDataButton.addEventListener("click", () => {
    recordedData = [];
    deviceHistory = {};
    communicationLog = [];
    logDebug("Dados limpos.");
    if (mainChart) {
      mainChart.data.datasets.forEach(ds => (ds.data = []));
      mainChart.update("none");
    }
    if (tempChart) {
      tempChart.data.datasets[0].data = [];
      tempChart.update("none");
    }
    if (humidityChart) {
      humidityChart.data.datasets[0].data = [];
      humidityChart.update("none");
    }
    if (dewPointChart) {
      dewPointChart.data.datasets[0].data = [];
      dewPointChart.update("none");
    }
  });

  applyManualParamsButton.addEventListener("click", async () => {
    applyManualParamsButton.disabled = true;
    if (!port) {
      logDebug("A porta não está aberta para reconfiguração manual.");
      applyManualParamsButton.disabled = false;
      return;
    }
    if (!portOpen) {
      logDebug("A porta já está fechada.");
      applyManualParamsButton.disabled = false;
      return;
    }
    const newBaud = parseInt(manualBaudRateSelect.value);
    const newParity = manualParitySelect.value;
    const newStopBits = parseInt(manualStopBitsSelect.value);
    const wasRunning = isRunning;
    isRunning = false;
    if (activeReader) {
      try {
        await activeReader.cancel();
      } catch (e) {
        logDebug("Erro ao cancelar leitura ativa: " + e.message);
      }
      activeReader.releaseLock();
      activeReader = null;
    }
    try {
      if (portOpen) {
        await port.close();
        portOpen = false;
        logDebug("Porta fechada para reconfiguração manual.");
      } else {
        logDebug("Porta já estava fechada.");
      }
      await port.open({ baudRate: newBaud, dataBits: 8, parity: newParity, stopBits: newStopBits });
      portOpen = true;
      currentBaudRate = newBaud;
      logDebug(`Porta reaberta com Baud Rate: ${newBaud}, Paridade: ${newParity}, Stop Bits: ${newStopBits}.`);
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      logDebug("Erro ao aplicar parâmetros manuais: " + error.message);
    }
    isRunning = wasRunning;
    applyManualParamsButton.disabled = false;
  });

  updateIntervalSelect.addEventListener("change", () => {
    logDebug(`Intervalo de atualização alterado para ${updateIntervalSelect.value}ms`);
  });

  yAmplitudeInput.addEventListener("change", () => {
    const yAmp = parseInt(yAmplitudeInput.value) || 400;
    if (mainChart) {
      mainChart.options.scales.yPressure.max = yAmp;
      mainChart.update("none");
    }
  });

  window.addEventListener("unload", () => {
    isRunning = false;
    let totalUsage = parseInt(localStorage.getItem("totalUsage") || "0", 10);
    totalUsage += sessionTime;
    localStorage.setItem("totalUsage", totalUsage);
  });

  btnToggleAcquisition.addEventListener("click", () => {
    if (isRunning) {
      isRunning = false;
      btnToggleAcquisition.textContent = "Iniciar Aquisições";
      btnToggleAcquisition.classList.remove("active");
      logDebug("Aquisições pausadas.");
      releaseWakeLock();
    } else {
      isRunning = true;
      btnToggleAcquisition.textContent = "Parar Aquisições";
      btnToggleAcquisition.classList.add("active");
      logDebug("Aquisições reiniciadas.");
      requestWakeLock();
      deviceIds.forEach(deviceId => {
        readDevice(deviceId);
      });
    }
  });

  connectButton.addEventListener("click", async () => {
    try {
      deviceIds = document.getElementById("deviceIds")
        .value.split(",")
        .map(s => parseInt(s.trim()))
        .filter(id => !isNaN(id));
      if (deviceIds.length === 0) {
        alert("Insira pelo menos um ID válido.");
        return;
      }
      if (deviceIds.includes(4)) {
        document.getElementById("tempChartContainer").style.display = "block";
        document.getElementById("humidityChartContainer").style.display = "block";
        document.getElementById("dewPointChartContainer").style.display = "block";
        createTempChart();
        createHumidityChart();
        createDewPointChart();
      }
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 38400, dataBits: 8, parity: "none", stopBits: 1 });
      portOpen = true;
      currentBaudRate = 38400;
      messagesContainer.innerHTML = `<div>Porta aberta com sucesso em 38400 bps (8 bits, sem paridade)!</div>`;
      sendRequestButton.disabled = false;
      toggleRecordingButton.disabled = false;
      btnToggleAcquisition.disabled = false;
      createUnifiedChart(deviceIds);
      isRunning = true;
      requestWakeLock();
      await new Promise(resolve => setTimeout(resolve, 200));
      deviceIds.forEach(deviceId => {
        readDevice(deviceId);
      });
      btnToggleAcquisition.textContent = "Parar Aquisições";
    } catch (error) {
      messagesContainer.innerHTML = `<div style="color:red;">Erro ao abrir a porta: ${error.message}</div>`;
      console.error("Erro ao abrir a porta:", error);
    }
  });

  exitProgramButton.addEventListener("click", async () => {
    if (confirm("Deseja realmente encerrar o programa?")) {
      if (communicationLog.length > 0 && confirm("Você possui logs não exportados. Deseja exportá-los antes de sair?")) {
        exportLog();
      }
      isRunning = false;
      if (port && portOpen) {
        try {
          await port.close();
        } catch (error) {
          console.error("Erro ao fechar a porta serial:", error);
        }
        portOpen = false;
      }
      alert("Programa encerrado. Feche a guia ou janela do navegador.");
    }
  });
})();