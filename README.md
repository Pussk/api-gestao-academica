# Gestão Acadêmica · AV2

Aplicativo React Native com Expo e API Node.js em TypeScript, usando Express, SQLite, Zod e JWT.

| Cadastro | Relações |
| --- | --- |
| Alunos | Um aluno pode ter várias matrículas. |
| Professores | Um professor pode ser responsável por vários cursos. |
| Cursos | O curso pode ter um professor responsável e receber várias matrículas. |
| Matrículas | Cada matrícula liga um aluno a um curso. O par aluno e curso é único. |

Todos os cadastros permitem criar, listar, consultar, editar e excluir registros. Cursos e alunos com matrículas só podem ser excluídos após a remoção das matrículas correspondentes. Excluir um professor desvincula seus cursos.

## Como rodar no computador

Use o Node.js 24. Extraia o ZIP inteiro e abra um terminal na pasta `gestao-academica-av2`.

**Terminal 1 · API**

```bash
cd api
npm ci
npm run dev
```

**Terminal 2 · App**

```bash
cd mobile
npm ci
npm run web
```

Abra **http://localhost:8081** se o navegador não abrir sozinho. Se a porta 8081 estiver ocupada, libere-a ou ajuste `WEB_ORIGIN` na configuração da API para a origem exibida pelo Expo.

No primeiro acesso, escolha um e-mail e uma senha de pelo menos 8 caracteres. O app cria a conta de acesso e entra automaticamente. Nos próximos acessos, faça login com a mesma conta. A senha é armazenada com hash e salt. O token JWT é válido por duas horas e fica em memória enquanto o app estiver aberto.

## Como rodar no celular

1. Conecte o celular e o computador à mesma rede e instale uma versão do Expo Go compatível com o SDK 54. O projeto também roda no emulador Android. [Compatibilidade do Expo Go](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)
2. Em `api/`, copie `.env.example` para `.env`, altere `HOST` para `0.0.0.0` e reinicie a API. Faça a configuração da primeira conta antes de abrir a API na rede.
3. Em `mobile/`, copie `.env.example` para `.env`. Configure `EXPO_PUBLIC_API_URL` com o endereço IPv4 do computador e a porta 3333, por exemplo `http://192.168.1.20:3333`. No Windows, o comando `ipconfig` mostra o endereço IPv4.
4. Execute `npm start` dentro de `mobile/` e leia o QR Code. Para o emulador padrão do Android Studio, use `http://10.0.2.2:3333` e pressione **a** no terminal do Expo.

O modo local usa HTTP para a demonstração. A API escuta apenas no próprio computador por padrão. O SQLite cria `api/data/database.sqlite` automaticamente. Se você definir `JWT_SECRET`, use um segredo aleatório com pelo menos 32 caracteres. Sem esse ajuste, a API gera um segredo em memória e invalida as sessões quando reinicia.

## Rotas da API

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/` | Verificar se a API está online |
| GET | `/auth/setup` | Consultar se a conta inicial já foi criada |
| POST | `/auth/setup` | Criar a primeira conta com `email` e `password` |
| POST | `/auth/login` | Obter um JWT com `email` e `password` |
| GET, POST | `/students`, `/teachers`, `/courses`, `/enrollments` | Listar e criar |
| GET, PUT, DELETE | Cada recurso com `/:id` | Consultar, editar e excluir |

Envie `Authorization: Bearer <token>` nas chamadas aos quatro recursos. O middleware Zod valida os dados de entrada e os parâmetros de rota. Os valores de situação da matrícula são `active`, `completed` e `cancelled`.

## Roteiro de apresentação

1. Faça login e mostre as quatro abas.
2. Cadastre um professor e crie um curso selecionando esse professor.
3. Cadastre um aluno e crie uma matrícula selecionando o aluno e o curso.
4. Abra a matrícula, altere a situação para **Concluída** e confira o resultado na lista. Depois, exclua a matrícula.
5. Tente cadastrar um aluno com e-mail inválido para demonstrar o Zod. Mostre que a API retorna `401` ao acessar um cadastro sem o JWT.

Para rodar os testes de integração, execute `npm test` em `api/`. Para verificar os tipos do aplicativo, execute `npm run typecheck` em `mobile/`.
