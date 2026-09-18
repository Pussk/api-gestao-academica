# API de Gestão Acadêmica

Trabalho desenvolvido em Node.js com TypeScript. A API possui três CRUDs completos:

- alunos (`students`);
- cursos (`courses`);
- matrículas (`enrollments`).

Os dados são validados com Zod e salvos em um banco SQLite local.

## Tecnologias

- Node.js
- TypeScript
- Express
- Zod
- SQLite
- Supertest e Node Test Runner

## Como executar

É necessário ter o Node.js 22.5 ou mais recente.

```bash
npm install
npm run dev
```

A API ficará disponível em `http://localhost:3333`.

Para gerar a versão compilada e executá-la:

```bash
npm run build
npm start
```

Para rodar os testes:

```bash
npm test
```

## Endpoints

Cada recurso possui os cinco métodos pedidos no trabalho.

| Ação | Alunos | Cursos | Matrículas |
| --- | --- | --- | --- |
| Listar | `GET /students` | `GET /courses` | `GET /enrollments` |
| Buscar pelo id | `GET /students/:id` | `GET /courses/:id` | `GET /enrollments/:id` |
| Criar | `POST /students` | `POST /courses` | `POST /enrollments` |
| Atualizar | `PUT /students/:id` | `PUT /courses/:id` | `PUT /enrollments/:id` |
| Excluir | `DELETE /students/:id` | `DELETE /courses/:id` | `DELETE /enrollments/:id` |

## Exemplos de dados

### Criar aluno

```json
{
  "name": "Ana Souza",
  "email": "ana@example.com"
}
```

### Criar curso

```json
{
  "title": "Desenvolvimento Web",
  "workloadHours": 80
}
```

### Criar matrícula

```json
{
  "studentId": 1,
  "courseId": 1,
  "status": "active"
}
```

Os valores aceitos para `status` são `active`, `completed` e `cancelled`.

## Organização do projeto

```text
src/
  routes/          Rotas dos três CRUDs
  app.ts           Configuração do Express
  database.ts      Banco e criação das tabelas
  middlewares.ts   Validação e tratamento de erros
  schemas.ts       Schemas do Zod
  server.ts        Inicialização do servidor
tests/
  api.test.ts      Testes dos endpoints
```

## Sugestão para a apresentação

1. Explicar que o sistema controla alunos, cursos e as matrículas que ligam os dois.
2. Mostrar os schemas em `src/schemas.ts` e enviar um dado inválido para demonstrar o Zod.
3. Criar um aluno e um curso, depois cadastrar uma matrícula usando os ids retornados.
4. Demonstrar os métodos GET, PUT e DELETE no Postman ou Insomnia.
5. Rodar `npm test` para mostrar que os três CRUDs foram verificados automaticamente.
