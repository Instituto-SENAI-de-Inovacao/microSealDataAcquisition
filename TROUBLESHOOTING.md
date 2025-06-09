# Guia de Solução de Problemas - MicroSEAL

## Diagnóstico Rápido

### ⚡ Verificação Inicial (2 minutos)

1. **Navegador:** Chrome/Edge 88+ ✅
2. **Conexão USB:** Cabo conectado ✅
3. **Alimentação:** 24V nos sensores ✅
4. **Interface:** Arquivo index.html aberto ✅

### 🔍 Identificação do Problema

| Sintoma | Problema Provável | Seção |
|---------|------------------|-------|
| "Serial API não suportada" | Navegador incompatível | [Navegador](#problemas-de-navegador) |
| "Erro ao abrir porta" | Conflito de porta | [Conexão](#problemas-de-conexão) |
| "Nenhuma resposta" | Comunicação Modbus | [Comunicação](#problemas-de-comunicação) |
| Gráficos não atualizam | Performance/dados | [Performance](#problemas-de-performance) |
| Exportação falha | Permissões/browser | [Exportação](#problemas-de-exportação) |

## Problemas de Navegador

### ❌ "Serial API não suportada"

**Causa:** Navegador não suporta Web Serial API

**Soluções:**

1. **Usar navegador compatível:**
   ```
   ✅ Chrome 88+
   ✅ Edge 88+ 
   ⚠️ Firefox 89+ (experimental)
   ❌ Safari (não suportado)
   ```

2. **Habilitar flags experimentais (Firefox):**
   ```
   1. Acessar: about:config
   2. Buscar: dom.serial.enabled
   3. Alterar para: true
   4. Reiniciar navegador
   ```

3. **Verificar versão do Chrome:**
   ```
   chrome://version/
   ```

### ⚠️ Interface não carrega completamente

**Sintomas:**
- Gráficos não aparecem
- Botões não funcionam
- Console mostra erros

**Soluções:**

1. **Verificar conexão à internet (primeira carga):**
   ```
   Necessário para CDN do Chart.js e jQuery
   ```

2. **Limpar cache do navegador:**
   ```
   Ctrl+Shift+Delete → Limpar cache
   ```

3. **Testar em modo privado/incógnito:**
   ```
   Ctrl+Shift+N (Chrome)
   Ctrl+Shift+P (Firefox)
   ```

## Problemas de Conexão

### ❌ "Erro ao abrir a porta"

**Diagnóstico passo a passo:**

1. **Verificar porta em uso:**
   ```
   Windows: Device Manager → Ports (COM & LPT)
   Linux: ls /dev/ttyUSB* ou ls /dev/ttyACM*
   macOS: ls /dev/cu.*
   ```

2. **Fechar programas concorrentes:**
   - Arduino IDE
   - PuTTY/Tera Term
   - Outros softwares de comunicação serial

3. **Reinstalar drivers:**
   ```
   FTDI: ftdichip.com/drivers/
   CH340: wch.cn/downloads/
   CP2102: silabs.com/developers/usb-to-uart-bridge
   ```

### 🔌 Porta não aparece na lista

**Verificações:**

1. **Cabo USB:**
   - Testar com outro cabo
   - Verificar se é cabo de dados (não apenas carga)

2. **Porta USB:**
   - Testar em outra porta
   - Verificar se a porta fornece energia suficiente

3. **Driver do adaptador:**
   ```bash
   # Linux - verificar reconhecimento
   dmesg | grep -i usb
   lsusb
   
   # Windows - Device Manager
   # Procurar por dispositivos com erro (⚠️ ou ❌)
   ```

### 🔄 Conexão instável

**Sintomas:**
- Conexão funciona às vezes
- Perda intermitente de dados
- Timeouts frequentes

**Soluções:**

1. **Verificar cabo e conectores:**
   - Cabo blindado para ambientes com ruído
   - Conectores bem encaixados
   - Comprimento máximo: 15 metros

2. **Aterramento:**
   ```
   GND do adaptador conectado ao GND dos sensores
   ```

3. **Alimentação estável:**
   ```
   24V DC estável nos sensores
   Verificar quedas de tensão
   ```

## Problemas de Comunicação

### 📡 "Dispositivo X: nenhuma resposta"

**Diagnóstico Modbus:**

1. **Verificar ID do dispositivo:**
   ```javascript
   // Alterar IDs no campo respectivo
   // Testar com um dispositivo por vez: "1"
   ```

2. **Testar diferentes baud rates:**
   ```
   Tentar: 9600, 19200, 38400 bps
   Verificar configuração dos sensores
   ```

3. **Verificar cabeamento RS485:**
   ```
   A+ → Linha A (positiva)
   B- → Linha B (negativa)  
   GND → Terra comum
   ```

### 🛠️ Debug de comunicação Modbus

**Habilitar logs detalhados:**
1. Confirmar "Sim" na pergunta inicial sobre logs
2. Verificar seção "Debug" na interface
3. Analisar frames hexadecimais

**Frame de exemplo (Dispositivo 1):**
```
Envio:    01 03 00 00 00 05 85 C6
          │  │  │     │     └── CRC
          │  │  │     └─────── Quantity (5)
          │  │  └──────────── Start Address (0)
          │  └─────────────── Function Code (3)
          └────────────────── Slave ID (1)

Resposta: 01 03 0A [10 bytes dados] [CRC]
          │  │  │
          │  │  └─── Byte count (10)
          │  └────── Function code (3)
          └─────────── Slave ID (1)
```

### ⚠️ "CRC inválido"

**Causas:**
- Interferência eletromagnética
- Cabo muito longo ou de baixa qualidade
- Baud rate incorreto
- Ruído elétrico

**Soluções:**

1. **Reduzir interferência:**
   ```
   - Cabo blindado
   - Afastar de fontes de ruído (motores, inversores)
   - Aterramento adequado
   ```

2. **Melhorar qualidade do sinal:**
   ```
   - Cabo de par trançado
   - Resistores de terminação (120Ω)
   - Comprimento menor que 1200m
   ```

3. **Ajustar parâmetros:**
   ```
   - Reduzir baud rate
   - Aumentar timeout
   - Verificar impedância da linha
   ```

## Problemas de Performance

### 🐌 Lentidão na atualização

**Sintomas:**
- Gráficos atualizam lentamente
- Interface travada
- CPU alta

**Otimizações:**

1. **Reduzir taxa de aquisição:**
   ```javascript
   Intervalo: 50ms → 100ms ou 500ms
   ```

2. **Limitar histórico:**
   ```javascript
   Histórico: 30min → 10min ou 5min
   ```

3. **Reduzir dispositivos:**
   ```javascript
   IDs: "1,2,3,4" → "1,2" (apenas essenciais)
   ```

### 💾 Alto uso de memória

**Monitoramento:**
```
Chrome: F12 → Performance → Memory
Verificar crescimento constante de memória
```

**Soluções:**

1. **Limpeza automática:**
   ```javascript
   // Sistema limpa automaticamente dados antigos
   // Configuração: Histórico (minutos)
   ```

2. **Exportação regular:**
   ```
   Exportar dados a cada 1-2 horas
   Limpar dados após exportação
   ```

3. **Reinicialização periódica:**
   ```
   Recarregar página (F5) a cada 8-12 horas
   ```

### 🖥️ Travamento do navegador

**Recuperação:**

1. **Aguardar 30 segundos:**
   ```
   JavaScript pode estar processando
   ```

2. **Recarregar página:**
   ```
   F5 ou Ctrl+R
   ```

3. **Reiniciar navegador:**
   ```
   Fechar todas as abas
   Abrir nova instância
   ```

## Problemas de Exportação

### 📁 "Erro ao exportar dados"

**Verificações:**

1. **Dados existem:**
   ```
   Verificar se gravação foi iniciada
   Confirmar que há dados coletados
   ```

2. **Permissões de escrita:**
   ```
   Windows: Verificar pasta Downloads
   Linux: Verificar permissões do diretório
   ```

3. **Espaço em disco:**
   ```
   Verificar espaço disponível
   Arquivo CSV pode ser grande (>100MB)
   ```

### 💾 Download não funciona

**Fallback manual:**

1. **Copiar dados dos logs:**
   ```
   F12 → Console
   Copiar dados exibidos
   Colar em editor de texto
   ```

2. **Tentar navegador diferente:**
   ```
   Chrome → Edge
   Testar File System Access API
   ```

3. **Modo privado:**
   ```
   Testar em janela privada/incógnita
   ```

## Problemas de Hardware

### ⚡ Sensores não respondem

**Verificação de alimentação:**

1. **Tensão de entrada:**
   ```
   Multímetro: 24V DC ±10%
   Verificar polaridade
   ```

2. **Consumo de corrente:**
   ```
   Verificar especificações dos sensores
   Fonte com capacidade suficiente
   ```

### 🔌 Problemas de cabeamento

**RS485 - Verificação:**

1. **Identificação dos fios:**
   ```
   A+ (Data+): Geralmente verde/branco
   B- (Data-): Geralmente azul/amarelo
   GND: Preto/blindagem
   ```

2. **Continuidade:**
   ```
   Multímetro em modo continuidade
   Verificar conexões ponto a ponto
   ```

3. **Isolação:**
   ```
   Verificar resistência entre A+ e B-
   Deve ser alta (>1MΩ) quando desligado
   ```

### 🌡️ Leituras incorretas

**Calibração:**

1. **Verificar fatores de conversão:**
   ```javascript
   // Pressão: voltage * 40.0 - correction
   // Distância: voltage * 30.0
   // Temperatura: rawValue * 0.05
   ```

2. **Comparar com padrão:**
   ```
   Usar calibrador de pressão
   Régua para distância
   Termômetro de referência
   ```

## Logs de Diagnóstico

### 📋 Informações para Suporte

**Coletar antes de solicitar ajuda:**

1. **Versão do sistema:**
   ```
   Navegador: chrome://version/
   SO: Windows/Linux/macOS
   Versão da aplicação: v6.32
   ```

2. **Configuração atual:**
   ```
   IDs dos dispositivos: 1,2,3,4
   Baud rate: 38400
   Paridade: none
   Stop bits: 1
   ```

3. **Logs de erro:**
   ```
   F12 → Console
   Copiar mensagens de erro
   Seção Debug da interface
   ```

4. **Frames Modbus:**
   ```
   Dados enviados/recebidos (hex)
   Timestamps dos eventos
   ```

### 🔍 Comandos de Diagnóstico

**Windows:**
```cmd
# Listar portas COM
mode

# Device Manager
devmgmt.msc

# Verificar drivers
driverquery
```

**Linux:**
```bash
# Listar dispositivos USB
lsusb

# Verificar portas seriais
ls /dev/tty*

# Log do sistema
journalctl -f

# Permissões
ls -l /dev/ttyUSB0
```

**macOS:**
```bash
# Listar portas
ls /dev/cu.*

# Informações do sistema
system_profiler SPUSBDataType
```

## Prevenção de Problemas

### 🛡️ Melhores Práticas

1. **Verificação pré-operacional:**
   - [ ] Hardware conectado e alimentado
   - [ ] Navegador atualizado
   - [ ] Drivers instalados
   - [ ] Configurações verificadas

2. **Durante operação:**
   - [ ] Monitorar logs de debug
   - [ ] Exportar dados regularmente
   - [ ] Verificar indicadores de status

3. **Manutenção periódica:**
   - [ ] Limpar cache do navegador (semanal)
   - [ ] Verificar conexões físicas (mensal)
   - [ ] Atualizar drivers (conforme necessário)

### 📊 Monitoramento de Saúde

**Indicadores de problema:**
- ⚠️ Timeouts frequentes (>5% das leituras)
- ⚠️ CRC inválido (>1% dos frames)
- ⚠️ Uso de memória crescente constante
- ⚠️ Valores fora da faixa esperada

**Ações preventivas:**
- 📈 Exportar dados quando uso de memória > 50MB
- 🔄 Reiniciar comunicação se timeout > 10%
- 🧹 Limpar dados antigos automaticamente

---

## 📞 Suporte Técnico

**Antes de solicitar suporte:**
1. ✅ Seguir este guia de troubleshooting
2. ✅ Coletar logs de diagnóstico
3. ✅ Documentar configuração atual
4. ✅ Tentar reproduzir o problema

**Informações necessárias:**
- Versão do navegador e SO
- Configuração dos dispositivos
- Logs de erro completos
- Descrição detalhada do problema

**Contato:**
Instituto SENAI de Inovação

---

*Guia de Solução de Problemas - MicroSEAL v6.32*
