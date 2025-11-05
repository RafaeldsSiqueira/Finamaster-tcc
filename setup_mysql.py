#!/usr/bin/env python3
"""
Script interativo para configurar MySQL no FinanMaster
- Cria/atualiza arquivo .env
- Testa conexão com MySQL
- Inicializa banco de dados e usuário demo
"""

import os
import sys
import getpass
from dotenv import load_dotenv

def try_connect(host, port, user, password=None):
    """Tenta conectar ao MySQL"""
    try:
        import pymysql
        conn = pymysql.connect(
            host=host,
            port=int(port),
            user=user,
            password=password or '',
            charset='utf8mb4'
        )
        conn.close()
        return True
    except Exception as e:
        return False

def update_env_file(key, value):
    """Atualiza uma variável no arquivo .env"""
    env_file = '.env'
    if not os.path.exists(env_file):
        print("❌ Arquivo .env não encontrado!")
        return False
    
    lines = []
    with open(env_file, 'r') as f:
        for line in f:
            if line.strip().startswith(key + '='):
                lines.append(f"{key}={value}\n")
            else:
                lines.append(line)
    
    with open(env_file, 'w') as f:
        f.writelines(lines)
    return True

def main():
    print("🚀 Configuração MySQL - FinanMaster")
    print("=" * 50)
    print()
    
    # Carregar .env se existir
    load_dotenv()
    
    host = os.getenv('DB_HOST', 'localhost')
    port = os.getenv('DB_PORT', '3306')
    user = os.getenv('DB_USER', 'root')
    db_name = os.getenv('DB_NAME', 'finanmaster')
    
    print(f"Configuração atual:")
    print(f"  Host: {host}:{port}")
    print(f"  Usuário: {user}")
    print(f"  Banco: {db_name}")
    print()
    
    # Tentar conectar sem senha primeiro
    print("🔍 Tentando conectar ao MySQL...")
    if try_connect(host, port, user, None):
        print("✅ Conexão bem-sucedida sem senha!")
        password = None
    else:
        print("⚠️  Conexão sem senha falhou. Precisa de senha.")
        print()
        
        # Pedir senha
        max_tries = 3
        for i in range(max_tries):
            try:
                password = getpass.getpass(f"Digite a senha do MySQL (tentativa {i+1}/{max_tries}): ")
                if try_connect(host, port, user, password):
                    print("✅ Conexão bem-sucedida com senha!")
                    # Atualizar .env
                    update_env_file('DB_PASSWORD', password)
                    print("✅ Senha salva no arquivo .env")
                    break
                else:
                    print(f"❌ Senha incorreta. Tentativas restantes: {max_tries - i - 1}")
                    if i == max_tries - 1:
                        print("\n❌ Não foi possível conectar ao MySQL.")
                        print("\nSoluções:")
                        print("1. Verifique se o MySQL está rodando: sudo systemctl status mysql")
                        print("2. Tente redefinir a senha:")
                        print("   sudo mysql -u root")
                        print("   ALTER USER 'root'@'localhost' IDENTIFIED BY 'nova_senha';")
                        print("   FLUSH PRIVILEGES;")
                        sys.exit(1)
            except KeyboardInterrupt:
                print("\n\nOperação cancelada pelo usuário.")
                sys.exit(1)
    
    print()
    print("🚀 Executando script de inicialização do banco...")
    print("=" * 50)
    print()
    
    # Executar init_mysql.py
    import subprocess
    result = subprocess.run([sys.executable, 'init_mysql.py'])
    
    if result.returncode == 0:
        print()
        print("=" * 50)
        print("✅ Configuração concluída com sucesso!")
        print("=" * 50)
        print()
        print("📋 Credenciais do Usuário Demo:")
        print("   Email: demo@finanmaster.com")
        print("   Senha: demo123")
        print()
        print("🚀 Para iniciar a aplicação:")
        print("   python3 app.py")
        print()
    else:
        print()
        print("❌ Erro durante a inicialização")
        sys.exit(1)

if __name__ == '__main__':
    main()
