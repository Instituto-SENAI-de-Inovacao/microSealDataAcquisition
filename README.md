# MicroSEAL - Sistema de Aquisição de Dados

**Versão:** 6.32 (23 04 2025)  
**Desenvolvido por:** Instituto SENAI de Inovação

## 📚 Documentação Completa

Este projeto inclui documentação detalhada dividida em arquivos específicos:

### 📋 Documentação Principal
- **[README.md](README.md)** - Visão geral e documentação principal (este arquivo)
- **[INSTALACAO.md](INSTALACAO.md)** - Guia de instalação rápida (3 passos)
- **[OPERACAO.md](OPERACAO.md)** - Manual de operação detalhado
- **[ESPECIFICACOES.md](ESPECIFICACOES.md)** - Especificações técnicas completas
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Guia de solução de problemas

### 📊 Documentação Complementar
- **[RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md)** - Resumo executivo para gestão
- **[CHANGELOG.md](CHANGELOG.md)** - Histórico de versões e atualizações
- **[LICENCA.md](LICENCA.md)** - Informações de licenciamento
- **[CONTRIBUIR.md](CONTRIBUIR.md)** - Guia para desenvolvedores

## Índice

1. [Visão Geral](#visão-geral)
2. [Requisitos do Sistema](#requisitos-do-sistema)
3. [Instalação Rápida](#instalação-rápida)
4. [Configuração Inicial](#configuração-inicial)
5. [Manual de Operação](#manual-de-operação)
6. [Funcionalidades](#funcionalidades)
7. [Tipos de Sensores Suportados](#tipos-de-sensores-suportados)
8. [Exportação de Dados](#exportação-de-dados)
9. [Solução de Problemas](#solução-de-problemas)
10. [Especificações Técnicas](#especificações-técnicas)

## Visão Geral

O MicroSEAL é um sistema web de aquisição de dados em tempo real desenvolvido para monitoramento de sensores através de comunicação serial Modbus RTU. O sistema é capaz de:

- Monitorar múltiplos sensores simultaneamente
- Exibir dados em gráficos em tempo real
- Gravar e exportar dados históricos
- Controlar parâmetros de comunicação serial
- Gerenciar sessões de monitoramento

### Tipos de Dados Suportados

- **Pressão:** Sensores de pressão (P1, P2)
- **Distância:** Sensores de distância (D1)  
- **Temperatura:** Medição em °C e °F
- **Umidade:** Umidade relativa do ar (%RH)
- **Ponto de Orvalho:** Temperatura do ponto de orvalho

## Requisitos do Sistema

### Navegador Web
- **Recomendado:** Google Chrome 88+ ou Microsoft Edge 88+
- **Suporte:** Firefox 85+ (funcionalidade limitada da Serial API)
- **Requisito obrigatório:** Suporte à Web Serial API

### Sistema Operacional
- Windows 10/11
- macOS 10.15+
- Linux (distribuições modernas)

### Hardware
- Porta USB disponível
- Adaptador USB-Serial (se necessário)
- Dispositivos Modbus RTU compatíveis

### Conexão à Internet
- Necessária apenas para carregamento inicial das bibliotecas CDN
- Após carregamento, funciona offline

## Instalação

### Método 1: Execução Direta (Recomendado)

1. **Baixe os arquivos do projeto:**
   ```
   microSealDataAcquisition/
   ├── index.html
   ├── script.js
   ├── styles.css
   ├── logo.png
   ├── Logo2.png
   ├── Logo3.png
   └── main.js (opcional)
   ```

2. **Abra o arquivo `index.html` no navegador:**
   - Clique duplo no arquivo `index.html`, ou
   - Arraste o arquivo para o navegador, ou
   - Use `Ctrl+O` no navegador e selecione o arquivo

### Método 2: Servidor Local

1. **Instale um servidor HTTP local:**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (se tiver instalado)
   npx http-server
   ```

2. **Acesse no navegador:**
   ```
   http://localhost:8000
   ```

## Configuração Inicial

### 1. Configuração de Dispositivos

Na interface principal, configure os IDs dos dispositivos no campo **"IDs dos dispositivos"**:

```
Formato: 1,2,3,4
```

**IDs Padrão:**
- **1:** Sensor de Pressão P1
- **2:** Sensor de Pressão P2  
- **3:** Sensor de Distância D1
- **4:** Sensor de Temperatura/Umidade/Ponto de Orvalho

### 2. Parâmetros de Comunicação

**Configurações Padrão:**
- **Baud Rate:** 38400 bps
- **Data Bits:** 8
- **Paridade:** Nenhuma
- **Stop Bits:** 1
- **Intervalo de Leitura:** 50ms (20 amostras/segundo)

### 3. Configurações de Display

- **Histórico:** 30 minutos (padrão)
- **Amplitude Y:** 400 (para gráficos de pressão)

## Manual de Operação

### Inicialização do Sistema

1. **Abra a aplicação** no navegador compatível
2. **Confirme a gravação de logs** (opcional)
3. **Configure os IDs dos dispositivos** desejados
4. **Clique em "Conectar à Porta Serial"**
5. **Selecione a porta** na janela do navegador
6. **Aguarde a confirmação** de conexão bem-sucedida

### Controles Principais

#### Botões de Controle

| Botão | Função | Estado Inicial |
|-------|--------|---------------|
| **Conectar à Porta Serial** | Estabelece conexão com dispositivos | Habilitado |
| **Parar/Iniciar Aquisições** | Controla coleta de dados | Desabilitado |
| **Enviar Leitura (manual)** | Leitura única manual | Desabilitado |
| **Iniciar/Parar Gravação** | Controla gravação de dados | Desabilitado |
| **Exportar Dados (CSV)** | Exporta dados gravados | Sempre habilitado |
| **Limpar Dados** | Remove todos os dados | Sempre habilitado |
| **Sair do Programa** | Encerra aplicação | Sempre habilitado |

#### Indicadores Visuais

- **🔴 GRAVANDO:** Indica gravação ativa
- **Horímetro:** Tempo de sessão (canto inferior esquerdo)
- **Valores em tempo real:** Exibidos abaixo dos gráficos

### Operação Passo a Passo

#### 1. Conexão Inicial

```
1. Configure IDs → 2. Conectar Porta → 3. Selecionar Dispositivo → 4. Confirmar Conexão
```

#### 2. Monitoramento em Tempo Real

```
1. Dados coletados automaticamente → 2. Gráficos atualizados → 3. Valores exibidos
```

#### 3. Gravação de Dados

```
1. Clicar "Iniciar Gravação" → 2. Dados salvos em memória → 3. "Parar Gravação" → 4. Exportar
```

## Funcionalidades

### Visualização de Dados

#### Gráficos em Tempo Real

1. **Gráfico Unificado (Principal):**
   - Pressão P1 e P2 (escala esquerda)
   - Distância D1 (escala direita)
   - Atualização contínua

2. **Gráficos Ambientais** (se dispositivo 4 ativo):
   - Temperatura (°C)
   - Umidade (%RH)  
   - Ponto de Orvalho (°C)

#### Recursos dos Gráficos

- **Zoom:** Scroll do mouse sobre o gráfico
- **Pan:** Arrastar para mover visualização
- **Escala automática:** Ajuste dinâmico dos eixos Y
- **Histórico configurável:** 1-120 minutos

### Sistema de Logs

#### Tipos de Log

1. **Debug:** Mensagens de sistema e erros
2. **Comunicação:** Dados enviados/recebidos (hexadecimal)
3. **Operacional:** Eventos de início/parada

#### Gravação de Logs

- **Automática:** Se habilitada no início
- **Manual:** Controle via botão de gravação
- **Exportação:** Formato CSV com timestamp

### Exportação de Dados

#### Formatos Disponíveis

1. **CSV (Dados):**
   ```csv
   NL,Disp,Timestamp,VVal,Temp,Umid,PDOrv
   1,1,2025-04-23T10:30:00.000Z,25.50,N/A,N/A,N/A
   ```

2. **CSV (Logs):**
   ```csv
   timestamp,direction,message
   2025-04-23T10:30:00.000Z,ENVIO,"01 03 00 00 00 05 85 C6"
   ```

3. **HTML (Histórico):**
   - Tabelas formatadas por dispositivo
   - Timestamps localizados
   - Valores convertidos

#### Processo de Exportação

1. **Navegadores Modernos:** Seletor de arquivo nativo
2. **Fallback:** Download automático
3. **Nomenclatura:** Timestamp automático no nome

## Tipos de Sensores Suportados

### Sensores de Pressão (ID 1, 2)

**Especificações:**
- **Protocolo:** S15CUMQ
- **Conversão:** Voltage × 40.0 - Correção
- **Unidade:** bar
- **Correção P1:** 0.0 bar
- **Correção P2:** 6.0 bar

**Faixa de Medição:**
- **Tensão:** 0-5V
- **Pressão:** 0-200 bar (configurável)

### Sensor de Distância (ID 3)

**Especificações:**
- **Protocolo:** S15CUMQ
- **Conversão:** Voltage × 30.0
- **Unidade:** mm
- **Faixa:** 0-200 mm

### Sensor Ambiental (ID 4)

**Especificações:**
- **Protocolo:** S15STHMQ
- **Parâmetros:**
  - Umidade: 0-100 %RH (resolução 0.01%)
  - Temperatura: -40 a +85°C (resolução 0.05°C)
  - Ponto de Orvalho: Calculado automaticamente

**Dados Fornecidos:**
- Temperatura (°C e °F)
- Umidade relativa (%RH)
- Ponto de orvalho (°C e °F)

## Exportação de Dados

### Estrutura do CSV de Dados

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **NL** | Número da linha | 1, 2, 3... |
| **Disp** | ID do dispositivo | 1, 2, 3, 4 |
| **Timestamp** | ISO 8601 UTC | 2025-04-23T10:30:00.000Z |
| **VVal** | Valor convertido | 25.50 |
| **Temp** | Temperatura °C | 23.45 ou N/A |
| **Umid** | Umidade %RH | 65.20 ou N/A |
| **PDOrv** | Ponto de Orvalho °C | 15.30 ou N/A |

### Processo de Exportação

1. **Iniciar Gravação:** Dados salvos em memória
2. **Parar Gravação:** Prompt de exportação automática
3. **Exportação Manual:** Botão "Exportar Dados"
4. **Seleção de Local:** Navegador compatível permite escolha
5. **Download:** Arquivo baixado automaticamente

## Solução de Problemas

### Problemas de Conexão

#### "Erro ao abrir a porta"

**Causas possíveis:**
- Porta serial em uso por outro programa
- Driver não instalado
- Cabo desconectado

**Soluções:**
1. Feche outros programas que usam a porta
2. Verifique conexões físicas
3. Reinstale drivers do adaptador USB-Serial
4. Tente uma porta USB diferente

#### "Navegador não suporta Serial API"

**Soluções:**
1. Use Chrome/Edge versão 88+
2. Habilite flags experimentais:
   ```
   chrome://flags/#enable-experimental-web-platform-features
   ```
3. Acesse via HTTPS ou localhost

### Problemas de Comunicação

#### "Dispositivo X: nenhuma resposta"

**Verificações:**
1. **ID correto:** Confirme endereço Modbus
2. **Baud rate:** Teste diferentes velocidades
3. **Cabeamento:** Verifique A+, B-, GND
4. **Alimentação:** Confirme 24V nos sensores

#### "CRC inválido"

**Soluções:**
1. Verifique interferência eletromagnética
2. Reduza comprimento do cabo
3. Use cabo blindado
4. Ajuste terminação de linha

### Problemas de Performance

#### "Lentidão na atualização"

**Otimizações:**
1. Aumente intervalo de atualização (100ms+)
2. Reduza janela de histórico
3. Feche abas desnecessárias do navegador
4. Monitore uso de CPU

#### "Travamento do navegador"

**Soluções:**
1. Recarregue a página
2. Limpe cache do navegador
3. Reduza número de dispositivos
4. Verifique memória disponível

### Problemas de Dados

#### "Dados não salvam"

**Verificações:**
1. Gravação foi iniciada?
2. Dispositivos estão respondendo?
3. Espaço em disco disponível?
4. Permissões de escrita?

#### "Exportação falha"

**Soluções:**
1. Tente exportação manual
2. Verifique bloqueador de pop-ups
3. Use modo privado/incógnito
4. Teste em navegador diferente

## Especificações Técnicas

### Comunicação Modbus RTU

**Protocolo:**
- **Function Code:** 03 (Read Holding Registers)
- **Starting Address:** 0x0000
- **Quantity:** 5 registros
- **CRC-16:** Polinômio 0xA001

**Frame Structure:**
```
[Slave ID][Function][Address H][Address L][Quantity H][Quantity L][CRC L][CRC H]
```

**Exemplo (Dispositivo 1):**
```
01 03 00 00 00 05 85 C6
```

### Timeouts e Retries

- **Timeout de resposta:** 50ms
- **Máximo de tentativas:** 2
- **Intervalo entre tentativas:** 20ms
- **Mutex de porta:** Acesso exclusivo garantido

### Conversões de Dados

#### Pressão (bar)
```javascript
pressure = (voltage * 40.0) - correction
// P1: correction = 0.0
// P2: correction = 6.0
```

#### Distância (mm)
```javascript
distance = (voltage * 30.0) - 0.0
```

#### Temperatura (°C)
```javascript
temperatureC = rawValue * 0.05
```

#### Umidade (%RH)
```javascript
humidity = rawValue / 100
```

### Limites de Performance

- **Taxa máxima:** 20 amostras/segundo
- **Dispositivos simultâneos:** Até 10
- **Histórico máximo:** 120 minutos
- **Dados em memória:** ~100MB (aprox. 1M pontos)

### Compatibilidade de Navegadores

| Navegador | Versão Mínima | Status | Limitações |
|-----------|---------------|--------|------------|
| Chrome | 88+ | ✅ Completo | Nenhuma |
| Edge | 88+ | ✅ Completo | Nenhuma |
| Firefox | 85+ | ⚠️ Limitado | Serial API experimental |
| Safari | 14+ | ❌ Não suportado | Serial API indisponível |

### Segurança

- **Execução local:** Dados não saem do dispositivo
- **Sem servidor:** Processamento client-side
- **Logs opcionais:** Controle de privacidade
- **Confirmação de saída:** Prevenção de perda de dados

---

## Suporte e Contato

**Desenvolvedor:** Instituto SENAI de Inovação  
**Versão:** 6.32 (23 04 2025)

Para suporte técnico ou dúvidas sobre a operação do sistema, entre em contato com a equipe de desenvolvimento.

---

*Documentação atualizada em junho de 2025*
