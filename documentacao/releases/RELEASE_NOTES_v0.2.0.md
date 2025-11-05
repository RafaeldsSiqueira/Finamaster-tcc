# FinanMaster v0.2.0 – App + MCP sincronizados por usuário, edição de orçamento e melhorias no chat

## Resumo
- Integração total App ↔ MCP por usuário (`user_id`).
- Edição de orçamento (modal + API `PUT /api/budget`).
- Chat mais legível e com comandos naturais de navegação.
- Gráficos/insights alinhados aos dados cadastrados do usuário.
- Correção de caminho do banco para evitar erros de abertura.

## Novidades
- `GET /api/me`: retorna `user_id`/`username` da sessão para o front.
- Orçamento:
  - Botão “Editar Orçamento”.
  - Modal de edição.
  - API `PUT /api/budget` para atualizar o valor orçado da categoria no mês atual.
- Chat/IA:
  - Bolha clara, ícone em cor de destaque.
  - Comandos naturais: “abrir transação/nova transação”, “abrir orçamento”, “abrir metas”, “ir para relatórios”, “dashboard”.
  - Ação `navigate_to_section` no front.

## Mudanças
- Sistema migrado para MySQL como banco de dados principal (substituindo SQLite).
- Front envia `user_id` ao MCP em:
  - `POST ${MCP_API_BASE}/ai/analyze`
  - `POST ${MCP_API_BASE}/reports/generate`
- MCP usa o mesmo MySQL e filtra por `user_id` em `/ai/analyze`, `/ai/chat` e `/reports/generate`.
- Insights rápidos exibem aviso “Sem dados no período…” quando listas vazias.
- Busca de transações em tempo real (campo de pesquisa e filtros).

## Correções
- Dashboard/relatórios refletem apenas os dados do usuário logado (escopo por `user_id`).
- Evita exibir percentuais quando não há base de comparação (trends).
- Elimina dados “fantasma” no chat e insights quando não há transações (mensagem de orientação + abrir modal).

## Passos de atualização
1. Banco de dados
   - Configure o MySQL seguindo `documentacao/MYSQL_SETUP.md`
   - Execute `python3 setup_mysql.py` para configurar a conexão
   - Execute `python3 init_mysql.py` para criar o banco e dados de demonstração
2. Dependências (em venv):
   source venv/bin/activate
   pip install -r requirements.txt
3. Variáveis/Portas
   - `MCP_API_BASE` deve apontar para o MCP (ex.: `http://localhost:8000`) com o mesmo esquema (http/https) do site.
4. Reinício
   # App
   nohup python app.py >/tmp/finanmaster.log 2>&1 &
   # MCP
   nohup python instance/mcp_server.py >/tmp/mcp.log 2>&1 &

## Checklist funcional
- Login → `/api/me` retorna `user_id`.
- Criar 1 receita e 1 despesa → Dashboard atualiza; chat/insights usam os mesmos valores.
- “Editar Orçamento” → altera o valor e reflete no gráfico e na lista de categorias.
- Chat: “abrir transação”, “abrir orçamento”, “abrir metas”, “ir para relatórios” navegam corretamente.

## Commits incluídos
- feat: integrar app+MCP por user_id, corrigir DB path, orçamento editável
- Arquivos alterados: `app.py`, `instance/mcp_server.py`, `static/script.js`, `static/style.css`, `templates/index.html`, `templates/login.html`, `templates/landing.html`.
