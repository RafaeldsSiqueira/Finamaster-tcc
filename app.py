from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from sqlalchemy import inspect, text
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)  # Permite requisições cross-origin
app.config['SECRET_KEY'] = 'sua_chave_secreta_aqui'

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
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 280,
    'pool_size': 10,
    'max_overflow': 20,
}

db = SQLAlchemy(app)
# Identidade do usuário atual
@app.route('/api/me')
def whoami():
    if 'user_id' not in session:
        return jsonify({'authenticated': False})
    return jsonify({'authenticated': True, 'user_id': session['user_id'], 'username': session.get('username', '')})

# Configuração CORS adicional
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Modelos do banco de dados
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    password_hint = db.Column(db.String(255))

    # Relationships (lazy='dynamic' for query chaining)
    transactions = db.relationship('Transaction', backref='user', lazy='dynamic')
    goals = db.relationship('Goal', backref='user', lazy='dynamic')
    budgets = db.relationship('Budget', backref='user', lazy='dynamic')

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
class Transaction(db.Model):
    __tablename__ = 'transactions'
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4',
    }
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    value = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # Receita ou Despesa
    date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)

class Goal(db.Model):
    __tablename__ = 'goals'
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4',
    }
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    target = db.Column(db.Float, nullable=False)
    current = db.Column(db.Float, default=0)
    deadline = db.Column(db.DateTime, nullable=False)
    icon = db.Column(db.String(50), default='fas fa-bullseye')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)

class Budget(db.Model):
    __tablename__ = 'budgets'
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4',
    }
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    budget_amount = db.Column(db.Float, nullable=False)
    spent_amount = db.Column(db.Float, default=0)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)


def get_current_user_id() -> int | None:
    return session.get('user_id')



# Rotas principais
@app.route('/')
def landing():
    """Página inicial do FinanMaster"""
    return render_template('landing.html')

@app.route('/dashboard')
def dashboard():
    """Dashboard principal da aplicação (protegido)."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login')
def login():
    """Página de login"""
    return render_template('login.html')


# Autenticação
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json(force=True)
        username = (data.get('username') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        password_hint = (data.get('password_hint') or '').strip() or None

        if not username or not email or not password:
            return jsonify({'success': False, 'message': 'Preencha todos os campos.'}), 400

        # Verificar existência
        if User.query.filter((User.email == email) | (User.username == username)).first():
            return jsonify({'success': False, 'message': 'Usuário ou e-mail já cadastrado.'}), 409

        user = User(username=username, email=email, password_hint=password_hint)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Autologin após cadastro
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({'success': True, 'message': 'Cadastro realizado com sucesso.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json(force=True)
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()

        if not email or not password:
            return jsonify({'success': False, 'message': 'Informe e-mail e senha.'}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'success': False, 'message': 'Credenciais inválidas.'}), 401

        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({'success': True, 'message': 'Login realizado com sucesso.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.pop('user_id', None)
    session.pop('username', None)
    return jsonify({'success': True})


@app.route('/api/password-hint', methods=['POST'])
def get_password_hint():
    try:
        data = request.get_json(force=True)
        email = (data.get('email') or '').strip().lower()
        if not email:
            return jsonify({'success': False, 'message': 'Informe o e-mail.'}), 400
        user = User.query.filter_by(email=email).first()
        if not user or not user.password_hint:
            return jsonify({'success': False, 'message': 'Nenhuma dica cadastrada.'}), 404
        return jsonify({'success': True, 'hint': user.password_hint})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/dashboard-data')
def get_dashboard_data():
    """Retorna dados para o dashboard com tendências reais."""
    now = datetime.now()
    current_month = now.month
    current_year = now.year
    # mês anterior
    prev_ref = now.replace(day=1) - timedelta(days=1)
    prev_month = prev_ref.month
    prev_year = prev_ref.year
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'saldo': 0, 'receitas': 0, 'despesas': 0, 'economia': 0, 'months_data': [], 'categorias_despesas': [], 'trends': {}})

    def sum_by(month: int, year: int, tipo: str) -> float:
        return db.session.query(db.func.sum(Transaction.value)).filter(
            Transaction.type == tipo,
            db.func.extract('month', Transaction.date) == month,
            db.func.extract('year', Transaction.date) == year,
            Transaction.user_id == user_id
        ).scalar() or 0

    receitas = sum_by(current_month, current_year, 'Receita')
    despesas = sum_by(current_month, current_year, 'Despesa')
    saldo = receitas - despesas

    receitas_prev = sum_by(prev_month, prev_year, 'Receita')
    despesas_prev = sum_by(prev_month, prev_year, 'Despesa')
    saldo_prev = receitas_prev - despesas_prev

    def pct_change(curr: float, prev: float | None):
        if not prev:
            return None
        try:
            return round(((curr - prev) / prev) * 100, 1)
        except ZeroDivisionError:
            return None

    economia_pct = round((saldo / receitas) * 100, 1) if receitas > 0 else None

    # últimos 6 meses para gráfico
    months_data = []
    for i in range(6):
        date = datetime.now() - timedelta(days=30*i)
        m_rec = sum_by(date.month, date.year, 'Receita')
        m_des = sum_by(date.month, date.year, 'Despesa')
        months_data.append({
            'month': date.strftime('%b'),
            'receitas': m_rec,
            'despesas': m_des,
            'saldo': m_rec - m_des
        })

    categorias_despesas = db.session.query(
        Transaction.category,
        db.func.sum(Transaction.value).label('total')
    ).filter(
        Transaction.type == 'Despesa',
        db.func.extract('month', Transaction.date) == current_month,
        db.func.extract('year', Transaction.date) == current_year,
        Transaction.user_id == user_id
    ).group_by(Transaction.category).all()

    return jsonify({
        'saldo': saldo,
        'receitas': receitas,
        'despesas': despesas,
        'economia': saldo,
        'months_data': months_data,
        'categorias_despesas': [{'categoria': c[0], 'total': c[1]} for c in categorias_despesas],
        'trends': {
            'saldo': pct_change(saldo, saldo_prev),
            'receitas': pct_change(receitas, receitas_prev),
            'despesas': pct_change(despesas, despesas_prev),
            'economia': economia_pct
        }
    })

@app.route('/api/transactions')
def get_transactions():
    """Retorna lista de transações"""
    user_id = get_current_user_id()
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc()).all()
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
            date=datetime.strptime(data['date'], '%Y-%m-%d'),
            user_id=get_current_user_id()
        )
        db.session.add(transaction)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Transação adicionada com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Atualiza uma transação existente do usuário logado"""
    try:
        data = request.get_json(force=True)
        transaction = Transaction.query.filter_by(id=transaction_id, user_id=get_current_user_id()).first_or_404()

        if 'description' in data:
            transaction.description = str(data['description'])
        if 'value' in data:
            transaction.value = float(data['value'])
        if 'category' in data:
            transaction.category = str(data['category'])
        if 'type' in data:
            transaction.type = str(data['type'])
        if 'date' in data and data['date']:
            try:
                transaction.date = datetime.strptime(data['date'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'success': False, 'message': 'Data inválida. Use o formato YYYY-MM-DD.'}), 400

        db.session.commit()
        return jsonify({'success': True, 'message': 'Transação atualizada com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Remove transação"""
    try:
        transaction = Transaction.query.filter_by(id=transaction_id, user_id=get_current_user_id()).first_or_404()
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Transação removida com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/goals')
def get_goals():
    """Retorna lista de metas"""
    goals = Goal.query.filter_by(user_id=get_current_user_id()).all()
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
            icon=data.get('icon', 'fas fa-bullseye'),
            user_id=get_current_user_id()
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
        goal = Goal.query.filter_by(id=goal_id, user_id=get_current_user_id()).first_or_404()
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
    user_id = get_current_user_id()
    
    budgets = Budget.query.filter(
        Budget.month == current_month,
        Budget.year == current_year,
        Budget.user_id == user_id
    ).all()
    
    # Calcular gastos reais por categoria
    categorias_gastos = db.session.query(
        Transaction.category,
        db.func.sum(Transaction.value).label('total')
    ).filter(
        Transaction.type == 'Despesa',
        db.func.extract('month', Transaction.date) == current_month,
        db.func.extract('year', Transaction.date) == current_year,
        Transaction.user_id == user_id
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
            year=datetime.now().year,
            user_id=get_current_user_id()
        )
        db.session.add(budget)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Orçamento adicionado com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

# Editar orçamento do mês atual por categoria
@app.route('/api/budget', methods=['PUT'])
def edit_budget():
    """Atualiza o valor orçado de uma categoria no mês corrente para o usuário logado."""
    try:
        data = request.get_json(force=True)
        category = (data.get('category') or '').strip()
        new_amount = float(data.get('budget_amount'))

        if not category:
            return jsonify({'success': False, 'message': 'Categoria é obrigatória.'}), 400

        current_month = datetime.now().month
        current_year = datetime.now().year
        user_id = get_current_user_id()

        budget = Budget.query.filter_by(
            category=category,
            month=current_month,
            year=current_year,
            user_id=user_id
        ).first()

        if not budget:
            return jsonify({'success': False, 'message': 'Orçamento não encontrado para esta categoria.'}), 404

        budget.budget_amount = new_amount
        db.session.commit()
        return jsonify({'success': True, 'message': 'Orçamento atualizado.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/reports/monthly')
def get_monthly_report():
    """Retorna relatório mensal"""
    current_year = datetime.now().year
    user_id = get_current_user_id()
    monthly_data = []
    
    for month in range(1, 13):
        receitas = db.session.query(db.func.sum(Transaction.value)).filter(
            Transaction.type == 'Receita',
            db.func.extract('month', Transaction.date) == month,
            db.func.extract('year', Transaction.date) == current_year,
            Transaction.user_id == user_id
        ).scalar() or 0
        
        despesas = db.session.query(db.func.sum(Transaction.value)).filter(
            Transaction.type == 'Despesa',
            db.func.extract('month', Transaction.date) == month,
            db.func.extract('year', Transaction.date) == current_year,
            Transaction.user_id == user_id
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
    # Não popular dados globais; manter contas novas vazias.
    if False and Transaction.query.count() == 0:
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
    
    if False and Goal.query.count() == 0:
        sample_goals = [
            Goal(title='Viagem para Europa', target=15000, current=8500, deadline=datetime.now() + timedelta(days=300), icon='fas fa-plane'),
            Goal(title='Entrada do Apartamento', target=50000, current=25000, deadline=datetime.now() + timedelta(days=500), icon='fas fa-home'),
            Goal(title='Reserva de Emergência', target=10000, current=8000, deadline=datetime.now() + timedelta(days=60), icon='fas fa-shield-alt')
        ]
        
        for goal in sample_goals:
            db.session.add(goal)
        
        db.session.commit()
    
    if False and Budget.query.count() == 0:
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
    app.run(debug=True, host='0.0.0.0', port=5001)
