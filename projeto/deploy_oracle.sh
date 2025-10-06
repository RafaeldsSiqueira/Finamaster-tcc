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
