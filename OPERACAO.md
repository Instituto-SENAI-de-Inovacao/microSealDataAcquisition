# Manual de Operação - MicroSEAL

## Procedimentos Operacionais

### 🚀 Inicialização do Sistema

#### 1. Preparação
- [ ] Verificar conexões físicas dos sensores
- [ ] Confirmar alimentação 24V dos dispositivos
- [ ] Cabos A+, B-, GND conectados corretamente
- [ ] Navegador Chrome/Edge aberto

#### 2. Configuração Inicial
- [ ] Abrir arquivo `index.html`
- [ ] Confirmar gravação de logs (se desejado)
- [ ] Inserir IDs dos dispositivos no campo respectivo
- [ ] Verificar parâmetros de comunicação

#### 3. Estabelecimento de Conexão
- [ ] Clicar "Conectar à Porta Serial"
- [ ] Selecionar porta correta na janela do navegador
- [ ] Aguardar mensagem de confirmação
- [ ] Verificar se gráficos aparecem

### 📊 Operação Normal

#### Interface Principal

```
┌─────────────────────────────────────────────────────────────┐
│ Aquisição de Dados – MicroSEAL vs 6.32                     │
├─────────────────────────────────────────────────────────────┤
│ [IDs: 1,2,3,4] [50ms] [30min] [400] [Conectar] [Parar]     │
│ [Leitura Manual] [Gravação] [Exportar] [Limpar] [Sair]     │
├─────────────────────────────────────────────────────────────┤
│ [Temp Chart] [Humidity Chart] [Dew Point Chart]             │
├─────────────────────────────────────────────────────────────┤
│              [Gráfico Principal - Pressão/Distância]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Estados dos Controles

| Controle | Estado Inicial | Após Conexão | Durante Gravação |
|----------|---------------|---------------|------------------|
| Conectar | ✅ Habilitado | ❌ Desabilitado | ❌ Desabilitado |
| Aquisições | ❌ Desabilitado | ✅ Habilitado | ❌ Desabilitado |
| Leitura Manual | ❌ Desabilitado | ✅ Habilitado | ✅ Habilitado |
| Gravação | ❌ Desabilitado | ✅ Habilitado | 🔴 Ativo |
| Exportar | ✅ Habilitado | ✅ Habilitado | ✅ Habilitado |

### 📝 Gravação de Dados

#### Processo de Gravação

1. **Iniciar Sessão:**
   ```
   Clicar "Iniciar Gravação"
   ↓
   Indicador 🔴 GRAVANDO aparece
   ↓
   Dados salvos em memória em tempo real
   ```

2. **Durante a Gravação:**
   - Aquisições continuam automaticamente
   - Botão muda para "Parar Gravação"
   - Contador de registros atualiza
   - Botão de aquisições fica desabilitado

3. **Finalizar Sessão:**
   ```
   Clicar "Parar Gravação"
   ↓
   Prompt: "Deseja exportar agora?"
   ↓
   [Sim] → Exportação automática
   [Não] → Dados ficam em memória
   ```

#### Indicadores de Status

- **🔴 GRAVANDO:** Gravação ativa
- **Horímetro:** Tempo de sessão (canto inferior esquerdo)
- **Valores em tempo real:** Abaixo dos gráficos

### 📈 Monitoramento em Tempo Real

#### Interpretação dos Gráficos

**Gráfico Principal (Unificado):**
- **Linha Azul/Vermelha:** Pressão P1/P2 (escala esquerda, bar)
- **Linha Verde:** Distância D1 (escala direita, mm)
- **Eixo X:** Tempo (últimos 30 minutos por padrão)

**Gráficos Ambientais** (se dispositivo 4 ativo):
- **Temperatura:** °C, escala automática ±5°C
- **Umidade:** %RH, escala 0-100%
- **Ponto de Orvalho:** °C, escala automática

#### Valores de Referência

| Parâmetro | Faixa Normal | Alarme |
|-----------|--------------|--------|
| Pressão P1 | 0-200 bar | > 200 bar |
| Pressão P2 | 0-200 bar | > 200 bar |
| Distância | 0-200 mm | < 0 ou > 200 mm |
| Temperatura | -10 a 50°C | < -10 ou > 50°C |
| Umidade | 20-80 %RH | < 20% ou > 80% |

### 🔧 Configurações Avançadas

#### Parâmetros de Comunicação

**Alteração de Baud Rate:**
1. Selecionar novo valor no dropdown
2. Configurar paridade e stop bits
3. Clicar "Aplicar Parâmetros"
4. Sistema reconecta automaticamente

**Valores Disponíveis:**
- **Baud Rate:** 9600, 38400 bps
- **Paridade:** Nenhuma, Par, Ímpar
- **Stop Bits:** 1, 2

#### Configurações de Display

**Intervalo de Atualização:**
- **50ms:** 20 amostras/segundo (padrão)
- **100ms:** 10 amostras/segundo
- **500ms:** 2 amostras/segundo
- **1000ms:** 1 amostra/segundo

**Janela de Histórico:**
- **Mínimo:** 1 minuto
- **Padrão:** 30 minutos
- **Máximo:** 120 minutos

**Amplitude Y (Pressão):**
- **Padrão:** 400 bar
- **Ajustável:** 0-1000 bar

### 📤 Exportação de Dados

#### Tipos de Exportação

**1. Dados de Sessão (CSV):**
- Contém todos os dados gravados
- Formato: NL, Disp, Timestamp, VVal, Temp, Umid, PDOrv
- Nome automático: `dados_exportados_YYYY-MM-DD-HH-MM-SS.csv`

**2. Logs de Comunicação (CSV):**
- Mensagens hexadecimais enviadas/recebidas
- Útil para diagnóstico
- Nome automático: `communication_log_YYYY-MM-DD-HH-MM-SS.csv`

**3. Histórico Visual (HTML):**
- Tabelas formatadas por dispositivo
- Visualização em navegador
- Nome automático: `historico_exportado_YYYY-MM-DD-HH-MM-SS.html`

#### Processo de Exportação

**Navegadores Modernos (Chrome/Edge):**
1. Clicar botão de exportação
2. Selecionar local e nome do arquivo
3. Confirmar salvamento

**Navegadores Antigos/Fallback:**
1. Clicar botão de exportação
2. Download automático na pasta de Downloads
3. Nome gerado automaticamente

### 🛠️ Operações de Manutenção

#### Limpeza de Dados

**Comando:** Botão "Limpar Dados"

**Efeito:**
- Remove todos os dados gravados da memória
- Limpa gráficos (resetar para vazio)
- Limpa logs de comunicação
- **Não afeta:** Configurações e conexão

**⚠️ Aviso:** Operação irreversível - dados não podem ser recuperados

#### Reset de Conexão

**Quando usar:**
- Dispositivos param de responder
- Mudança de configuração de hardware
- Troca de cabos ou adaptadores

**Procedimento:**
1. Clicar "Parar Aquisições"
2. Alterar parâmetros se necessário
3. Clicar "Aplicar Parâmetros"
4. Sistema reconecta automaticamente

#### Encerramento Seguro

**Comando:** Botão "Sair do Programa"

**Procedimento:**
1. Confirmação: "Deseja realmente encerrar?"
2. Se logs não exportados: "Exportar antes de sair?"
3. Sistema fecha porta serial
4. Mensagem: "Programa encerrado"

### 🚨 Situações de Emergência

#### Perda de Comunicação

**Sintomas:**
- Mensagens "nenhuma resposta válida"
- Gráficos param de atualizar
- Valores ficam estáticos

**Ações:**
1. Verificar conexões físicas
2. Testar diferentes baud rates
3. Reiniciar dispositivos (desligar/ligar)
4. Reconectar aplicação

#### Travamento do Sistema

**Sintomas:**
- Interface não responde
- Gráficos congelados
- Botões sem efeito

**Ações:**
1. Aguardar 30 segundos
2. Recarregar página (F5)
3. Reconectar porta serial
4. Reiniciar navegador se necessário

#### Perda de Dados Não Salvos

**Prevenção:**
- Exportar dados regularmente
- Usar gravação contínua para dados críticos
- Confirmar exportação antes de fechar

**Se ocorrer:**
- Dados em memória são perdidos permanentemente
- Verificar se exportação automática foi feita
- Reiniciar coleta de dados

### 📋 Checklist de Operação

#### Antes de Iniciar
- [ ] Hardware conectado e alimentado
- [ ] Navegador compatível aberto
- [ ] Arquivo index.html carregado
- [ ] IDs dos dispositivos configurados

#### Durante Operação
- [ ] Gráficos atualizando normalmente
- [ ] Valores dentro das faixas esperadas
- [ ] Indicador de gravação ativo (se necessário)
- [ ] Horímetro funcionando

#### Antes de Encerrar
- [ ] Dados importantes exportados
- [ ] Logs salvos (se necessário)
- [ ] Configurações anotadas para próxima sessão
- [ ] Encerramento seguro executado

### 📞 Suporte

Para dúvidas operacionais ou problemas técnicos:
- Consulte a seção "Solução de Problemas" no README.md
- Verifique logs de debug na interface
- Entre em contato com o Instituto SENAI de Inovação

---

*Manual de Operação - MicroSEAL v6.32*
