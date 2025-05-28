# Projeto Interdisciplinar do 4°Semestre da Faculdade de Tecnologia de Franca Dr Thomaz Novelino

Este repositório contém um painel interativo desenvolvido com React para monitoramento de dados de sensores em tempo real. O projeto utiliza Redux para gerenciamento de estado, Recharts para visualização gráfica dos dados e suporte à persistência com redux-persist. A comunicação com sensores é feita via dispositivos Arduino com microcontrolador ESP32.

## 📁 Estrutura do Projeto:

- `src/components/`: Componentes reutilizáveis da interface
- `src/views/`: Telas principais do dashboard
- `src/redux/`: Store e slices do Redux
- `src/utils/`: Funções auxiliares
- `src/App.js`: Componente principal da aplicação
- `public/`: Arquivos estáticos

## 📦 Bibliotecas Utilizadas:

- `React / React DOM`: Base para construção da interface do dashboard
- `Redux Toolkit + React Redux`: Gerenciamento de estado global de forma simplificada
- `Redux Persist`: Salva o estado no localStorage, mantendo dados entre sessões
- `Recharts`: Exibição de gráficos interativos com dados dos sensores
- `React Transition Group`: Transições e animações nos componentes
- `simple-statistics`: Calculo de valores de média, moda, mediana, desvio padrão e assimetria

## ▶️ Como rodar o projeto:

### 1. Instale as dependências:

```bash
npm install
# ou
yarn install
```
### 2. Configure o .env

É importante ressaltar que o Back-End do projeto esteja rodando com o endereçamento correto do banco de dados, caso não tenha, por favor, execute primeiramente o Back-End antes de dar continuidade aos próximos pontos.

```bash
REACT_APP_DATA_URL = http://localhost:4000

```
### 3. Inicie a aplicação:

```bash
npm start
# ou
yarn start
```
## 🔌 Arduino Setup
Para integrar corretamente o Arduino ao projeto, utilize um dispositivo com as seguintes características:

- Sensor de temperatura e umidade DHT22 ou DHT11
- Microcontrolador com suporte integrado ESP32
- Cabo USB do tipo impressora (USB-B) para conectar o Arduino ao computador