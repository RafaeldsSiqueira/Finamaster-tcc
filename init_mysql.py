#!/usr/bin/env python3
"""
Script para inicializar o banco de dados MySQL do FinanMaster
Cria o banco de dados, as tabelas e o usuário de demonstração
"""

import pymysql
from flask import Flask
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

# Configuração do MySQL
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_NAME = os.getenv('DB_NAME', 'finanmaster')

# Configurações do usuário demo
DEMO_USERNAME = 'demo'
DEMO_EMAIL = 'demo@finanmaster.com'
DEMO_PASSWORD = 'demo123'
DEMO_PASSWORD_HINT = 'Senha padrão do usuário de demonstração'

def create_database():
    """Cria o banco de dados se não existir"""
    try:
        # Conectar sem especificar o banco
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            charset='utf8mb4'
        )
        
        with conn.cursor() as cursor:
            # Criar banco de dados se não existir
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ Banco de dados '{DB_NAME}' criado/verificado com sucesso!")
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Erro ao criar banco de dados: {e}")
        return False

def create_tables():
    """Cria as tabelas usando Flask-SQLAlchemy"""
    from app import app, db, User, Transaction, Goal, Budget
    
    with app.app_context():
        try:
            db.create_all()
            print("✅ Tabelas criadas/verificadas com sucesso!")
            return True
        except Exception as e:
            print(f"❌ Erro ao criar tabelas: {e}")
            return False

def create_demo_user(force_recreate=False):
    """Cria o usuário de demonstração se não existir"""
    from app import app, db, User, Transaction, Goal, Budget
    
    with app.app_context():
        try:
            # Verificar se usuário demo já existe
            demo_user = User.query.filter_by(email=DEMO_EMAIL).first()
            
            if demo_user:
                print(f"ℹ️  Usuário de demonstração já existe: {DEMO_USERNAME}")
                print(f"   Email: {DEMO_EMAIL}")
                print(f"   ID: {demo_user.id}")
                # Verificar se precisa criar dados
                existing_count = Transaction.query.filter_by(user_id=demo_user.id).count()
                if existing_count == 0 or force_recreate:
                    if force_recreate and existing_count > 0:
                        print("   ⚠️  Modo FORCE ativado: dados serão recriados.")
                    print("   ℹ️  Criando dados de demonstração...")
                    create_demo_data(demo_user.id, force_recreate)
                else:
                    print(f"   ℹ️  Usuário já possui {existing_count} transações cadastradas.")
                    print("   💡 Use 'python init_mysql.py --force' para recriar os dados.")
                return demo_user
            
            # Criar usuário demo
            demo_user = User(
                username=DEMO_USERNAME,
                email=DEMO_EMAIL,
                password_hint=DEMO_PASSWORD_HINT
            )
            demo_user.set_password(DEMO_PASSWORD)
            db.session.add(demo_user)
            db.session.commit()
            
            print(f"✅ Usuário de demonstração criado com sucesso!")
            print(f"   Username: {DEMO_USERNAME}")
            print(f"   Email: {DEMO_EMAIL}")
            print(f"   Password: {DEMO_PASSWORD}")
            print(f"   ID: {demo_user.id}")
            
            # Criar alguns dados de exemplo para o usuário demo
            create_demo_data(demo_user.id)
            
            return demo_user
            
        except Exception as e:
            print(f"❌ Erro ao criar usuário demo: {e}")
            db.session.rollback()
            return None

def create_demo_data(user_id: int, force_recreate=False):
    """Cria dados de exemplo para o usuário demo - 1 ano completo"""
    from app import app, db, Transaction, Goal, Budget
    import random
    
    with app.app_context():
        try:
            # Verificar se já existem dados para este usuário
            existing_transactions = Transaction.query.filter_by(user_id=user_id).count()
            if existing_transactions > 0 and not force_recreate:
                print("ℹ️  Dados de demonstração já existem para este usuário.")
                print("   💡 Use 'python init_mysql.py --force' para recriar os dados.")
                return
            
            if force_recreate and existing_transactions > 0:
                print("🗑️  Removendo dados existentes...")
                # Remover dados existentes
                Transaction.query.filter_by(user_id=user_id).delete()
                Goal.query.filter_by(user_id=user_id).delete()
                Budget.query.filter_by(user_id=user_id).delete()
                db.session.commit()
                print("✅ Dados antigos removidos.")
            
            now = datetime.now()
            current_year = now.year
            
            print("📊 Criando dados de 1 ano completo...")
            
            # Definir categorias e valores base
            receitas_base = [
                ('Salário', 8500.0),
                ('Freelance', 1200.0),
                ('Vendas Online', 500.0),
                ('Rendimentos', 300.0),
            ]
            
            despesas_base = [
                ('Supermercado', 'Alimentação', 450.0),
                ('Restaurante', 'Alimentação', 120.0),
                ('Almoço', 'Alimentação', 35.0),
                ('Combustível', 'Transporte', 200.0),
                ('Uber', 'Transporte', 50.0),
                ('Estacionamento', 'Transporte', 30.0),
                ('Aluguel', 'Moradia', 1200.0),
                ('Condomínio', 'Moradia', 350.0),
                ('Conta de Luz', 'Moradia', 150.0),
                ('Conta de Água', 'Moradia', 80.0),
                ('Netflix', 'Lazer', 39.90),
                ('Cinema', 'Lazer', 60.0),
                ('Livros', 'Lazer', 45.0),
                ('Farmácia', 'Saúde', 85.0),
                ('Consulta Médica', 'Saúde', 200.0),
                ('Plano de Saúde', 'Saúde', 450.0),
                ('Roupas', 'Vestuário', 300.0),
                ('Presentes', 'Outros', 150.0),
            ]
            
            # Criar transações para 12 meses completos
            sample_transactions = []
            
            # Criar lista de meses para popular
            months_to_populate = []
            for month_offset in range(12):
                target_year = now.year
                target_month = now.month - month_offset
                
                # Ajustar ano e mês se necessário
                while target_month <= 0:
                    target_month += 12
                    target_year -= 1
                
                months_to_populate.append((target_year, target_month))
            
            # Ordenar cronologicamente (mais antigo primeiro)
            months_to_populate.sort()
            
            print(f"📅 Gerando dados para {len(months_to_populate)} meses: {months_to_populate[0][1]}/{months_to_populate[0][0]} até {months_to_populate[-1][1]}/{months_to_populate[-1][0]}")
            
            for year, month in months_to_populate:
                # Calcular último dia do mês
                if month == 12:
                    next_month_first = datetime(year + 1, 1, 1)
                else:
                    next_month_first = datetime(year, month + 1, 1)
                last_day = (next_month_first - timedelta(days=1)).day
                
                # Receitas do mês (salário sempre no dia 5)
                salario_value = 8500.0 + random.uniform(-200, 200)
                sample_transactions.append(Transaction(
                    description='Salário',
                    value=round(salario_value, 2),
                    category='Salário',
                    type='Receita',
                    date=datetime(year, month, min(5, last_day)),
                    user_id=user_id
                ))
                
                # Freelance variado (70% dos meses)
                if random.random() > 0.3:
                    freelance_value = 800.0 + random.uniform(0, 800)
                    sample_transactions.append(Transaction(
                        description='Freelance',
                        value=round(freelance_value, 2),
                        category='Trabalho Extra',
                        type='Receita',
                        date=datetime(year, month, random.randint(10, min(25, last_day))),
                        user_id=user_id
                    ))
                
                # Vendas online (50% dos meses)
                if random.random() > 0.5:
                    sample_transactions.append(Transaction(
                        description='Vendas Online',
                        value=round(300.0 + random.uniform(0, 400), 2),
                        category='Vendas',
                        type='Receita',
                        date=datetime(year, month, random.randint(15, min(28, last_day))),
                        user_id=user_id
                    ))
                
                # Despesas variadas ao longo do mês (20-30 por mês)
                num_despesas = random.randint(20, 30)
                for _ in range(num_despesas):
                    desc, cat, base_value = random.choice(despesas_base)
                    # Variação sazonal leve
                    seasonal_factor = 1.0
                    if month in [11, 12]:  # Nov/Dez - fim de ano mais gastos
                        seasonal_factor = random.uniform(1.0, 1.3)
                    elif month in [6, 7]:  # Jun/Jul - férias
                        seasonal_factor = random.uniform(1.0, 1.2)
                    
                    value = base_value * random.uniform(0.7, 1.3) * seasonal_factor
                    day = random.randint(1, last_day)
                    sample_transactions.append(Transaction(
                        description=desc,
                        value=round(value, 2),
                        category=cat,
                        type='Despesa',
                        date=datetime(year, month, day),
                        user_id=user_id
                    ))
            
            # Adicionar transações recentes (últimos 7 dias do mês atual)
            current_month = now.month
            current_year = now.year
            for i in range(min(7, now.day)):
                desc, cat, base_value = random.choice(despesas_base)
                sample_transactions.append(Transaction(
                    description=desc,
                    value=round(base_value * random.uniform(0.8, 1.2), 2),
                    category=cat,
                    type='Despesa',
                    date=now - timedelta(days=i),
                    user_id=user_id
                ))
            
            for transaction in sample_transactions:
                db.session.add(transaction)
            
            # Commit transações primeiro para calcular gastos depois
            db.session.commit()
            print(f"✅ Criadas {len(sample_transactions)} transações distribuídas em 12 meses")
            
            # Criar metas de exemplo
            sample_goals = [
                Goal(
                    title='Viagem para Europa',
                    target=15000.0,
                    current=8500.0,
                    deadline=now + timedelta(days=300),
                    icon='fas fa-plane',
                    user_id=user_id
                ),
                Goal(
                    title='Entrada do Apartamento',
                    target=50000.0,
                    current=25000.0,
                    deadline=now + timedelta(days=500),
                    icon='fas fa-home',
                    user_id=user_id
                ),
                Goal(
                    title='Reserva de Emergência',
                    target=10000.0,
                    current=8000.0,
                    deadline=now + timedelta(days=60),
                    icon='fas fa-shield-alt',
                    user_id=user_id
                ),
                Goal(
                    title='Carro Novo',
                    target=35000.0,
                    current=12000.0,
                    deadline=now + timedelta(days=400),
                    icon='fas fa-car',
                    user_id=user_id
                ),
                Goal(
                    title='Pós-Graduação',
                    target=8000.0,
                    current=3200.0,
                    deadline=now + timedelta(days=180),
                    icon='fas fa-graduation-cap',
                    user_id=user_id
                ),
            ]
            
            for goal in sample_goals:
                db.session.add(goal)
            
            print(f"✅ Criadas {len(sample_goals)} metas")
            
            # Criar orçamentos para todos os 12 meses
            categories_budget = [
                ('Alimentação', 800.0),
                ('Transporte', 400.0),
                ('Moradia', 1200.0),
                ('Lazer', 300.0),
                ('Saúde', 200.0),
                ('Vestuário', 250.0),
                ('Outros', 200.0),
            ]
            
            sample_budgets = []
            
            # Usar os mesmos meses das transações
            for year, month in months_to_populate:
                for cat, base_budget in categories_budget:
                    # Calcular gastos reais desta categoria neste mês
                    month_start = datetime(year, month, 1)
                    if month == 12:
                        month_end = datetime(year + 1, 1, 1) - timedelta(days=1)
                    else:
                        month_end = datetime(year, month + 1, 1) - timedelta(days=1)
                    
                    # Buscar transações de despesa desta categoria no mês
                    spent_query = db.session.query(db.func.sum(Transaction.value)).filter(
                        Transaction.user_id == user_id,
                        Transaction.type == 'Despesa',
                        Transaction.category == cat,
                        Transaction.date >= month_start,
                        Transaction.date <= month_end
                    ).scalar() or 0.0
                    
                    # Orçamento com pequena variação
                    budget_value = base_budget + random.uniform(-50, 50)
                    
                    sample_budgets.append(Budget(
                        category=cat,
                        budget_amount=round(budget_value, 2),
                        spent_amount=round(float(spent_query), 2),
                        month=month,
                        year=year,
                        user_id=user_id
                    ))
            
            for budget in sample_budgets:
                db.session.add(budget)
            
            print(f"✅ Criados {len(sample_budgets)} orçamentos para todos os 12 meses (com gastos reais calculados)")
            
            db.session.commit()
            print("✅ Dados de demonstração criados com sucesso!")
            print(f"   📈 Total: {len(sample_transactions)} transações, {len(sample_goals)} metas, {len(sample_budgets)} orçamentos")
            print(f"   📅 Período: {months_to_populate[0][1]}/{months_to_populate[0][0]} até {months_to_populate[-1][1]}/{months_to_populate[-1][0]}")
            
        except Exception as e:
            print(f"❌ Erro ao criar dados demo: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()

def main():
    """Função principal"""
    import sys
    
    # Verificar se usuário quer forçar recriação de dados
    force_recreate = '--force' in sys.argv or '-f' in sys.argv
    
    print("🚀 Inicializando Banco de Dados MySQL - FinanMaster")
    print("=" * 60)
    print(f"Host: {DB_HOST}:{DB_PORT}")
    print(f"Banco: {DB_NAME}")
    print(f"Usuário MySQL: {DB_USER}")
    if force_recreate:
        print("⚠️  Modo FORCE: Dados existentes serão recriados")
    print("=" * 60)
    print()
    
    # Passo 1: Criar banco de dados
    if not create_database():
        print("\n❌ Falha na inicialização. Verifique as configurações do MySQL.")
        return False
    
    # Passo 2: Importar app e criar tabelas
    from app import app
    if not create_tables():
        print("\n❌ Falha ao criar tabelas.")
        return False
    
    # Passo 3: Criar usuário demo
    demo_user = create_demo_user(force_recreate)
    if not demo_user:
        print("\n❌ Falha ao criar usuário de demonstração.")
        return False
    
    print()
    print("=" * 60)
    print("🎉 Inicialização concluída com sucesso!")
    print("=" * 60)
    print("\n📋 Credenciais do Usuário de Demonstração:")
    print(f"   Email: {DEMO_EMAIL}")
    print(f"   Senha: {DEMO_PASSWORD}")
    print(f"   Username: {DEMO_USERNAME}")
    print("\n💡 Use essas credenciais para fazer login no sistema.")
    print()
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
