# PI-4 Backend

Este é o backend do projeto **PI-4 DSM** (Projeto Interdisciplinar do curso de Desenvolvimento de Software Multiplataforma da Fatec), desenvolvido para gerenciar e armazenar dados de sensores de temperatura e umidade. Ele foi implementado utilizando **Node.js**, **Express**, **MongoDB** e documentado com **Swagger**.

---

## ✨ Funcionalidades

### Gerenciamento de Dados de Sensores
- Inserção de dados via API
- Consulta de dados armazenados
- Exclusão de dados específicos

### Conexão com MongoDB
- Armazena os dados de sensores em uma base de dados MongoDB

### Documentação da API
- Documentação interativa disponível em `/api-docs` utilizando Swagger

---

## 🛠 Tecnologias Utilizadas

- **Node.js**: Plataforma para execução do JavaScript no servidor  
- **Express**: Framework para criação de APIs REST  
- **MongoDB**: Banco de dados NoSQL para armazenamento dos dados  
- **Swagger**: Ferramenta para documentação da API  
- **CORS**: Middleware para permitir requisições de diferentes origens

---

## ▶️ Como Executar

### 1. Instale as dependências
```
npm install
```

### 2. Configure o MongoDB
Certifique-se de que o MongoDB está rodando localmente na porta padrão (`27017`).

### 3. Inicie o servidor
```
npm start
```

### 4. Acesse a API

- API disponível em:
  - Local: http://localhost:4000
  - VM Azure: http://172.174.21.128:4000
- Documentação Swagger:
  - Local: http://localhost:4000/api-docs
  - VM Azure: http://172.174.21.128:4000/api-docs 

---

## 📁 Estrutura de Pastas

```
PI-4-Backend/
├── index.js               # Arquivo principal do servidor
├── models/                # Modelos do MongoDB
├── swagger.json           # Configuração da documentação Swagger
└── ...
```

---

## 🔮 Futuras Integrações

- Conexão direta com o **Arduino** para receber dados em tempo real  
- Melhorias na **validação** e **autenticação** das requisições
