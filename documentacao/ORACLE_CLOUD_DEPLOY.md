# 🚀 Deploy FinanMaster na Oracle Cloud Free Tier

## 📋 Visão Geral

Este guia detalhado explica como fazer o deploy do **FinanMaster** na Oracle Cloud Free Tier, criando uma instância profissional para demonstração do TCC.

### **🎯 O que você ganha:**
- **Sistema em produção real**
- **URL pública para demonstração**
- **Performance profissional**
- **Custo ZERO** 💰
- **Sempre gratuito** (não expira)

---

## 🏗️ Passo 1: Criar Conta Oracle Cloud

### **1.1 Acessar Oracle Cloud**
```bash
# URL: https://www.oracle.com/cloud/free/
# Clique em "Start for free"
```

### **1.2 Dados Necessários**
- **Email**: Seu email principal
- **Nome**: Nome completo
- **Telefone**: Número válido
- **Cartão de Crédito**: Apenas para verificação (não será cobrado)

### **1.3 Verificação**
- Oracle enviará email de confirmação
- Pode demorar até 24h para aprovação
- Após aprovado, você terá acesso ao console

---

## 🌐 Passo 2: Configurar VCN (Virtual Cloud Network)

### **2.1 Acessar Console OCI**
```bash
# URL: https://cloud.oracle.com
# Faça login com sua conta
```

### **2.2 Criar VCN**
```bash
# Menu → Networking → Virtual Cloud Networks
# Clique em "Create VCN"
```

### **2.3 Configurações VCN**
```yaml
# Dados básicos:
Name: finanmaster-vcn
Compartment: (seu compartment)
CIDR Block: 10.0.0.0/16

# DNS:
DNS Label: finanmaster
DNS Resolution: Enabled
DNS Hostnames: Enabled
```

### **2.4 Subnet Pública**
```yaml
# Criar subnet pública:
Name: finanmaster-public-subnet
CIDR Block: 10.0.1.0/24
Availability Domain: AD-1
Subnet Access: Public Subnet
DNS Label: public
```

---

## 🔒 Passo 3: Configurar Security List (Firewall)

### **3.1 Acessar Security Lists**
```bash
# VCN criada → Security Lists
# Clique na security list padrão
```

### **3.2 Regras de Ingress (Entrada)**
```bash
# Clique em "Add Ingress Rules"
# Adicione as seguintes regras:

# Regra 1: SSH
Source: 0.0.0.0/0
Port: 22
Protocol: TCP
Description: SSH Access

# Regra 2: HTTP
Source: 0.0.0.0/0
Port: 80
Protocol: TCP
Description: HTTP Access

# Regra 3: HTTPS
Source: 0.0.0.0/0
Port: 443
Protocol: TCP
Description: HTTPS Access

# Regra 4: Flask App
Source: 0.0.0.0/0
Port: 5001
Protocol: TCP
Description: Flask Application

# Regra 5: FastAPI MCP
Source: 0.0.0.0/0
Port: 8000
Protocol: TCP
Description: FastAPI MCP Server
```

### **3.3 Regras de Egress (Saída)**
```bash
# Permitir todo tráfego de saída:
Destination: 0.0.0.0/0
Port: All
Protocol: All
Description: All outbound traffic
```

---

## 🖥️ Passo 4: Criar Instância Compute

### **4.1 Acessar Compute**
```bash
# Menu → Compute → Instances
# Clique em "Create Instance"
```

### **4.2 Configurações da Instância**
```yaml
# Dados básicos:
Name: finanmaster-server
Compartment: (seu compartment)

# Image:
Image: Canonical Ubuntu 22.04
Version: Latest

# Shape (Free Tier):
Shape: VM.Standard.A1.Flex
OCPU: 1
Memory: 6 GB

# Networking:
VCN: finanmaster-vcn
Subnet: finanmaster-public-subnet
Assign Public IP: Yes
```

### **4.3 SSH Key**
```bash
# Opção 1: Gerar nova chave
# Opção 2: Usar chave existente
# Salve a chave privada (.pem) em local seguro
```

### **4.4 Boot Volume**
```yaml
# Tamanho: 50 GB
# Performance: Balanced
# Encryption: Default
```

---

## 🔧 Passo 5: Configurar Instância

### **5.1 Conectar via SSH**
```bash
# No terminal local:
chmod 400 sua-chave.pem
ssh -i sua-chave.pem ubuntu@IP_PUBLICO_DA_INSTANCIA
```

### **5.2 Atualizar Sistema**
```bash
# Na instância:
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

### **5.3 Instalar Dependências**
```bash
# Python e ferramentas:
sudo apt install python3 python3-pip python3-venv -y

# Servidor web:
sudo apt install nginx -y

# Ferramentas úteis:
sudo apt install git curl wget htop -y

# Build tools (para algumas dependências):
sudo apt install build-essential python3-dev -y
```

---

## 📦 Passo 6: Deploy do FinanMaster

### **6.1 Clonar Projeto**
```bash
# Na instância:
cd /home/ubuntu
git clone https://github.com/seu-usuario/finanmaster-tcc.git
cd finanmaster-tcc
```

### **6.2 Configurar Ambiente Python**
```bash
# Criar ambiente virtual:
python3 -m venv venv
source venv/bin/activate

# Atualizar pip:
pip install --upgrade pip

# Instalar dependências:
pip install -r requirements.txt
```

### **6.3 Configurar MySQL**
```bash
# Instalar MySQL se necessário
sudo apt update
sudo apt install mysql-server -y

# Configurar MySQL
sudo mysql_secure_installation

# Executar setup MySQL
python3 setup_mysql.py

# Configurar permissões:
sudo chown ubuntu:ubuntu /home/ubuntu/finanmaster-tcc
chmod 755 /home/ubuntu/finanmaster-tcc
```

---

## 🌐 Passo 7: Configurar Nginx

### **7.1 Criar Configuração Nginx**
```bash
# Criar arquivo de configuração:
sudo nano /etc/nginx/sites-available/finanmaster
```

### **7.2 Conteúdo da Configuração**
```nginx
server {
    listen 80;
    server_name _;  # Aceita qualquer domínio
    
    # Proxy para Flask App
    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy para FastAPI MCP
    location /ai/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy para documentação MCP
    location /docs {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Logs
    access_log /var/log/nginx/finanmaster_access.log;
    error_log /var/log/nginx/finanmaster_error.log;
}
```

### **7.3 Ativar Configuração**
```bash
# Criar link simbólico:
sudo ln -s /etc/nginx/sites-available/finanmaster /etc/nginx/sites-enabled/

# Remover configuração padrão:
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração:
sudo nginx -t

# Reiniciar Nginx:
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## ⚙️ Passo 8: Configurar Systemd Service

### **8.1 Criar Service File**
```bash
# Criar arquivo de serviço:
sudo nano /etc/systemd/system/finanmaster.service
```

### **8.2 Conteúdo do Service**
```ini
[Unit]
Description=FinanMaster Application
After=network.target
Wants=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/finanmaster-tcc
Environment=PATH=/home/ubuntu/finanmaster-tcc/venv/bin
Environment=FLASK_ENV=production
ExecStart=/home/ubuntu/finanmaster-tcc/venv/bin/python app.py
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=finanmaster

[Install]
WantedBy=multi-user.target
```

### **8.3 Ativar Service**
```bash
# Recarregar systemd:
sudo systemctl daemon-reload

# Habilitar serviço:
sudo systemctl enable finanmaster

# Iniciar serviço:
sudo systemctl start finanmaster

# Verificar status:
sudo systemctl status finanmaster
```

---

## 🔐 Passo 9: Configurar SSL (Opcional)

### **9.1 Instalar Certbot**
```bash
# Instalar Certbot:
sudo apt install certbot python3-certbot-nginx -y
```

### **9.2 Obter Certificado SSL**
```bash
# Se tiver domínio:
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Se não tiver domínio, pode usar IP:
sudo certbot --nginx --agree-tos --email seu-email@exemplo.com -d IP_PUBLICO
```

### **9.3 Renovação Automática**
```bash
# Adicionar ao crontab:
sudo crontab -e

# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Passo 10: Configurar Monitoramento

### **10.1 Logs do Sistema**
```bash
# Ver logs do FinanMaster:
sudo journalctl -u finanmaster -f

# Ver logs do Nginx:
sudo tail -f /var/log/nginx/finanmaster_access.log
sudo tail -f /var/log/nginx/finanmaster_error.log
```

### **10.2 Monitoramento de Recursos**
```bash
# Instalar htop:
sudo apt install htop -y

# Monitorar recursos:
htop
```

### **10.3 Backup Automático**
```bash
# Criar script de backup:
nano /home/ubuntu/backup_finanmaster.sh
```

```bash
#!/bin/bash
# backup_finanmaster.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
DB_NAME="finanmaster"
DB_USER="root"
DB_PASSWORD=""  # Configurar conforme .env

# Carregar variáveis do .env se existir
if [ -f /home/ubuntu/finanmaster-tcc/.env ]; then
    source /home/ubuntu/finanmaster-tcc/.env
fi

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/finanmaster_$DATE.sql

# Backup do código
tar -czf $BACKUP_DIR/finanmaster_code_$DATE.tar.gz /home/ubuntu/finanmaster-tcc/

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup realizado: $DATE"
```

```bash
# Tornar executável:
chmod +x /home/ubuntu/backup_finanmaster.sh

# Adicionar ao crontab (backup diário às 2h):
crontab -e
# Adicionar: 0 2 * * * /home/ubuntu/backup_finanmaster.sh
```

---

## 🧪 Passo 11: Testes e Validação

### **11.1 Testes Locais**
```bash
# Na instância:
curl http://localhost:5001
curl http://localhost:8000
curl http://localhost:8000/docs
```

### **11.2 Testes Externos**
```bash
# Do seu computador:
curl http://IP_PUBLICO_DA_INSTANCIA
curl http://IP_PUBLICO_DA_INSTANCIA/ai/analyze
```

### **11.3 Testes de Funcionalidade**
```bash
# Acessar no navegador:
http://IP_PUBLICO_DA_INSTANCIA

# Testar:
- Dashboard carregando
- Adicionar transação
- Chat IA funcionando
- Relatórios gerando
```

---

## 📋 Checklist Final

### **✅ Configuração Oracle Cloud**
- [ ] Conta criada e verificada
- [ ] VCN configurada
- [ ] Security List configurada
- [ ] Instância criada

### **✅ Configuração Servidor**
- [ ] Sistema atualizado
- [ ] Dependências instaladas
- [ ] Projeto clonado
- [ ] Ambiente Python configurado

### **✅ Configuração Aplicação**
- [ ] Nginx configurado
- [ ] Systemd service ativo
- [ ] SSL configurado (opcional)
- [ ] Backup configurado

### **✅ Testes**
- [ ] Aplicação respondendo
- [ ] IA funcionando
- [ ] Banco de dados operacional
- [ ] Logs funcionando

---

## 🛠️ Comandos Úteis

### **Gerenciamento do Serviço**
```bash
# Parar serviço:
sudo systemctl stop finanmaster

# Iniciar serviço:
sudo systemctl start finanmaster

# Reiniciar serviço:
sudo systemctl restart finanmaster

# Ver status:
sudo systemctl status finanmaster

# Ver logs:
sudo journalctl -u finanmaster -f
```

### **Gerenciamento do Nginx**
```bash
# Reiniciar Nginx:
sudo systemctl restart nginx

# Testar configuração:
sudo nginx -t

# Ver logs:
sudo tail -f /var/log/nginx/finanmaster_access.log
```

### **Backup Manual**
```bash
# Backup do banco:
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > /home/ubuntu/backup_manual_$(date +%Y%m%d_%H%M%S).sql

# Backup completo:
tar -czf /home/ubuntu/backup_completo.tar.gz /home/ubuntu/finanmaster-tcc/
```

---

## 🎯 URLs de Acesso

Após o deploy, você terá acesso a:

- **🌐 Aplicação Principal**: `http://IP_PUBLICO_DA_INSTANCIA`
- **🤖 Chat IA**: `http://IP_PUBLICO_DA_INSTANCIA` (seção Assistente IA)
- **📊 Documentação MCP**: `http://IP_PUBLICO_DA_INSTANCIA/docs`
- **🔧 APIs Flask**: `http://IP_PUBLICO_DA_INSTANCIA/api/`
- **🚀 APIs FastAPI**: `http://IP_PUBLICO_DA_INSTANCIA/ai/`

---

## 💡 Dicas Importantes

### **Segurança**
- **Mude a porta SSH** (22) para uma porta não padrão
- **Use chaves SSH** em vez de senhas
- **Configure firewall** adicional se necessário
- **Mantenha o sistema atualizado**

### **Performance**
- **Monitore recursos** com `htop`
- **Configure swap** se necessário
- **Otimize Nginx** para melhor performance
- **Use CDN** para arquivos estáticos

### **Manutenção**
- **Backup regular** do banco de dados
- **Logs rotacionados** para não encher disco
- **Monitoramento** de uptime
- **Atualizações** de segurança

---

## 🎓 Benefícios para TCC

### **Demonstração Profissional**
- ✅ Sistema funcionando em produção real
- ✅ URL pública para banca avaliar
- ✅ Performance profissional
- ✅ Arquitetura enterprise

### **Portfolio**
- ✅ Projeto pode ser mantido após TCC
- ✅ Experiência com cloud computing
- ✅ Conhecimento de DevOps
- ✅ Sistema escalável

### **Custo Zero**
- ✅ Oracle Cloud Free Tier
- ✅ Sempre gratuito
- ✅ Sem limitações de tempo
- ✅ Recursos suficientes

---

## 🚀 Script de Deploy Automatizado

```bash
#!/bin/bash
# deploy_finanmaster_oracle.sh

echo "🚀 Deployando FinanMaster na Oracle Cloud..."

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install python3 python3-pip python3-venv nginx git curl wget htop build-essential python3-dev -y

# Clonar projeto
cd /home/ubuntu
git clone https://github.com/seu-usuario/finanmaster-tcc.git
cd finanmaster-tcc

# Configurar ambiente Python
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Configurar permissões
sudo chown ubuntu:ubuntu /home/ubuntu/finanmaster-tcc
chmod 755 /home/ubuntu/finanmaster-tcc

# Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/finanmaster
sudo ln -s /etc/nginx/sites-available/finanmaster /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configurar Systemd
sudo cp finanmaster.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable finanmaster
sudo systemctl start finanmaster

echo "✅ FinanMaster deployado com sucesso!"
echo "🌐 Acesse: http://$(curl -s ifconfig.me)"
```

---

**🎓 Seu FinanMaster estará rodando profissionalmente na Oracle Cloud!**

---

**Desenvolvido para o TCC FinanMaster**  
*Sistema de Gestão Financeira com Inteligência Artificial*
