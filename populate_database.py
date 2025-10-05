#!/usr/bin/env python3
"""
Script para popular o banco de dados FinanMaster
"""

import sqlite3
from datetime import datetime, timedelta
import os

def create_database():
    """Cria o banco de dados e as tabelas"""
    
    # Caminho do banco
    db_path = "finanmaster.db"
    
    print(f"📦 Criando banco de dados: {db_path}")
    
    # Conectar ao banco
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Criar tabela de transações
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "transaction" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description VARCHAR(200) NOT NULL,
            value FLOAT NOT NULL,
            category VARCHAR(100) NOT NULL,
            type VARCHAR(20) NOT NULL,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Criar tabela de metas
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "goal" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(200) NOT NULL,
            target FLOAT NOT NULL,
            current FLOAT DEFAULT 0,
            deadline DATETIME NOT NULL,
            icon VARCHAR(50) DEFAULT 'fas fa-bullseye',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Criar tabela de orçamento
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "budget" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category VARCHAR(100) NOT NULL,
            budget_amount FLOAT NOT NULL,
            spent_amount FLOAT DEFAULT 0,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    print("✅ Tabelas criadas com sucesso!")
    
    return conn, cursor

def populate_sample_data(conn, cursor):
    """Popula o banco com dados de exemplo"""
    
    print("📊 Populando banco com dados de exemplo...")
    
    # Verificar se já existem dados
    cursor.execute("SELECT COUNT(*) FROM \"transaction\"")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print("⚠️ Banco já possui dados. Pulando população.")
        return
    
    # Dados de exemplo - Transações
    sample_transactions = [
        ('Salário', 8500.0, 'Salário', 'Receita', datetime.now() - timedelta(days=5)),
        ('Supermercado', 450.0, 'Alimentação', 'Despesa', datetime.now() - timedelta(days=4)),
        ('Combustível', 200.0, 'Transporte', 'Despesa', datetime.now() - timedelta(days=3)),
        ('Netflix', 39.90, 'Lazer', 'Despesa', datetime.now() - timedelta(days=2)),
        ('Freelance', 1200.0, 'Trabalho Extra', 'Receita', datetime.now() - timedelta(days=1)),
        ('Farmácia', 85.0, 'Saúde', 'Despesa', datetime.now() - timedelta(days=1)),
        ('Almoço', 35.0, 'Alimentação', 'Despesa', datetime.now()),
        ('Uber', 25.0, 'Transporte', 'Despesa', datetime.now())
    ]
    
    cursor.executemany("""
        INSERT INTO "transaction" (description, value, category, type, date)
        VALUES (?, ?, ?, ?, ?)
    """, sample_transactions)
    
    # Dados de exemplo - Metas
    sample_goals = [
        ('Viagem para Europa', 15000.0, 8500.0, datetime.now() + timedelta(days=300), 'fas fa-plane'),
        ('Entrada do Apartamento', 50000.0, 25000.0, datetime.now() + timedelta(days=500), 'fas fa-home'),
        ('Reserva de Emergência', 10000.0, 8000.0, datetime.now() + timedelta(days=60), 'fas fa-shield-alt')
    ]
    
    cursor.executemany("""
        INSERT INTO "goal" (title, target, current, deadline, icon)
        VALUES (?, ?, ?, ?, ?)
    """, sample_goals)
    
    # Dados de exemplo - Orçamento
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    sample_budgets = [
        ('Alimentação', 800.0, 650.0, current_month, current_year),
        ('Transporte', 400.0, 320.0, current_month, current_year),
        ('Moradia', 1200.0, 1200.0, current_month, current_year),
        ('Lazer', 300.0, 150.0, current_month, current_year),
        ('Saúde', 200.0, 80.0, current_month, current_year)
    ]
    
    cursor.executemany("""
        INSERT INTO "budget" (category, budget_amount, spent_amount, month, year)
        VALUES (?, ?, ?, ?, ?)
    """, sample_budgets)
    
    conn.commit()
    print("✅ Dados de exemplo inseridos com sucesso!")

def verify_data(conn, cursor):
    """Verifica se os dados foram inseridos corretamente"""
    
    print("\n🔍 Verificando dados inseridos...")
    
    # Contar registros
    cursor.execute("SELECT COUNT(*) FROM \"transaction\"")
    trans_count = cursor.fetchone()[0]
    print(f"📊 Transações: {trans_count}")
    
    cursor.execute("SELECT COUNT(*) FROM \"goal\"")
    goals_count = cursor.fetchone()[0]
    print(f"🎯 Metas: {goals_count}")
    
    cursor.execute("SELECT COUNT(*) FROM \"budget\"")
    budget_count = cursor.fetchone()[0]
    print(f"💰 Orçamentos: {budget_count}")
    
    # Mostrar algumas transações
    cursor.execute("SELECT description, value, category, type FROM \"transaction\" LIMIT 3")
    transactions = cursor.fetchall()
    print(f"\n📋 Primeiras transações:")
    for trans in transactions:
        print(f"   {trans[0]}: R$ {trans[1]} ({trans[3]}) - {trans[2]}")
    
    # Mostrar metas
    cursor.execute("SELECT title, target, current FROM \"goal\"")
    goals = cursor.fetchall()
    print(f"\n🎯 Metas:")
    for goal in goals:
        title, target, current = goal
        progress = (current / target) * 100 if target > 0 else 0
        print(f"   {title}: R$ {current} / R$ {target} ({progress:.1f}%)")

def main():
    """Função principal"""
    
    print("🚀 Populando Banco de Dados - FinanMaster")
    print("=" * 50)
    
    try:
        # Criar banco e tabelas
        conn, cursor = create_database()
        
        # Popular com dados de exemplo
        populate_sample_data(conn, cursor)
        
        # Verificar dados
        verify_data(conn, cursor)
        
        conn.close()
        
        print("\n" + "=" * 50)
        print("🎉 Banco de dados populado com sucesso!")
        print("💡 O MCP Server deve funcionar agora.")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
