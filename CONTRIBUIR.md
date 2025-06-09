# Guia de Contribuição - MicroSEAL

## Como Contribuir

### Pré-requisitos para Desenvolvimento

#### Ambiente de Desenvolvimento
- **Sistema:** Windows 10/11, macOS 10.15+, ou Linux
- **Navegador:** Chrome 88+ ou Edge 88+ (para testes)
- **Editor:** VS Code, Sublime Text, ou similar
- **Git:** Para controle de versão

#### Conhecimentos Técnicos
- **JavaScript ES2020+** - Linguagem principal
- **HTML5/CSS3** - Interface e estilos
- **Web APIs** - Serial API, Wake Lock, File System Access
- **Modbus RTU** - Protocolo de comunicação
- **Chart.js** - Biblioteca de gráficos

## Estrutura do Projeto

### Arquivos Principais
```
microSealDataAcquisition/
├── index.html              # Interface principal
├── script.js               # Lógica da aplicação (1071 linhas)
├── styles.css              # Estilos CSS
├── main.js                 # Módulo principal (opcional)
├── README.md              # Documentação principal
├── INSTALACAO.md          # Guia de instalação
├── OPERACAO.md            # Manual de operação
├── ESPECIFICACOES.md      # Especificações técnicas
├── TROUBLESHOOTING.md     # Solução de problemas
├── RESUMO_EXECUTIVO.md    # Resumo para gestão
├── CHANGELOG.md           # Histórico de versões
├── LICENCA.md             # Informações de licença
└── assets/
    ├── logo.png           # Logos do projeto
    ├── Logo2.png
    └── Logo3.png
```

### Módulos e Responsabilidades

#### script.js (Arquivo principal)
- **Comunicação Serial:** Web Serial API
- **Protocolo Modbus:** Implementação RTU
- **Gerenciamento de Dados:** Coleta e processamento
- **Interface Gráfica:** Chart.js integration
- **Exportação:** CSV, HTML
- **Logs:** Sistema de auditoria

## Padrões de Código

### JavaScript
```javascript
// Use strict mode
"use strict";

// Funções nomeadas com camelCase
function calculateCRC(buffer) {
  // Implementação...
}

// Constantes em UPPER_CASE
const MAX_RETRIES = 2;
const DEFAULT_TIMEOUT = 50;

// Async/await para operações assíncronas
async function readModbusResponse(reader, minBytes, timeout) {
  // Implementação...
}
```

### HTML
```html
<!-- Use elementos semânticos -->
<main id="content">
  <section id="controls">
    <!-- Controles da aplicação -->
  </section>
  <section id="charts">
    <!-- Área dos gráficos -->
  </section>
</main>
```

### CSS
```css
/* Use classes semânticas */
.btn {
  /* Estilos para botões */
}

.chart-container {
  /* Container para gráficos */
}

/* Media queries para responsividade */
@media (max-width: 768px) {
  /* Estilos mobile */
}
```

## Processo de Desenvolvimento

### 1. Planejamento
- [ ] Identificar requisito ou bug
- [ ] Documentar problema/melhoria
- [ ] Verificar impacto na documentação
- [ ] Definir critérios de aceitação

### 2. Implementação
- [ ] Criar branch de desenvolvimento
- [ ] Implementar mudanças
- [ ] Seguir padrões de código
- [ ] Testar em navegadores suportados

### 3. Testes
```bash
# Teste manual básico
1. Abrir index.html no Chrome/Edge
2. Conectar dispositivo de teste
3. Verificar comunicação Modbus
4. Testar gravação e exportação
5. Validar logs de debug
```

### 4. Documentação
- [ ] Atualizar README.md se necessário
- [ ] Atualizar CHANGELOG.md
- [ ] Revisar ESPECIFICACOES.md
- [ ] Atualizar versão no código

## Diretrizes Específicas

### Comunicação Serial
```javascript
// Sempre use mutex para acesso à porta
await this.serialMutex.lock();
try {
  // Operações na porta serial
} finally {
  this.serialMutex.unlock();
}

// Validate CRC before processing data
if (calculateCRC(frame) !== receivedCRC) {
  console.error('CRC validation failed');
  return;
}
```

### Tratamento de Erros
```javascript
// Log detalhado de erros
try {
  await operacaoRiscosa();
} catch (error) {
  console.error('Erro específico:', error.message);
  if (loggingEnabled) {
    addLogEntry('ERROR', `Detalhes: ${error.stack}`);
  }
}
```

### Performance
```javascript
// Limite pontos nos gráficos
while (dataset.length > MAX_POINTS) {
  dataset.shift();
}

// Use requestAnimationFrame para atualizações
requestAnimationFrame(() => {
  updateCharts();
});
```

## Compatibilidade

### Navegadores Suportados
- **Chrome 88+** ✅ (Prioridade)
- **Edge 88+** ✅ (Prioridade)
- **Firefox 85+** ⚠️ (Limitado - Serial API experimental)
- **Safari** ❌ (Serial API não suportada)

### Testes Obrigatórios
```bash
# Checklist de compatibilidade
□ Chrome (Windows/Linux/macOS)
□ Edge (Windows)
□ Firefox (funcionalidade básica)
□ Dispositivos móveis (responsividade)
□ Diferentes resoluções de tela
```

## Boas Práticas

### Segurança
- Validar sempre dados recebidos via Serial
- Sanitizar entradas do usuário
- Não expor dados sensíveis em logs
- Confirmar ações destrutivas

### Usabilidade
- Feedback visual para todas as ações
- Estados de loading claramente indicados
- Mensagens de erro compreensíveis
- Confirmações para ações irreversíveis

### Manutenibilidade
- Código comentado em português
- Funções pequenas e específicas
- Separação clara de responsabilidades
- Logs estruturados para debugging

## Versionamento

### Esquema de Versões
- **X.Y** - Versão principal.secundária
- **Exemplo:** 6.32 = Versão 6, revisão 32

### Critérios para Nova Versão
- **Versão Principal (X):** Mudanças arquiteturais
- **Versão Secundária (Y):** Novas funcionalidades
- **Patch implícito:** Correções de bugs

## Suporte e Contato

### Canal de Comunicação
- **Responsável:** Instituto SENAI de Inovação
- **Documentação:** Consultar arquivos .md do projeto
- **Issues:** Reportar via canal interno

### Processo de Review
1. **Análise técnica** do código
2. **Testes funcionais** da mudança
3. **Validação da documentação**
4. **Aprovação** pela coordenação

---

*Guia atualizado em: Junho 2025*  
*Instituto SENAI de Inovação*
