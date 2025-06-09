// main.js - Arquivo principal que coordena toda a aplicação
import { UIManager } from './modules/ui-manager.js';
import { SerialManager } from './modules/serial-manager.js';
import { ChartManager } from './modules/chart-manager.js';
import { DataManager } from './modules/data-manager.js';
import { WakeLockManager } from './modules/wakelock-manager.js';
import { LoggingManager } from './modules/logging-manager.js';

(function() {
  "use strict";

  // Instâncias dos gerenciadores
  const loggingManager = new LoggingManager();
  const uiManager = new UIManager();
  const serialManager = new SerialManager(loggingManager);
  const chartManager = new ChartManager();
  const dataManager = new DataManager(loggingManager);
  const wakeLockManager = new WakeLockManager();

  // Configuração inicial
  let isRunning = false;
  let isRecording = false;
  let deviceIds = [];

  // Inicialização da aplicação
  function initializeApp() {
    // Configurar event listeners
    setupEventListeners();
    
    // Inicializar componentes
    uiManager.initialize();
    wakeLockManager.requestWakeLock();
    
    // Configurar intervalo de atualização
    document.getElementById("updateInterval").value = "50";
  }

  function setupEventListeners() {
    // Conectar/Desconectar porta serial
    document.getElementById("connect").addEventListener("click", async () => {
      if (serialManager.isConnected()) {
        await serialManager.disconnect();
        uiManager.updateConnectionStatus(false);
      } else {
        const success = await serialManager.connect();
        if (success) {
          deviceIds = await serialManager.detectDevices();
          chartManager.createUnifiedChart(deviceIds);
          chartManager.createTempChart();
          chartManager.createHumidityChart();
          chartManager.createDewPointChart();
          uiManager.updateConnectionStatus(true);
        }
      }
    });

    // Toggle aquisição de dados
    document.getElementById("btnToggleAcquisition").addEventListener("click", async () => {
      if (isRunning) {
        isRunning = false;
        uiManager.updateAcquisitionStatus(false);
      } else {
        if (serialManager.isConnected()) {
          isRunning = true;
          uiManager.updateAcquisitionStatus(true);
          startDataAcquisition();
        } else {
          alert("Conecte-se à porta serial primeiro.");
        }
      }
    });

    // Toggle gravação
    document.getElementById("toggleRecording").addEventListener("click", () => {
      isRecording = !isRecording;
      if (isRecording) {
        dataManager.startRecording();
        document.getElementById("btnToggleAcquisition").disabled = true;
      } else {
        dataManager.stopRecording();
        document.getElementById("btnToggleAcquisition").disabled = false;
      }
      uiManager.updateRecordingStatus(isRecording);
    });

    // Exportar dados
    document.getElementById("exportData").addEventListener("click", () => {
      dataManager.exportData();
    });

    // Exportar logs
    document.getElementById("exportLog").addEventListener("click", () => {
      loggingManager.exportLog();
    });

    // Outros event listeners...
    setupAdditionalEventListeners();
  }

  function setupAdditionalEventListeners() {
    // Event listener para confirmação ao fechar
    window.addEventListener("beforeunload", function(e) {
      const confirmationMessage = "Deseja realmente encerrar o programa?\nOs logs não exportados serão perdidos.";
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    });

    // Outros listeners específicos
    document.getElementById("clearData").addEventListener("click", () => {
      dataManager.clearData();
      chartManager.clearAllCharts();
    });

    document.getElementById("btnChangeBg").addEventListener("click", () => {
      uiManager.toggleBackgroundColor();
    });
  }

  async function startDataAcquisition() {
    const updateInterval = parseInt(document.getElementById("updateInterval").value) || 50;
    
    while (isRunning && serialManager.isConnected()) {
      for (const deviceId of deviceIds) {
        if (!isRunning) break;
        
        try {
          const data = await serialManager.readDevice(deviceId);
          if (data) {
            // Processar dados e atualizar gráficos
            processDeviceData(deviceId, data);
          }
        } catch (error) {
          loggingManager.logDebug(`Erro ao ler dispositivo ${deviceId}: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, updateInterval));
      }
    }
  }

  function processDeviceData(deviceId, data) {
    const timestamp = new Date();
    
    if (isRecording) {
      dataManager.addData(deviceId, data, timestamp);
    }

    // Atualizar gráficos baseado no tipo de dispositivo
    if (deviceId === 4) {
      // Sensor de temperatura/umidade
      if (data.temperatureC !== undefined) {
        chartManager.updateTempChart(timestamp, data.temperatureC);
      }
      if (data.humidity !== undefined) {
        chartManager.updateHumidityChart(timestamp, data.humidity);
      }
      if (data.dewPointC !== undefined) {
        chartManager.updateDewPointChart(timestamp, data.dewPointC);
      }
    } else {
      // Sensores de pressão/distância
      let value;
      if (deviceId === 1 || deviceId === 2) {
        value = dataManager.convertPressure(deviceId, data.voltage);
      } else if (deviceId === 3) {
        value = dataManager.convertDistance(data.voltage);
      } else {
        value = data.voltage;
      }
      
      chartManager.updateUnifiedChart(deviceId, timestamp, value);
    }
  }

  // Inicializar aplicação quando DOM estiver carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

})();