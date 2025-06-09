# Guia de Instalação Rápida - MicroSEAL

## Pré-requisitos

### 1. Navegador Compatível
- **Recomendado:** Google Chrome 88+ ou Microsoft Edge 88+
- **Alternativo:** Firefox 85+ (funcionalidade limitada)

### 2. Hardware
- Computador com porta USB
- Adaptador USB-Serial (se necessário)
- Dispositivos Modbus RTU

## Instalação em 3 Passos

### Passo 1: Download dos Arquivos
Certifique-se de ter todos os arquivos na mesma pasta:
```
microSealDataAcquisition/
├── index.html          ← Arquivo principal
├── script.js           ← Lógica da aplicação  
├── styles.css          ← Estilos visuais
├── logo.png           ← Logos (opcionais)
├── Logo2.png
└── Logo3.png
```

### Passo 2: Execução
1. **Clique duplo** no arquivo `index.html`
2. **OU** arraste o arquivo para o navegador
3. **OU** use `Ctrl+O` no navegador e selecione o arquivo

### Passo 3: Primeira Configuração
1. **Confirme** a gravação de logs (opcional)
2. **Configure** os IDs dos dispositivos (ex: 1,2,3,4)
3. **Clique** em "Conectar à Porta Serial"
4. **Selecione** a porta na janela do navegador

## Configuração Inicial

### IDs dos Dispositivos
- **1:** Sensor de Pressão P1
- **2:** Sensor de Pressão P2
- **3:** Sensor de Distância D1
- **4:** Sensor Temperatura/Umidade

### Parâmetros Padrão
- **Baud Rate:** 38400 bps
- **Paridade:** Nenhuma
- **Stop Bits:** 1
- **Intervalo:** 50ms

## Verificação da Instalação

✅ **Sucesso se:**
- Interface carrega sem erros
- Consegue conectar à porta serial
- Gráficos aparecem na tela
- Dados são exibidos em tempo real

❌ **Erro se:**
- Mensagem "Serial API não suportada"
- Não consegue selecionar porta
- Gráficos não aparecem

## Solução de Problemas Rápidos

### "Serial API não suportada"
➜ Use Chrome/Edge versão 88+

### "Erro ao abrir porta"
➜ Feche outros programas que usam a porta
➜ Verifique se o cabo está conectado

### "Nenhum dispositivo responde"
➜ Confirme os IDs dos dispositivos
➜ Teste diferentes baud rates

## Primeira Utilização

1. **Conectar** → Clique "Conectar à Porta Serial"
2. **Monitorar** → Dados aparecem automaticamente
3. **Gravar** → Clique "Iniciar Gravação"
4. **Exportar** → Clique "Exportar Dados (CSV)"

Para mais detalhes, consulte o `README.md` completo.
