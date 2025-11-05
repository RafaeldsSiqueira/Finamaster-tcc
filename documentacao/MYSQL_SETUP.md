# 🗄️ FinanMaster - Configuração MySQL

Este documento explica como configurar e usar o MySQL como banco de dados do FinanMaster.

## 📋 **Visão Geral**

O FinanMaster utiliza **MySQL** como banco de dados principal. O projeto foi migrado do SQLite para MySQL para oferecer melhor performance, escalabilidade e recursos avançados.

---

## 🚀 **Pré-requisitos**

### **Software Necessário:**

1. **MySQL Server 5.7+ ou MySQL 8.0+**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server -y
   
   # CentOS/RHEL
   sudo yum install mysql-server -y
   
   # macOS (via Homebrew)
   brew install mysql
   ```

2. **Python e dependências**
   ```bash
   pip install -r requirements.txt
   ```

### **Configurar MySQL:**

```bash
# Iniciar serviço MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Configurar segurança (primeira vez)
sudo mysql_secure_installation
```

---

## ⚙️ **Configuração Inicial**

### **1. Configurar MySQL (Opção Recomendada - Automática)**

Execute o script interativo que configura tudo automaticamente:

```bash
python3 setup_mysql.py
```

Este script irá:
- ✅ Criar o arquivo `.env` se não existir
- ✅ Solicitar a senha do MySQL interativamente
- ✅ Testar a conexão com MySQL
- ✅ Executar a inicialização do banco de dados automaticamente

### **1.1. Configuração Manual (Alternativa)**

Se preferir configurar manualmente:

**Criar arquivo `.env`:**
```bash
cp .env.example .env
```

**Editar o arquivo `.env` com suas credenciais:**
```env
# Configuração do Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=finanmaster

# Chave secreta para sessões Flask
SECRET_KEY=sua_chave_secreta_segura_aqui
```

### **2. Inicializar Banco de Dados**

Execute o script de inicialização que criará:
- ✅ Banco de dados `finanmaster`
- ✅ Todas as tabelas necessárias
- ✅ Usuário de demonstração

```bash
python3 init_mysql.py
```

> **💡 Dica**: Se você usou `setup_mysql.py`, esta etapa já foi feita automaticamente!

**Saída esperada:**
```
🚀 Inicializando Banco de Dados MySQL - FinanMaster
============================================================
Host: localhost:3306
Banco: finanmaster
Usuário MySQL: root
============================================================

✅ Banco de dados 'finanmaster' criado/verificado com sucesso!
✅ Tabelas criadas/verificadas com sucesso!
✅ Usuário de demonstração criado com sucesso!
   Username: demo
   Email: demo@finanmaster.com
   Password: demo123
   ID: 1
✅ Dados de demonstração criados com sucesso!

============================================================
🎉 Inicialização concluída com sucesso!
============================================================

📋 Credenciais do Usuário de Demonstração:
   Email: demo@finanmaster.com
   Senha: demo123
   Username: demo

💡 Use essas credenciais para fazer login no sistema.
```

---

## 👤 **Usuário de Demonstração**

O script de inicialização cria automaticamente um usuário de demonstração com dados de exemplo:

### **Credenciais:**
- **Email**: `demo@finanmaster.com`
- **Senha**: `demo123`
- **Username**: `demo`

### **Dados Incluídos:**
- ✅ 7 transações de exemplo (receitas e despesas)
- ✅ 3 metas financeiras
- ✅ 5 categorias de orçamento

### **Verificar Usuário Demo:**

Se você precisa verificar se o usuário demo está ativo:

```bash
# Conectar ao MySQL
mysql -u root -p

# Usar o banco finanmaster
USE finanmaster;

# Verificar usuário demo
SELECT id, username, email, created_at FROM users WHERE email = 'demo@finanmaster.com';

# Ver quantas transações o usuário tem
SELECT COUNT(*) FROM transactions WHERE user_id = (SELECT id FROM users WHERE email = 'demo@finanmaster.com');
```

---

## 📊 **Estrutura do Banco de Dados**

### **Tabelas Criadas:**

#### **1. users**
- Armazena informações dos usuários
- Campos: `id`, `username`, `email`, `password_hash`, `created_at`, `password_hint`

#### **2. transactions**
- Armazena transações financeiras
- Campos: `id`, `description`, `value`, `category`, `type`, `date`, `created_at`, `user_id`
- Engine: **InnoDB**
- Charset: **utf8mb4**

#### **3. goals**
- Armazena metas financeiras
- Campos: `id`, `title`, `target`, `current`, `deadline`, `icon`, `created_at`, `user_id`
- Engine: **InnoDB**
- Charset: **utf8mb4**

#### **4. budgets**
- Armazena orçamentos mensais
- Campos: `id`, `category`, `budget_amount`, `spent_amount`, `month`, `year`, `created_at`, `user_id`
- Engine: **InnoDB**
- Charset: **utf8mb4**

---

## 🔧 **Configuração no Código**

### **app.py**

O arquivo `app.py` está configurado para usar MySQL através de variáveis de ambiente:

```python
# Configuração do MySQL via variáveis de ambiente
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_NAME = os.getenv('DB_NAME', 'finanmaster')

mysql_uri = (
    f"mysql+pymysql://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)
app.config['SQLALCHEMY_DATABASE_URI'] = mysql_uri
```

### **Pool de Conexões**

O projeto utiliza pool de conexões para melhor performance:

```python
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 280,
    'pool_size': 10,
    'max_overflow': 20,
}
```

---

## 🚀 **Executando a Aplicação**

Após configurar o MySQL:

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Executar aplicação
python app.py
```

O sistema irá:
1. ✅ Conectar ao MySQL automaticamente
2. ✅ Criar tabelas se não existirem
3. ✅ Verificar/criar usuário demo se necessário

---

## 🔍 **Troubleshooting**

### **Erro: "Can't connect to MySQL server"**

**Solução:**
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Iniciar MySQL se estiver parado
sudo systemctl start mysql

# Verificar porta
sudo netstat -tlnp | grep 3306
```

### **Erro: "Access denied for user"**

**Solução:**
1. Verificar credenciais no arquivo `.env`
2. Testar conexão manual:
   ```bash
   mysql -u root -p
   ```
3. Verificar permissões do usuário:
   ```sql
   SHOW GRANTS FOR 'root'@'localhost';
   ```

### **Erro: "Unknown database 'finanmaster'"**

**Solução:**
```bash
# Executar script de inicialização
python init_mysql.py
```

### **Erro: "Table already exists"**

**Solução:**
Isso é normal se as tabelas já existem. O script verifica antes de criar.

### **Verificar Usuário Demo**

Para verificar se o usuário demo está ativo e funcionando:

```python
# No terminal Python (com app.py rodando):
python -c "
from app import app, db, User
with app.app_context():
    demo = User.query.filter_by(email='demo@finanmaster.com').first()
    if demo:
        print(f'✅ Usuário demo encontrado: {demo.username} (ID: {demo.id})')
    else:
        print('❌ Usuário demo não encontrado')
"
```

---

## 📦 **Migração de Dados**

> **Nota:** O FinanMaster utiliza **MySQL** como banco de dados principal. O sistema foi completamente migrado do SQLite para MySQL.

### **Se você tinha dados em SQLite (versões antigas):**

Se você estava usando uma versão antiga do projeto com SQLite e precisa migrar dados existentes:

### **Método Manual:**

1. **Exportar dados do SQLite:**
   ```bash
   sqlite3 instance/finanmaster.db .dump > backup.sql
   ```

2. **Adaptar queries para MySQL:**
   - Remover comandos SQLite específicos
   - Converter tipos de dados (TEXT → VARCHAR, INTEGER → INT, etc.)
   - Ajustar sintaxe de data/hora

3. **Importar no MySQL:**
   ```bash
   mysql -u root -p finanmaster < backup.sql
   ```

### **Recomendação:**

Para novos projetos ou instalações, **não é necessária migração**. Basta executar o `setup_mysql.py` e `init_mysql.py` conforme descrito nesta documentação.

---

## 🔐 **Segurança**

### **Boas Práticas:**

1. **Nunca commite o arquivo `.env`**
   - O `.gitignore` já está configurado para ignorar `.env`

2. **Use senhas fortes para o MySQL:**
   ```bash
   mysql -u root -p
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'senha_forte_aqui';
   ```

3. **Crie usuário específico para a aplicação:**
   ```sql
   CREATE USER 'finanmaster'@'localhost' IDENTIFIED BY 'senha_segura';
   GRANT ALL PRIVILEGES ON finanmaster.* TO 'finanmaster'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Configure firewall:**
   ```bash
   # Permitir apenas conexões locais (desenvolvimento)
   sudo ufw allow from 127.0.0.1 to any port 3306
   ```

---

## 📈 **Performance**

### **Otimizações Aplicadas:**

- ✅ **Pool de conexões**: Reutiliza conexões
- ✅ **Índices**: Criados nas chaves estrangeiras (`user_id`)
- ✅ **InnoDB**: Engine transacional com melhor performance
- ✅ **UTF8MB4**: Suporte completo a caracteres Unicode

### **Monitorar Performance:**

```sql
-- Ver conexões ativas
SHOW PROCESSLIST;

-- Ver status do banco
SHOW STATUS LIKE 'Connections';

-- Analisar queries lentas
SHOW VARIABLES LIKE 'slow_query_log';
```

---

## 🆘 **Comandos Úteis**

### **Gerenciamento do MySQL:**

```bash
# Iniciar MySQL
sudo systemctl start mysql

# Parar MySQL
sudo systemctl stop mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Status
sudo systemctl status mysql

# Conectar ao MySQL
mysql -u root -p

# Backup do banco
mysqldump -u root -p finanmaster > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u root -p finanmaster < backup_20240101.sql
```

### **Consultas Úteis:**

```sql
-- Listar todos os usuários
SELECT id, username, email, created_at FROM users;

-- Ver transações de um usuário
SELECT * FROM transactions WHERE user_id = 1 LIMIT 10;

-- Estatísticas do banco
SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.tables
WHERE table_schema = 'finanmaster'
ORDER BY (data_length + index_length) DESC;

-- Verificar usuário demo
SELECT u.id, u.username, u.email,
       COUNT(DISTINCT t.id) as transactions,
       COUNT(DISTINCT g.id) as goals,
       COUNT(DISTINCT b.id) as budgets
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
LEFT JOIN goals g ON u.id = g.user_id
LEFT JOIN budgets b ON u.id = b.user_id
WHERE u.email = 'demo@finanmaster.com'
GROUP BY u.id;
```

---

## ✅ **Checklist de Configuração**

- [ ] MySQL instalado e rodando
- [ ] Arquivo `.env` criado e configurado
- [ ] Script `init_mysql.py` executado com sucesso
- [ ] Banco de dados `finanmaster` criado
- [ ] Tabelas criadas
- [ ] Usuário demo criado e funcionando
- [ ] Aplicação conectando ao MySQL
- [ ] Login com usuário demo funcionando

---

## 📚 **Referências**

- [Documentação MySQL](https://dev.mysql.com/doc/)
- [SQLAlchemy com MySQL](https://docs.sqlalchemy.org/en/14/dialects/mysql.html)
- [PyMySQL](https://github.com/PyMySQL/PyMySQL)

---

## 💡 **Dicas**

1. **Para desenvolvimento local**: Use `localhost` como `DB_HOST`
2. **Para produção**: Configure um usuário específico com privilégios limitados
3. **Backup regular**: Configure backups automáticos do banco
4. **Monitoramento**: Use ferramentas como MySQL Workbench para monitorar o banco

---

**🎓 Configuração concluída! Seu FinanMaster está pronto para usar MySQL!**
