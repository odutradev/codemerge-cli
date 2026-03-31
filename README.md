# CodeMerge CLI

Utilitário de preparação de código e dados focado em IA. Mescla múltiplos arquivos em uma única saída otimizada para janelas de contexto de IA, com API HTTP para geração dinâmica de conteúdo.

## 📋 Índice

  - [Visão Geral](https://www.google.com/search?q=%23-vis%C3%A3o-geral)
  - [Instalação](https://www.google.com/search?q=%23-instala%C3%A7%C3%A3o)
  - [Início Rápido](https://www.google.com/search?q=%23-in%C3%ADcio-r%C3%A1pido)
  - [Comandos](https://www.google.com/search?q=%23-comandos)
  - [Configuração](https://www.google.com/search?q=%23%EF%B8%8F-configura%C3%A7%C3%A3o)
  - [Servidor HTTP & API](https://www.google.com/search?q=%23-servidor-http--api)
  - [Casos de Uso](https://www.google.com/search?q=%23-casos-de-uso)
  - [Recursos Adicionais](https://www.google.com/search?q=%23-recursos-adicionais)
  - [Licença](https://www.google.com/search?q=%23-licen%C3%A7a)
  - [Contribuindo](https://www.google.com/search?q=%23-contribuindo)

-----

## 🎯 Visão Geral

CodeMerge é uma ferramenta de linha de comando (CLI) que:

  - **Mescla** múltiplos arquivos de código em um único arquivo de texto estruturado
  - **Otimiza** a saída para ferramentas de IA (ChatGPT, Claude, etc.)
  - **Respeita** os padrões do `.gitignore` e regras de ignorar personalizadas
  - **Observa** alterações de arquivos e os regenera automaticamente
  - **Serve** conteúdo via API HTTP para acesso dinâmico
  - **Fornece** visualização da estrutura do projeto em JSON
  - **Permite** a mesclagem seletiva de arquivos via API
  - **Executa** comandos do sistema após atualizações de arquivos (hooks de Upsert) e na inicialização
  - **Gerencia** exclusões de arquivos e commits locais do git via API

Perfeito para:

  - Preparar bases de código para análise de IA
  - Gerar contexto para revisões de código
  - Criar snapshots de documentação
  - Compartilhar a estrutura do projeto com assistentes de IA
  - Construir ferramentas de desenvolvedor alimentadas por IA

-----

## 📦 Instalação

### Instalação Global (Recomendada)

```bash
npm install -g codemerge-cli
```

### Instalação Local no Projeto

```bash
npm install --save-dev codemerge-cli
```

### Requisitos

  - Node.js \>= 16.0.0

-----

## 🚀 Início Rápido

### 1\. Inicializar o Projeto

```bash
codemerge init

codemerge init ./meu-projeto

codemerge init --force
```

Isso cria:

  - `codemerge.json` - Arquivo de configuração
  - Atualiza o `.gitignore` - Adiciona o arquivo de saída

### 2\. Mesclar Arquivos

```bash
codemerge use

codemerge use ./src

codemerge use --output meu-codigo.txt

codemerge use --watch
```

### 3\. Iniciar Servidor HTTP

```bash
codemerge watch

codemerge watch --port 3000

codemerge watch --output api-codigo.txt --ignore "*.test.ts"
```

-----

## 🎮 Comandos

### `codemerge init`

Inicializa o CodeMerge em um projeto.

```bash
codemerge init [caminho] [opções]
```

**Argumentos:**

  - `caminho` - Diretório de destino (padrão: `.`)

**Opções:**

  - `-f, --force` - Sobrescrever a configuração existente

**O que faz:**

  - Cria o `codemerge.json` com configurações padrão
  - Detecta o nome do projeto a partir do `package.json`
  - Adiciona o arquivo de saída ao `.gitignore`
  - Configura padrões recomendados de ignorar

-----

### `codemerge use`

Mescla os arquivos de código em uma única saída.

```bash
codemerge use [caminho] [opções]
```

**Argumentos:**

  - `caminho` - Diretório de entrada para verificar (padrão: `.`)

**Opções:**

  - `-o, --output <caminho>` - Caminho de arquivo de saída personalizado
  - `-w, --watch` - Observar alterações de arquivos
  - `--ignore <padroes>` - Padrões adicionais para ignorar (separados por vírgula)
  - `--include <padroes>` - Padrões de inclusão (separados por vírgula)

-----

### `codemerge watch`

Inicia o servidor HTTP observando os arquivos.

```bash
codemerge watch [caminho] [opções]
```

**Argumentos:**

  - `caminho` - Diretório de entrada para verificar (padrão: `.`)

**Opções:**

  - `-o, --output <caminho>` - Caminho do arquivo de saída
  - `-p, --port <numero>` - Porta do servidor (padrão: `9876`)
  - `--ignore <padroes>` - Padrões adicionais para ignorar
  - `--include <padroes>` - Padrões de inclusão

**Endpoints do Servidor:**

  - `GET /health` - Status de integridade do servidor
  - `GET /content` - Conteúdo completo mesclado
  - `GET /structure` - Estrutura do projeto em JSON
  - `POST /selective-content` - Mesclar arquivos selecionados
  - `POST /upsert` - Criar/atualizar arquivos
  - `POST /delete-files` - Excluir arquivos específicos
  - `POST /commit` - Executar commit local do git
  - `POST /execute-commands` - Executar comandos arbitrários do sistema
  - `GET /command-output` - Obter saída do último comando pós-upsert executado

-----

### `codemerge help`

Exibe informações de ajuda.

```bash
codemerge help [comando]
```

-----

### `codemerge version`

Exibe informações da versão.

```bash
codemerge version
```

-----

## ⚙️ Configuração

### Arquivo de Configuração: `codemerge.json`

```json
{
  "projectName": "meu-projeto",
  "outputPath": "merged-output.txt",
  "port": 9876,
  "useGitignore": true,
  "onStartCommand": "npm run dev",
  "onStartCommandLogs": false,
  "onUpsertCommand": "npm run build",
  "ignorePatterns": [
    "node_modules*.log",
    "coverage*.ts",
    "***.tsx",
    "***.json",
    "***.log",
    "package-lock.json",
    "yarn.lock",
    ".env",
    "**/.DS_Store"
  ]
}
```

**Comandos de Ciclo de Vida:**

  - `onStartCommand`: Comando para executar automaticamente quando o servidor/observador do codemerge iniciar.
  - `onStartCommandLogs`: Flag booleana para exibir os logs do comando de inicialização no console.
  - `onUpsertCommand`: Comando shell para executar imediatamente após um POST bem-sucedido em `/upsert`.

### Padrões de Inclusão Padrão

```javascript
[
  '***.js',
  '***.jsx',
  '***.md'
]
```

### Alternativa: Configuração via `package.json`

Você também pode configurar no `package.json`:

```json
{
  "name": "meu-projeto",
  "codemergeConfig": {
    "outputPath": "ai-digest.txt",
    "onStartCommand": "npm start",
    "onUpsertCommand": "echo 'Upsert concluído'",
    "ignorePatterns": ["***.ts"]
  }
}
```

-----

## 🌐 Servidor HTTP & API

### Iniciando o Servidor

```bash
codemerge watch --port 9876
```

### Endpoints da API

#### 1\. Verificação de Integridade (Health Check)

**GET** `/health`

Verifica o status do servidor.

-----

#### 2\. Obter Conteúdo Mesclado

**GET** `/content`

Obtém o conteúdo completo mesclado de todos os arquivos.

-----

#### 3\. Obter Estrutura do Projeto

**GET** `/structure`

Obtém a estrutura do projeto como uma árvore JSON.

-----

#### 4\. Obter Conteúdo Seletivo

**POST** `/selective-content`

Mescla apenas arquivos/pastas selecionados.

-----

#### 5\. Inserir/Atualizar Arquivos (Upsert)

**POST** `/upsert`

Cria ou atualiza arquivos no projeto. Se `onUpsertCommand` estiver configurado, ele será executado após um upsert bem-sucedido.

-----

#### 6\. Excluir Arquivos

**POST** `/delete-files`

Exclui arquivos específicos do projeto.

**Corpo da Requisição:**

```json
{
  "basePath": "./",
  "files": [
    "src/arquivo-obsoleto.ts",
    "tests/teste-antigo.spec.ts"
  ]
}
```

**Resposta:**

```json
{
  "success": true,
  "filesProcessed": 2,
  "errors": [],
  "results": [
    {
      "path": "src/arquivo-obsoleto.ts",
      "success": true
    },
    {
      "path": "tests/teste-antigo.spec.ts",
      "success": true
    }
  ]
}
```

-----

#### 7\. Commit Local do Git

**POST** `/commit`

Executa um commit local do git para todas as alterações no diretório atual (`git add .` seguido de `git commit -m "tipo: mensagem"`).

**Corpo da Requisição:**

```json
{
  "basePath": "./",
  "type": "feat",
  "message": "adiciona novos endpoints dinâmicos para gerenciamento do servidor",
  "translate": false
}
```

*Nota: As propriedades `type` e `message` são explicitamente obrigatórias. A flag booleana `translate` é opcional.*

**Resposta:**

```json
{
  "success": true,
  "output": "[main 4c83b2a] feat: adiciona novos endpoints dinâmicos para gerenciamento do servidor\n 2 files changed, 45 insertions(+)",
  "error": null
}
```

-----

#### 8\. Executar Comandos

**POST** `/execute-commands`

Executa comandos arbitrários do sistema no diretório do projeto.

**Corpo da Requisição:**

```json
{
  "basePath": "./",
  "commandsToExecute": [
    "npm run lint",
    "npm test"
  ]
}
```

**Resposta:**

```json
{
  "success": true,
  "commandsProcessed": 2,
  "errors": [],
  "results": [
    {
      "command": "npm run lint",
      "success": true,
      "output": "..."
    },
    {
      "command": "npm test",
      "success": true,
      "output": "..."
    }
  ]
}
```

-----

#### 9\. Obter Saída de Comando

**GET** `/command-output`

Recupera o resultado (stdout/stderr) do último comando executado, acionado por uma operação de upsert. Requer que `onUpsertCommand` esteja definido na configuração.

-----

## 💡 Casos de Uso

### 1\. Análise de Código por IA

Prepare toda a sua base de código para análise de IA:

```bash
codemerge use --output para-ia.txt

cat para-ia.txt | pbcopy  # macOS
cat para-ia.txt | xclip   # Linux
```

### 2\. Contexto para Revisão de Código

Gere contexto para revisões de código:

```bash
codemerge use ./src --output contexto-revisao.txt --ignore "*.test.ts,*.spec.js"
```

### 3\. Geração de Documentação

Crie snapshots da documentação:

```bash
codemerge use --include "***.ts" --output snapshot-docs.txt
```

### 4\. Ferramentas de Desenvolvedor Baseadas em IA

Construa ferramentas que precisem de acesso dinâmico ao projeto:

```javascript
const structure = await fetch('http://localhost:9876/structure').then(r => r.json());
const selectedPaths = userSelection;
const content = await fetch('http://localhost:9876/selective-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ selectedPaths })
}).then(r => r.text());
await sendToAI(content);
```

### 5\. Atualizações Contínuas de Contexto

Modo de observação para atualizações em tempo real:

```bash
codemerge watch --port 3000

while true; do
  curl http://localhost:3000/content > mais-recente.txt
  sleep 5
done
```

-----

## 📚 Recursos Adicionais

  - **GitHub:** [github.com/odutradev/codemerge-cli](https://github.com/odutradev/codemerge-cli)
  - **Issues:** [Reportar bugs](https://github.com/odutradev/codemerge-cli/issues)
  - **NPM:** [npmjs.com/package/codemerge-cli](https://www.npmjs.com/package/codemerge-cli)

-----

## 📝 Licença

Licença MIT - sinta-se à vontade para usar em seus projetos\!

-----

## 🤝 Contribuindo

Contribuições são bem-vindas\! Por favor:

1.  Faça um fork do repositório
2.  Crie uma branch de funcionalidade
3.  Faça suas alterações
4.  Envie um pull request