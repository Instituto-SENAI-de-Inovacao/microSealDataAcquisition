# Especificações Técnicas - MicroSEAL

## Arquitetura do Sistema

### Tecnologias Utilizadas

#### Frontend
- **HTML5:** Estrutura da interface
- **CSS3:** Estilização e layout responsivo
- **JavaScript ES2020:** Lógica da aplicação
- **Chart.js 4.x:** Gráficos em tempo real
- **jQuery 3.6.x:** Manipulação DOM e UI components

#### APIs Web
- **Web Serial API:** Comunicação serial nativa
- **Wake Lock API:** Prevenção de suspensão da tela
- **File System Access API:** Exportação de arquivos avançada
- **LocalStorage API:** Persistência de configurações

### Comunicação Modbus RTU

#### Especificação do Protocolo

**Function Code:** 03 (Read Holding Registers)
```
Request Frame:
[Slave ID][0x03][Start Address H][Start Address L][Quantity H][Quantity L][CRC L][CRC H]

Response Frame:
[Slave ID][0x03][Byte Count][Data...][CRC L][CRC H]
```

**Parâmetros Padrão:**
- **Starting Address:** 0x0000
- **Register Quantity:** 5
- **CRC Polynomial:** 0xA001 (Modbus standard)

#### Exemplos de Comunicação

**Leitura Dispositivo 1:**
```
Envio:    01 03 00 00 00 05 85 C6
Resposta: 01 03 0A [10 bytes de dados] [CRC]
```

**Leitura Dispositivo 4 (Sensor Ambiental):**
```
Envio:    04 03 00 00 00 05 84 5A
Resposta: 04 03 0A [10 bytes: umidade, temp, dewpoint] [CRC]
```

### Conversões de Dados

#### Sensores de Pressão (S15CUMQ)

**Dispositivo 1 (P1):**
```javascript
// Raw voltage em mV
voltage = ((high_byte << 8) | low_byte) / 1000.0;

// Conversão para pressão em bar
pressure_bar = (voltage * 40.0) - 0.0;  // Sem correção
```

**Dispositivo 2 (P2):**
```javascript
// Raw voltage em mV  
voltage = ((high_byte << 8) | low_byte) / 1000.0;

// Conversão para pressão em bar
pressure_bar = (voltage * 40.0) - 6.0;  // Correção de 6 bar
```

#### Sensor de Distância (S15CUMQ)

**Dispositivo 3 (D1):**
```javascript
// Raw voltage em mV
voltage = ((high_byte << 8) | low_byte) / 1000.0;

// Conversão para distância em mm
distance_mm = (voltage * 30.0) - 0.0;
```

#### Sensor Ambiental (S15STHMQ)

**Dispositivo 4:**
```javascript
// Umidade (registros 0-1)
humidity_raw = (high_byte << 8) | low_byte;
humidity_percent = humidity_raw / 100.0;

// Temperatura Celsius (registros 2-3)
temp_c_raw = (high_byte << 8) | low_byte;
if (temp_c_raw & 0x8000) temp_c_raw -= 0x10000; // Signed
temperature_c = temp_c_raw * 0.05;

// Temperatura Fahrenheit (registros 4-5)
temp_f_raw = (high_byte << 8) | low_byte;
if (temp_f_raw & 0x8000) temp_f_raw -= 0x10000; // Signed
temperature_f = temp_f_raw * 0.05;

// Ponto de Orvalho Celsius (registros 6-7)
dew_c_raw = (high_byte << 8) | low_byte;
if (dew_c_raw & 0x8000) dew_c_raw -= 0x10000; // Signed
dew_point_c = dew_c_raw / 100.0;

// Ponto de Orvalho Fahrenheit (registros 8-9)
dew_f_raw = (high_byte << 8) | low_byte;
if (dew_f_raw & 0x8000) dew_f_raw -= 0x10000; // Signed
dew_point_f = dew_f_raw / 100.0;
```

## Performance e Limites

### Taxa de Aquisição

**Configurações Disponíveis:**
- **20 Hz (50ms):** Taxa máxima recomendada
- **10 Hz (100ms):** Uso normal
- **2 Hz (500ms):** Economia de recursos
- **1 Hz (1000ms):** Monitoramento lento

**Fatores Limitantes:**
- Tempo de resposta Modbus (~10-30ms por dispositivo)
- Processamento JavaScript (~5-10ms)
- Renderização de gráficos (~10-20ms)
- Mutex de porta serial (acesso sequencial)

### Capacidade de Dados

**Memória RAM:**
- **Por ponto:** ~100 bytes (timestamp + valores)
- **Por minuto (20Hz):** ~120KB
- **Por hora:** ~7.2MB
- **Limite prático:** ~100MB (aprox. 14 horas)

**Armazenamento Local:**
- **LocalStorage:** Configurações (< 1KB)
- **Exportação:** Arquivos CSV/HTML conforme demanda
- **Sem persistência:** Dados perdidos ao fechar navegador

### Requisitos de Sistema

#### Hardware Mínimo
- **CPU:** Dual-core 1.5GHz
- **RAM:** 4GB
- **USB:** 2.0 ou superior
- **Resolução:** 1024x768

#### Hardware Recomendado
- **CPU:** Quad-core 2.0GHz+
- **RAM:** 8GB+
- **USB:** 3.0
- **Resolução:** 1920x1080+

#### Rede
- **Inicial:** Conexão para CDN (Chart.js, jQuery)
- **Operação:** Totalmente offline após carregamento

## Segurança e Confiabilidade

### Validação de Dados

#### CRC-16 Modbus
```javascript
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
```

#### Tratamento de Erros
- **CRC inválido:** Descarte do frame
- **Timeout:** Retry automático (máx. 2 tentativas)
- **Formato inválido:** Log de erro + continuação
- **Dispositivo não responde:** Log + próximo dispositivo

### Recuperação de Falhas

#### Comunicação Serial
- **Perda de conexão:** Detecção automática
- **Porta ocupada:** Mensagem de erro clara
- **Driver ausente:** Orientação para instalação

#### Aplicação
- **Travamento:** Wake Lock mantém tela ativa
- **Memória cheia:** Limpeza automática de histórico antigo
- **Exportação falha:** Fallback para download direto

### Backup e Recuperação

#### Prevenção de Perda
- **Confirmação de saída:** Aviso sobre dados não salvos
- **Exportação automática:** Prompt ao parar gravação
- **Horímetro:** Controle de tempo de sessão
- **LocalStorage:** Configurações persistem

#### Logs de Auditoria
- **Comunicação:** Registro de todos os frames Modbus
- **Operacional:** Início/fim de sessões
- **Erros:** Detalhamento para diagnóstico
- **Performance:** Estatísticas de tempo de resposta

## Compatibilidade

### Navegadores Web

| Navegador | Versão | Status | Limitações |
|-----------|--------|--------|------------|
| **Chrome** | 89+ | ✅ Total | Nenhuma |
| **Edge** | 89+ | ✅ Total | Nenhuma |
| **Firefox** | 89+ | ⚠️ Parcial | Serial API experimental |
| **Safari** | Qualquer | ❌ Não suportado | Serial API indisponível |
| **Opera** | 75+ | ✅ Total | Baseado em Chromium |

### Sistemas Operacionais

| SO | Status | Drivers Necessários |
|----|--------|-------------------|
| **Windows 10/11** | ✅ Total | USB-Serial automático |
| **macOS 10.15+** | ✅ Total | Pode precisar de drivers |
| **Linux Ubuntu 20+** | ✅ Total | Geralmente nativo |
| **Linux outras** | ⚠️ Varia | Verificar udev rules |

### Hardware Serial

#### Adaptadores Testados
- **FTDI FT232:** ✅ Excelente compatibilidade
- **CH340/CH341:** ✅ Boa compatibilidade (driver necessário)
- **CP2102:** ✅ Boa compatibilidade
- **Prolific PL2303:** ⚠️ Drivers podem ser problemáticos

#### Configurações de Porta
- **Baud Rate:** 9600, 38400 bps (configurável)
- **Data Bits:** 8 (fixo)
- **Parity:** None, Even, Odd (configurável)
- **Stop Bits:** 1, 2 (configurável)
- **Flow Control:** Nenhum

## Estrutura de Arquivos

### Arquivos Principais

```
microSealDataAcquisition/
├── index.html              # Interface principal
├── script.js               # Lógica da aplicação (1071 linhas)
├── styles.css              # Estilos CSS
├── README.md              # Documentação completa
├── INSTALACAO.md          # Guia de instalação
├── OPERACAO.md            # Manual de operação
├── ESPECIFICACOES.md      # Este arquivo
└── assets/
    ├── logo.png           # Logo principal
    ├── Logo2.png          # Logo SENAI
    └── Logo3.png          # Logo adicional
```

### Dependências Externas (CDN)

```html
<!-- Chart.js para gráficos -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>

<!-- jQuery para UI -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css">
<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>
```

## Formatos de Dados

### CSV de Dados (Exportação Principal)

```csv
NL,Disp,Timestamp,VVal,Temp,Umid,PDOrv
1,1,2025-04-23T10:30:00.000Z,25.50,N/A,N/A,N/A
2,2,2025-04-23T10:30:00.050Z,30.25,N/A,N/A,N/A
3,3,2025-04-23T10:30:00.100Z,150.75,N/A,N/A,N/A
4,4,2025-04-23T10:30:00.150Z,N/A,23.45,65.20,15.30
```

**Campos:**
- **NL:** Número sequencial da linha
- **Disp:** ID do dispositivo (1-4)
- **Timestamp:** ISO 8601 UTC
- **VVal:** Valor convertido (pressão/distância)
- **Temp:** Temperatura °C (apenas dispositivo 4)
- **Umid:** Umidade %RH (apenas dispositivo 4)
- **PDOrv:** Ponto de orvalho °C (apenas dispositivo 4)

### CSV de Logs (Comunicação)

```csv
timestamp,direction,message
2025-04-23T10:30:00.000Z,ENVIO,"01 03 00 00 00 05 85 C6"
2025-04-23T10:30:00.025Z,RECEPÇÃO,"01 03 0A 01 2C 00 F4 02 58 02 BC 00 C8 01 90 A1 B2"
2025-04-23T10:30:00.050Z,DEBUG,"Dispositivo 1: 3.00V → 120.00 bar"
```

### HTML de Histórico

```html
<!DOCTYPE html>
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
  <h1>Histórico de Dados Exportado</h1>
  <!-- Tabelas por dispositivo -->
</body>
</html>
```

## APIs e Recursos Avançados

### Web Serial API

#### Verificação de Suporte
```javascript
if ('serial' in navigator) {
  // API disponível
} else {
  // Fallback ou erro
}
```

#### Configuração de Porta
```javascript
await port.open({
  baudRate: 38400,
  dataBits: 8,
  parity: "none",
  stopBits: 1
});
```

### Wake Lock API

#### Prevenção de Suspensão
```javascript
wakeLock = await navigator.wakeLock.request("screen");
```

### File System Access API

#### Salvamento Avançado
```javascript
const handle = await window.showSaveFilePicker({
  types: [{
    description: 'CSV Files',
    accept: {'text/csv': ['.csv']},
  }],
  suggestedName: 'dados_exportados.csv'
});
```

## Otimizações de Performance

### Rendering dos Gráficos

```javascript
// Desabilitação de animações para performance
chart.options.animation = { duration: 0 };

// Update otimizado sem redraw completo
chart.update("none");

// Limitação de pontos no dataset
while (dataset.length > maxPoints) {
  dataset.shift();
}
```

### Gestão de Memória

```javascript
// Limpeza automática de histórico antigo
const cutoffTime = Date.now() - historyWindow * 60 * 1000;
while (dataset.length && dataset[0].x < cutoffTime) {
  dataset.shift();
}
```

### Concorrência

```javascript
// Mutex para acesso exclusivo à porta serial
class Mutex {
  async lock() {
    // Implementação de fila de acesso
  }
}
```

---

*Especificações Técnicas - MicroSEAL v6.32*  
*Instituto SENAI de Inovação - 2025*
