from     import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sua_chave_secreta_aqui'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finanmaster.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Modelos do banco de dados
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    value = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # Receita ou Despesa
    date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    target = db.Column(db.Float, nullable=False)
    current = db.Column(db.Float, default=0)
    deadline = db.Column(db.DateTime, nullable=False)
    icon = db.Column(db.String(50), default='fas fa-bullseye')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    budget_amount = db.Column(db.Float, nullable=False)
    spent_amount = db.Column(db.Float, default=0)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Rotas principais
@app.route('/')
def dashboard():
    return render_template('index.html')

@app.route('/api/dashboard-data')
def get_dashboard_data():
    """Retorna dados para o dashboard"""
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    # Calcular totais do mês atual
    receitas = db.session.query(db.func.sum(Transaction.value)).filter(
        Transaction.type == 'Receita',
        db.func.extract('month', Transaction.date) == current_month,
        db.func.extract('year', Transaction.date) == current_year
    ).scalar() or 0
    
    despesas = db.session.query(db.func.sum(Transaction.value)).filter(
        Transaction.type == 'Despesa',
        db.func.extract('month', Transaction.date) == current_month,
        db.func.extract('year', Transaction.date) == current_year
    ).scalar() or 0
    
    saldo = receitas - despesas
    
    # Dados dos últimos 6 meses para gráfico
    months_data = []
    for i in range(6):
        date = datetime.now() - timedelta(days=30*i)
        month_receitas = db.session.query(db.func.sum(Transaction.value)).filter(
            Transaction.type == 'Receita',
            db.func.extract('month', Transaction.date) == date.month,
            db.func.extract('year', Transaction.date) == date.year
        ).scalar() or 0
        
        month_despesas = db.session.query(db.func.sum(Transaction.value)).filter(
            Transaction.type == 'Despesa',
            db.func.extract('month', Transaction.date) == date.month,
            db.func.extract('year', Transaction.date) == date.year
        ).scalar() or 0
        
        months_data.append({
            'month': date.strftime('%b'),
            'receitas': month_receitas,
            'despesas': month_despesas,
            'saldo': month_receitas - month_despesas
        })
    
    # Distribuição de despesas por categoria
    categorias_despesas = db.session.query(
        Transaction.category,
        db.func.sum(Transaction.value).label('total')
    ).filter(
        Transaction.type == 'Despesa',
        db.func.extract('month', Transaction.date) == current_month,
        db.func.extract('year', Transaction.date) == current_year
    ).group_by(Transaction.category).all()
    
    return jsonify({
        'saldo': saldo,
        'receitas': receitas,
        'despesas': despesas,
        'economia': saldo,
        'months_data': months_data,
        'categorias_despesas': [{'categoria': c[0], 'total': c[1]} for c in categorias_despesas]
    })

@app.route('/api/transactions')
def get_transactions():
    """Retorna lista de transações"""
    transactions = Transaction.query.order_by(Transaction.date.desc()).all()
    return jsonify([{
        'id': t.id,
        'description': t.description,
        'value': t.value,
        'category': t.category,
        'type': t.type,
        'date': t.date.strftime('%Y-%m-%d')
    } for t in transactions])

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Adiciona nova transação"""
    try:
        data = request.json
        transaction = Transaction(
            description=data['description'],
            value=float(data['value']),
            category=data['category'],
            type=data['type'],
            date=datetime.strptime(data['date'], '%Y-%m-%d')
        )
        db.session.add(transaction)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Transação adicionada com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Remove transação"""
    try:
        transaction = Transaction.query.get_or_404(transaction_id)
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Transação removida com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/goals')
def get_goals():
    """Retorna lista de metas"""
    goals = Goal.query.all()
    return jsonify([{
        'id': g.id,
        'title': g.title,
        'target': g.target,
        'current': g.current,
        'deadline': g.deadline.strftime('%Y-%m-%d'),
        'icon': g.icon,
        'progress': (g.current / g.target) * 100 if g.target > 0 else 0
    } for g in goals])

@app.route('/api/goals', methods=['POST'])
def add_goal():
    """Adiciona nova meta"""
    try:
        data = request.json
        goal = Goal(
            title=data['title'],
            target=float(data['target']),
            current=float(data.get('current', 0)),
            deadline=datetime.strptime(data['deadline'], '%Y-%m-%d'),
            icon=data.get('icon', 'fas fa-bullseye')
        )
        db.session.add(goal)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Meta adicionada com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/goals/<int:goal_id>', methods=['PUT'])
def update_goal_progress(goal_id):
    """Atualiza progresso da meta"""
    try:
        data = request.json
        goal = Goal.query.get_or_404(goal_id)
        goal.current = float(data['current'])
        db.session.commit()
        return jsonify({'success': True, 'message': 'Progresso atualizado com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/budget')
def get_budget():
    """Retorna dados do orçamento"""
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    budgets = Budget.query.filter(
        Budget.month == current_month,
        Budget.year == current_year
    ).all()
    
    # Calcular gastos reais por categoria
    categorias_gastos = db.session.query(
        Transaction.category,
        db.func.sum(Transaction.value).label('total')
    ).filter(
        Transaction.type == 'Despesa',
        db.func.extract('month', Transaction.date) == current_month,
        db.func.extract('year', Transaction.date) == current_year
    ).group_by(Transaction.category).all()
    
    gastos_dict = {c[0]: c[1] for c in categorias_gastos}
    
    return jsonify([{
        'category': b.category,
        'budget': b.budget_amount,
        'spent': gastos_dict.get(b.category, 0),
        'progress': (gastos_dict.get(b.category, 0) / b.budget_amount) * 100 if b.budget_amount > 0 else 0
    } for b in budgets])

@app.route('/api/budget', methods=['POST'])
def add_budget():
    """Adiciona novo orçamento"""
    try:
        data = request.json
        budget = Budget(
            category=data['category'],
            budget_amount=float(data['budget_amount']),
            month=datetime.now().month,
            year=datetime.now().year
        )
        db.session.add(budget)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Orçamento adicionado com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/reports/monthly')
def get_monthly_report():
    """Retorna relatório mensal"""
    current_year = datetime.now().year
    monthly_data = []
    
    for month in range(1, 13):
        receitas = db.session.query(db.func.sum(Transaction.value)).filter(
            Transaction.type == 'Receita',
            db.func.extract('month', Transaction.date) == month,
            db.func.extract('year', Transaction.date) == current_year
        ).scalar() or 0
        
        despesas = db.session.query(db.func.sum(Transaction.value)).filter(
            Transaction.type == 'Despesa',
            db.func.extract('month', Transaction.date) == month,
            db.func.extract('year', Transaction.date) == current_year
        ).scalar() or 0
        
        monthly_data.append({
            'month': datetime(2024, month, 1).strftime('%b'),
            'receitas': receitas,
            'despesas': despesas,
            'saldo': receitas - despesas
        })
    
    return jsonify(monthly_data)

# Função para popular dados de exemplo
def populate_sample_data():
    """Popula o banco com dados de exemplo"""
    if Transaction.query.count() == 0:
        sample_transactions = [
            Transaction(description='Salário', value=8500, category='Salário', type='Receita', date=datetime.now() - timedelta(days=5)),
            Transaction(description='Supermercado', value=450, category='Alimentação', type='Despesa', date=datetime.now() - timedelta(days=4)),
            Transaction(description='Combustível', value=200, category='Transporte', type='Despesa', date=datetime.now() - timedelta(days=3)),
            Transaction(description='Netflix', value=39.90, category='Lazer', type='Despesa', date=datetime.now() - timedelta(days=2)),
            Transaction(description='Freelance', value=1200, category='Trabalho Extra', type='Receita', date=datetime.now() - timedelta(days=1))
        ]
        
        for transaction in sample_transactions:
            db.session.add(transaction)
        
        db.session.commit()
    
    if Goal.query.count() == 0:
        sample_goals = [
            Goal(title='Viagem para Europa', target=15000, current=8500, deadline=datetime.now() + timedelta(days=300), icon='fas fa-plane'),
            Goal(title='Entrada do Apartamento', target=50000, current=25000, deadline=datetime.now() + timedelta(days=500), icon='fas fa-home'),
            Goal(title='Reserva de Emergência', target=10000, current=8000, deadline=datetime.now() + timedelta(days=60), icon='fas fa-shield-alt')
        ]
        
        for goal in sample_goals:
            db.session.add(goal)
        
        db.session.commit()
    
    if Budget.query.count() == 0:
        sample_budgets = [
            Budget(category='Alimentação', budget_amount=800, spent_amount=650, month=datetime.now().month, year=datetime.now().year),
            Budget(category='Transporte', budget_amount=400, spent_amount=320, month=datetime.now().month, year=datetime.now().year),
            Budget(category='Moradia', budget_amount=1200, spent_amount=1200, month=datetime.now().month, year=datetime.now().year),
            Budget(category='Lazer', budget_amount=300, spent_amount=150, month=datetime.now().month, year=datetime.now().year),
            Budget(category='Saúde', budget_amount=200, spent_amount=80, month=datetime.now().month, year=datetime.now().year)
        ]
        
        for budget in sample_budgets:
            db.session.add(budget)
        
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        populate_sample_data()
    
    app.run(debug=True, host='0.0.0.0', port=5001)
