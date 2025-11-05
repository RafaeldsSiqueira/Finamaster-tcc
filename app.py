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
    date = db.Column(db.DateTime, default=datetime.utcnow, index=True)  # Índice para ordenação rápida
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

    # Calcular totais do mês atual
    receitas = sum_by(current_month, current_year, 'Receita')
    despesas = sum_by(current_month, current_year, 'Despesa')
    
    # Se não há dados no mês atual, calcular totais de TODOS os dados
    # Isso garante que os cards sempre mostrem dados se existirem
    all_receitas = db.session.query(db.func.sum(Transaction.value)).filter(
        Transaction.type == 'Receita',
        Transaction.user_id == user_id
    ).scalar() or 0
    
    all_despesas = db.session.query(db.func.sum(Transaction.value)).filter(
        Transaction.type == 'Despesa',
        Transaction.user_id == user_id
    ).scalar() or 0
    
    # Usar dados do mês atual, ou se vazio, usar todos os dados
    if receitas == 0 and despesas == 0 and (all_receitas > 0 or all_despesas > 0):
        receitas = all_receitas
        despesas = all_despesas
    
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

    # CORREÇÃO: Calcular últimos 6 meses corretamente usando meses do calendário
    months_data = []
    for i in range(6):
        # Calcular data corretamente baseada em meses do calendário
        target_date = now.replace(day=1)
        if i > 0:
            # Subtrair i meses do calendário
            month = target_date.month - i
            year = target_date.year
            while month <= 0:
                month += 12
                year -= 1
            target_date = target_date.replace(year=year, month=month, day=1)
        
        m_rec = sum_by(target_date.month, target_date.year, 'Receita')
        m_des = sum_by(target_date.month, target_date.year, 'Despesa')
        months_data.append({
            'month': target_date.strftime('%b'),
            'receitas': m_rec,
            'despesas': m_des,
            'saldo': m_rec - m_des
        })
    
    # CORREÇÃO: Reverter para ordem cronológica (mais antigo primeiro)
    months_data = list(reversed(months_data))

    # Categorias de despesas - tentar mês atual primeiro
    categorias_despesas = db.session.query(
        Transaction.category,
        db.func.sum(Transaction.value).label('total')
    ).filter(
        Transaction.type == 'Despesa',
        db.func.extract('month', Transaction.date) == current_month,
        db.func.extract('year', Transaction.date) == current_year,
        Transaction.user_id == user_id
    ).group_by(Transaction.category).all()
    
    # Se não há categorias no mês atual, buscar todas as categorias
    if not categorias_despesas:
        categorias_despesas = db.session.query(
            Transaction.category,
            db.func.sum(Transaction.value).label('total')
        ).filter(
            Transaction.type == 'Despesa',
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
    """Retorna lista de transações com paginação opcional"""
    user_id = get_current_user_id()
    
    # Debug: verificar autenticação
    if not user_id:
        print(f"⚠️  GET /api/transactions: Usuário não autenticado. Sessão: {session}")
        return jsonify({'error': 'Usuário não autenticado', 'transactions': []}), 401
    
    # Parâmetros de paginação opcionais
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 100, type=int)  # Padrão: 100 por página
    per_page = min(per_page, 500)  # Máximo 500 por página para evitar sobrecarga
    
    # Query otimizada com paginação e índice
    # Usar índices: user_id (já indexado) e date (agora indexado)
    query = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc())
    
    # Se não especificou paginação, retornar todas (mas com limite de segurança)
    if page == 1 and per_page == 100:
        # Para melhor performance, limitar primeiro e só contar se necessário
        # Isso evita o COUNT completo quando há muitos registros
        transactions = query.limit(201).all()  # Pegar 201 para saber se há mais
        
        # Se retornou 201, significa que há mais registros
        if len(transactions) > 200:
            transactions = transactions[:200]  # Manter só 200
            print(f"✅ GET /api/transactions: Usuário {user_id} - {len(transactions)} transações retornadas (há mais disponíveis)")
        else:
            print(f"✅ GET /api/transactions: Usuário {user_id} - {len(transactions)} transações encontradas")
    else:
        # Paginação explícita
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        transactions = pagination.items
        total_count = pagination.total
        print(f"✅ GET /api/transactions: Usuário {user_id} - Página {page}: {len(transactions)} transações (de {total_count} total)")
    
    # Converter para JSON de forma otimizada
    result = [{
        'id': t.id,
        'description': t.description,
        'value': float(t.value),
        'category': t.category,
        'type': t.type,
        'date': t.date.strftime('%Y-%m-%d')
    } for t in transactions]
    
    return jsonify(result)

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
    
    # Buscar orçamentos do mês atual
    budgets = Budget.query.filter(
        Budget.month == current_month,
        Budget.year == current_year,
        Budget.user_id == user_id
    ).all()
    
    # Se não há orçamentos no mês atual, buscar os mais recentes de cada categoria
    if not budgets:
        # Buscar todos os orçamentos do usuário ordenados por data
        all_budgets = Budget.query.filter(
            Budget.user_id == user_id
        ).order_by(Budget.year.desc(), Budget.month.desc()).all()
        
        # Pegar apenas o orçamento mais recente de cada categoria
        seen_categories = set()
        budgets = []
        for budget in all_budgets:
            if budget.category not in seen_categories:
                budgets.append(budget)
                seen_categories.add(budget.category)
    
    if not budgets:
        return jsonify([])
    
    # Calcular gastos reais por categoria - tentar mês atual primeiro
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
    
    # Se não há gastos no mês atual, calcular totais gerais por categoria
    if not categorias_gastos:
        categorias_gastos = db.session.query(
            Transaction.category,
            db.func.sum(Transaction.value).label('total')
        ).filter(
            Transaction.type == 'Despesa',
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

@app.route('/api/reports/generate', methods=['POST'])
def generate_report():
    """Gera relatório financeiro completo"""
    try:
        data = request.get_json(force=True) or {}
        period = data.get('period', 'current_month')
        report_type = data.get('report_type', 'financial')
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({'error': 'Usuário não autenticado'}), 401
        
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        
        # Determinar período de análise
        if period == 'current_month':
            start_date = datetime(current_year, current_month, 1)
            end_date = now
        elif period == 'last_3_months':
            months_ago = now.replace(day=1)
            for _ in range(3):
                if months_ago.month == 1:
                    months_ago = months_ago.replace(year=months_ago.year - 1, month=12)
                else:
                    months_ago = months_ago.replace(month=months_ago.month - 1)
            start_date = months_ago
            end_date = now
        elif period == 'last_6_months':
            months_ago = now.replace(day=1)
            for _ in range(6):
                if months_ago.month == 1:
                    months_ago = months_ago.replace(year=months_ago.year - 1, month=12)
                else:
                    months_ago = months_ago.replace(month=months_ago.month - 1)
            start_date = months_ago
            end_date = now
        else:  # all_time
            start_date = datetime(2020, 1, 1)
            end_date = now
        
        # Buscar transações do período
        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).all()
        
        # Calcular resumo
        total_receitas = sum(t.value for t in transactions if t.type == 'Receita')
        total_despesas = sum(t.value for t in transactions if t.type == 'Despesa')
        saldo = total_receitas - total_despesas
        
        # Gastos por categoria
        despesas_por_categoria = {}
        for t in transactions:
            if t.type == 'Despesa':
                despesas_por_categoria[t.category] = despesas_por_categoria.get(t.category, 0) + t.value
        
        # Receitas por categoria
        receitas_por_categoria = {}
        for t in transactions:
            if t.type == 'Receita':
                receitas_por_categoria[t.category] = receitas_por_categoria.get(t.category, 0) + t.value
        
        # Gastos mensais (últimos 12 meses)
        gastos_mensais = {}
        for i in range(12):
            target_year = now.year
            target_month = now.month - i
            while target_month <= 0:
                target_month += 12
                target_year -= 1
            
            month_start = datetime(target_year, target_month, 1)
            if target_month == 12:
                month_end = datetime(target_year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = datetime(target_year, target_month + 1, 1) - timedelta(days=1)
            
            gastos_mes = db.session.query(db.func.sum(Transaction.value)).filter(
                Transaction.user_id == user_id,
                Transaction.type == 'Despesa',
                Transaction.date >= month_start,
                Transaction.date <= month_end
            ).scalar() or 0
            
            # Usar formato simples para melhor compatibilidade
            month_name = month_start.strftime('%b/%Y')
            gastos_mensais[month_name] = float(gastos_mes)
        
        # Ordenar meses cronologicamente
        def parse_month_key(key):
            try:
                return datetime.strptime(key, '%b/%Y')
            except:
                # Fallback para formato sem ano
                try:
                    return datetime.strptime(key, '%b')
                except:
                    return datetime.min
        
        sorted_months = sorted(gastos_mensais.items(), key=lambda x: parse_month_key(x[0]))
        gastos_mensais = dict(sorted_months)
        
        # Estrutura de resposta compatível com o frontend
        report_data = {
            'summary': {
                'total_receitas': float(total_receitas),
                'total_despesas': float(total_despesas),
                'saldo': float(saldo)
            },
            'by_category': {
                'despesas': {k: float(v) for k, v in sorted(despesas_por_categoria.items(), key=lambda x: x[1], reverse=True)},
                'receitas': {k: float(v) for k, v in receitas_por_categoria.items()}
            },
            'temporal': {
                'gastos_mensais': gastos_mensais
            },
            'transactions': [{
                'id': t.id,
                'description': t.description,
                'value': float(t.value),
                'category': t.category,
                'type': t.type,
                'date': t.date.isoformat()
            } for t in transactions[:100]]
        }
        
        # Insights
        insights = []
        if saldo > 0:
            insights.append("✅ Excelente! Você está com saldo positivo.")
        else:
            insights.append("⚠️ Atenção: Saldo negativo. Revise seus gastos.")
        
        if total_despesas > 0 and total_receitas > 0:
            porcentagem = (total_despesas / total_receitas) * 100
            if porcentagem > 90:
                insights.append("📊 Suas despesas representam mais de 90% das receitas.")
            elif porcentagem > 80:
                insights.append("📊 Suas despesas representam mais de 80% das receitas.")
        
        if despesas_por_categoria:
            maior_categoria = max(despesas_por_categoria.items(), key=lambda x: x[1])
            insights.append(f"💰 Maior categoria de despesa: {maior_categoria[0]} (R$ {maior_categoria[1]:,.2f})")
        
        return jsonify({
            'report_type': report_type,
            'period': period,
            'data': report_data,
            'insights': insights,
            'recommendations': [
                "💡 Considere revisar suas despesas mensais regularmente",
                "📊 Mantenha o registro regular de todas as transações"
            ],
            'generated_at': now.isoformat()
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/analyze', methods=['POST'])
def ai_analyze():
    """Endpoint de análise IA como fallback quando MCP não estiver disponível"""
    query = ''
    user_id = None
    try:
        data = request.get_json(force=True) or {}
        query = data.get('query', '').lower().strip()
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({'error': 'Usuário não autenticado'}), 401
        
        if not query:
            return jsonify({
                'response': 'Por favor, digite uma pergunta ou comando. Digite "ajuda" para ver os comandos disponíveis.',
                'actions': []
            })
        
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        # Filtrar transações do mês atual (mesmo período usado nos insights)
        month_start = datetime(current_year, current_month, 1)
        if current_month == 12:
            month_end = datetime(current_year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = datetime(current_year, current_month + 1, 1) - timedelta(days=1)
        
        # Buscar dados do usuário (mês atual, igual aos insights)
        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= month_start,
            Transaction.date <= month_end
        ).all()
        
        # Também buscar todas as transações para algumas análises que precisam de histórico
        all_transactions = Transaction.query.filter_by(user_id=user_id).all()
        
        goals = Goal.query.filter_by(user_id=user_id).all()
        budgets = Budget.query.filter(
            Budget.user_id == user_id,
            Budget.month == current_month,
            Budget.year == current_year
        ).all()
        
        # Calcular totais do mês atual (para consistência com insights)
        total_receitas = sum(t.value for t in transactions if t.type == 'Receita')
        total_despesas = sum(t.value for t in transactions if t.type == 'Despesa')
        saldo = total_receitas - total_despesas
        
        # Calcular totais gerais (todas as transações) para análises específicas
        total_receitas_geral = sum(t.value for t in all_transactions if t.type == 'Receita')
        total_despesas_geral = sum(t.value for t in all_transactions if t.type == 'Despesa')
        
        # Funções auxiliares para formatação de moeda
        def format_currency(value: float) -> str:
            """Formata valor monetário no padrão brasileiro (R$ X.XXX,XX)"""
            try:
                # Garantir que value seja um número
                if value is None:
                    value = 0.0
                value = float(value)
                # Formatar: R$ 1.234,56
                formatted = f"{value:,.2f}"
                # Trocar ponto por X temporariamente, vírgula por ponto, e X por vírgula
                formatted = formatted.replace(',', 'X').replace('.', ',').replace('X', '.')
                return f"R$ {formatted}"
            except (ValueError, TypeError):
                return "R$ 0,00"
        
        def get_period_sum(transactions_list: list, transaction_type: str, period_type: str) -> float:
            """
            Calcula a soma dos valores de transações de um tipo (Receita ou Despesa)
            para um período específico (daily, weekly, monthly, semester, yearly, total).
            """
            from datetime import timedelta
            
            if period_type == 'total':
                return sum(t.value for t in transactions_list if t.type == transaction_type)
            elif period_type == 'daily':
                today = now.date()
                return sum(t.value for t in transactions_list 
                          if t.type == transaction_type and t.date.date() == today)
            elif period_type == 'weekly':
                week_ago = now - timedelta(days=7)
                return sum(t.value for t in transactions_list 
                          if t.type == transaction_type and t.date >= week_ago)
            elif period_type == 'monthly':
                return sum(t.value for t in transactions_list 
                          if t.type == transaction_type 
                          and t.date.month == current_month 
                          and t.date.year == current_year)
            elif period_type == 'semester' or period_type == 'semiannual':
                # Últimos 6 meses
                six_months_ago = now.replace(day=1) - timedelta(days=180)
                return sum(t.value for t in transactions_list 
                          if t.type == transaction_type and t.date >= six_months_ago)
            elif period_type == 'yearly':
                return sum(t.value for t in transactions_list 
                          if t.type == transaction_type 
                          and t.date.year == current_year)
            return 0
        
        # Análise de palavras-chave e geração de resposta
        response_text = ""
        actions = []
        
        # Comando de ajuda - verificar PRIMEIRO (antes de tudo)
        if any(word in query for word in ['ajuda', 'help', 'comandos', 'comando', 'o que posso fazer', 'o que você faz', 'quais comandos', 'menu', 'opções']):
            response_text = """🤖 **Comandos disponíveis no FinanMaster:**

**📊 Consultas Financeiras:**
• "Saldo" ou "Meu saldo"
• "Gastos mensais" / "Gastos semestrais" / "Gastos anuais"
• "Receitas diárias" / "Receitas semanais" / "Receitas mensais"
• "Maiores gastos por categoria"
• "Buscar receitas cadastradas"

**📈 Análises:**
• "Comparar mês passado" / "Comparar períodos"
• "Tendências de gastos"
• "Economia mensal"
• "Categorias mais usadas"

**⚠️ Alertas:**
• "Orçamento próximo do limite"
• "Status das metas"
• "Transações recentes"

**🔧 Navegação:**
• "Abrir transações" / "Nova transação"
• "Ver orçamento" / "Ver metas"
• "Ir para relatórios"

**❓ Ajuda:**
• "Ajuda" ou "Comandos" - Lista todas as opções

Pergunte de forma natural e eu responderei! 💬"""
            actions = []
        
        # Navegação
        elif any(word in query for word in ['abrir transação', 'nova transação', 'adicionar transação', 'cadastrar transação']):
            response_text = "Posso abrir o formulário de nova transação para você agora."
            actions.append({
                'type': 'navigate_to_section',
                'data': {'section': 'transactions'}
            })
            # Pequeno delay para garantir navegação antes de abrir modal
            actions.append({
                'type': 'open_modal',
                'data': {'modal': 'add-transaction-modal'}
            })
        
        elif any(word in query for word in ['abrir orçamento', 'ver orçamento', 'meu orçamento']):
            response_text = "Abrindo a seção de orçamento para você."
            actions.append({
                'type': 'navigate_to_section',
                'data': {'section': 'budget'}
            })
        
        elif any(word in query for word in ['abrir metas', 'ver metas', 'minhas metas', 'objetivos']):
            response_text = "Abrindo a seção de metas financeiras."
            actions.append({
                'type': 'navigate_to_section',
                'data': {'section': 'goals'}
            })
        
        elif any(word in query for word in ['relatórios', 'relatório', 'ir para relatórios']):
            response_text = "Abrindo a seção de relatórios."
            actions.append({
                'type': 'navigate_to_section',
                'data': {'section': 'reports'}
            })
        
        elif any(word in query for word in ['dashboard', 'painel', 'início']):
            response_text = "Voltando para o dashboard principal."
            actions.append({
                'type': 'navigate_to_section',
                'data': {'section': 'dashboard'}
            })
        
        # Consultas de dados
        elif any(word in query for word in ['saldo', 'quanto tenho', 'meu saldo', 'saldo atual', 'dinheiro']):
            if not transactions:
                response_text = "🎯 📝 Você ainda não possui dados cadastrados neste período.\n\nPara começar a gerar insights:\n\n• Adicione sua primeira transação (Receita ou Despesa)\n• Defina um orçamento e metas financeiras\n\nPosso abrir o formulário de nova transação para você agora."
                actions.append({
                    'type': 'prompt_add_data'
                })
            else:
                response_text = f"💰 Seu saldo atual é R$ {saldo:,.2f}.\n\n"
                response_text += f"📊 Receitas: R$ {total_receitas:,.2f}\n"
                response_text += f"💸 Despesas: R$ {total_despesas:,.2f}\n\n"
                if saldo > 0:
                    response_text += "✅ Excelente! Você está com saldo positivo. Continue mantendo suas finanças organizadas!"
                else:
                    response_text += "⚠️ Atenção: Saldo negativo. Recomendo revisar seus gastos para equilibrar as finanças."
                actions.append({
                    'type': 'show_balance',
                    'data': {
                        'saldo': float(saldo),
                        'receitas': float(total_receitas),
                        'despesas': float(total_despesas)
                    }
                })
        
        elif any(word in query for word in ['gastos', 'despesas', 'quanto gastei', 'maiores gastos', 'categoria']):
            if not transactions:
                response_text = "🎯 📝 Você ainda não possui dados cadastrados neste período.\n\nPara começar a gerar insights:\n\n• Adicione sua primeira transação (Receita ou Despesa)\n• Defina um orçamento e metas financeiras\n\nPosso abrir o formulário de nova transação para você agora."
                actions.append({
                    'type': 'prompt_add_data'
                })
            else:
                # Análise por categoria
                despesas_por_cat = {}
                for t in transactions:
                    if t.type == 'Despesa':
                        despesas_por_cat[t.category] = despesas_por_cat.get(t.category, 0) + t.value
                
                if despesas_por_cat:
                    sorted_cats = sorted(despesas_por_cat.items(), key=lambda x: x[1], reverse=True)
                    response_text = f"💸 Suas despesas totalizam R$ {total_despesas:,.2f}.\n\n"
                    response_text += "📊 Principais categorias:\n\n"
                    for i, (cat, valor) in enumerate(sorted_cats[:5], 1):
                        response_text += f"{i}. {cat}: R$ {valor:,.2f}\n"
                    actions.append({
                        'type': 'show_category_analysis',
                        'data': {'categories': dict(sorted_cats[:5])}
                    })
                else:
                    response_text = "Você ainda não possui despesas cadastradas."
        
        elif any(word in query for word in ['receitas', 'quanto recebi', 'entradas']):
            if not transactions:
                response_text = "🎯 📝 Você ainda não possui dados cadastrados neste período.\n\nPara começar a gerar insights:\n\n• Adicione sua primeira transação (Receita ou Despesa)\n• Defina um orçamento e metas financeiras\n\nPosso abrir o formulário de nova transação para você agora."
                actions.append({
                    'type': 'prompt_add_data'
                })
            else:
                receitas_por_cat = {}
                for t in transactions:
                    if t.type == 'Receita':
                        receitas_por_cat[t.category] = receitas_por_cat.get(t.category, 0) + t.value
                
                if receitas_por_cat:
                    sorted_cats = sorted(receitas_por_cat.items(), key=lambda x: x[1], reverse=True)
                    response_text = f"💰 Suas receitas totalizam R$ {total_receitas:,.2f}.\n\n"
                    response_text += "📊 Principais categorias:\n\n"
                    for i, (cat, valor) in enumerate(sorted_cats[:5], 1):
                        response_text += f"{i}. {cat}: R$ {valor:,.2f}\n"
                else:
                    response_text = "Você ainda não possui receitas cadastradas."
        
        elif any(word in query for word in ['metas', 'objetivos', 'progresso', 'minhas metas']):
            if not goals:
                response_text = "Você ainda não possui metas cadastradas. Posso abrir a seção de metas para você criar uma?"
                actions.append({
                    'type': 'navigate_to_section',
                    'data': {'section': 'goals'}
                })
            else:
                response_text = f"🎯 Você possui {len(goals)} meta(s) cadastrada(s):\n\n"
                for goal in goals[:5]:
                    progresso = (goal.current / goal.target * 100) if goal.target > 0 else 0
                    response_text += f"• {goal.title}: R$ {goal.current:,.2f} / R$ {goal.target:,.2f} ({progresso:.1f}%)\n"
                actions.append({
                    'type': 'navigate_to_section',
                    'data': {'section': 'goals'}
                })
        
        elif any(word in query for word in ['orçamento', 'quanto posso gastar']):
            if not budgets:
                response_text = "Você ainda não possui orçamentos cadastrados para este mês. Posso abrir a seção de orçamento para você criar?"
                actions.append({
                    'type': 'navigate_to_section',
                    'data': {'section': 'budget'}
                })
            else:
                response_text = "📊 Seu orçamento deste mês:\n\n"
                total_orcado = sum(b.budget_amount for b in budgets)
                total_gasto = sum(b.spent_amount for b in budgets)
                for budget in budgets[:5]:
                    porcentagem = (budget.spent_amount / budget.budget_amount * 100) if budget.budget_amount > 0 else 0
                    emoji = "🟢" if porcentagem < 80 else "🟡" if porcentagem < 100 else "🔴"
                    response_text += f"{emoji} {budget.category}: R$ {budget.spent_amount:,.2f} / R$ {budget.budget_amount:,.2f} ({porcentagem:.1f}%)\n"
                actions.append({
                    'type': 'navigate_to_section',
                    'data': {'section': 'budget'}
                })
        
        # NOVAS FUNCIONALIDADES
        
        # Comparação de períodos (mês passado vs atual)
        elif any(word in query for word in ['comparar', 'comparação', 'mês passado', 'mês anterior', 'diferença']):
            if not transactions:
                response_text = "⚠️ Você ainda não possui dados suficientes para comparação."
                actions.append({'type': 'prompt_add_data'})
            else:
                # Calcular mês atual
                receitas_atual = get_period_sum(transactions, 'Receita', 'monthly')
                despesas_atual = get_period_sum(transactions, 'Despesa', 'monthly')
                saldo_atual = receitas_atual - despesas_atual
                
                # Calcular mês anterior
                prev_month = current_month - 1 if current_month > 1 else 12
                prev_year = current_year if current_month > 1 else current_year - 1
                receitas_anterior = sum(t.value for t in transactions 
                                       if t.type == 'Receita' 
                                       and t.date.month == prev_month 
                                       and t.date.year == prev_year)
                despesas_anterior = sum(t.value for t in transactions 
                                       if t.type == 'Despesa' 
                                       and t.date.month == prev_month 
                                       and t.date.year == prev_year)
                saldo_anterior = receitas_anterior - despesas_anterior
                
                # Calcular diferenças
                diff_receitas = receitas_atual - receitas_anterior
                diff_despesas = despesas_atual - despesas_anterior
                diff_saldo = saldo_atual - saldo_anterior
                
                response_text = f"📊 **Comparação: {prev_month}/{prev_year} vs {current_month}/{current_year}**\n\n"
                response_text += f"💰 **Receitas:**\n"
                response_text += f"   Mês atual: {format_currency(receitas_atual)}\n"
                response_text += f"   Mês anterior: {format_currency(receitas_anterior)}\n"
                if diff_receitas > 0:
                    response_text += f"   📈 Aumento de {format_currency(abs(diff_receitas))} (+{(diff_receitas/receitas_anterior*100):.1f}%)\n\n" if receitas_anterior > 0 else f"   📈 Primeiras receitas deste mês\n\n"
                elif diff_receitas < 0:
                    response_text += f"   📉 Redução de {format_currency(abs(diff_receitas))} ({(diff_receitas/receitas_anterior*100):.1f}%)\n\n" if receitas_anterior > 0 else "\n"
                else:
                    response_text += "   ➡️ Sem mudança\n\n"
                
                response_text += f"💸 **Despesas:**\n"
                response_text += f"   Mês atual: {format_currency(despesas_atual)}\n"
                response_text += f"   Mês anterior: {format_currency(despesas_anterior)}\n"
                if diff_despesas > 0:
                    response_text += f"   ⚠️ Aumento de {format_currency(abs(diff_despesas))} (+{(diff_despesas/despesas_anterior*100):.1f}%)\n\n" if despesas_anterior > 0 else f"   ⚠️ Primeiras despesas deste mês\n\n"
                elif diff_despesas < 0:
                    response_text += f"   ✅ Redução de {format_currency(abs(diff_despesas))} ({(diff_despesas/despesas_anterior*100):.1f}%)\n\n" if despesas_anterior > 0 else "\n"
                else:
                    response_text += "   ➡️ Sem mudança\n\n"
                
                response_text += f"💵 **Saldo:**\n"
                response_text += f"   Mês atual: {format_currency(saldo_atual)}\n"
                response_text += f"   Mês anterior: {format_currency(saldo_anterior)}\n"
                if diff_saldo > 0:
                    response_text += f"   ✅ Melhoria de {format_currency(abs(diff_saldo))}\n"
                elif diff_saldo < 0:
                    response_text += f"   ⚠️ Redução de {format_currency(abs(diff_saldo))}\n"
                else:
                    response_text += "   ➡️ Sem mudança\n"
        
        # Tendências de gastos (últimos 3 meses)
        elif any(word in query for word in ['tendência', 'tendências', 'evolução', 'crescimento']):
            if not transactions:
                response_text = "⚠️ Você ainda não possui dados suficientes para análise de tendências."
                actions.append({'type': 'prompt_add_data'})
            else:
                response_text = "📈 **Tendências dos últimos 3 meses:**\n\n"
                meses_tendencia = []
                for i in range(3):
                    month = current_month - i
                    year = current_year
                    if month <= 0:
                        month += 12
                        year -= 1
                    
                    receitas_mes = sum(t.value for t in transactions 
                                      if t.type == 'Receita' 
                                      and t.date.month == month 
                                      and t.date.year == year)
                    despesas_mes = sum(t.value for t in transactions 
                                      if t.type == 'Despesa' 
                                      and t.date.month == month 
                                      and t.date.year == year)
                    saldo_mes = receitas_mes - despesas_mes
                    meses_tendencia.append({
                        'mes': f"{month:02d}/{year}",
                        'receitas': receitas_mes,
                        'despesas': despesas_mes,
                        'saldo': saldo_mes
                    })
                
                for i, mes_data in enumerate(meses_tendencia):
                    seta = "📈" if mes_data['saldo'] > 0 else "📉" if mes_data['saldo'] < 0 else "➡️"
                    response_text += f"{seta} **{mes_data['mes']}:**\n"
                    response_text += f"   Receitas: {format_currency(mes_data['receitas'])}\n"
                    response_text += f"   Despesas: {format_currency(mes_data['despesas'])}\n"
                    response_text += f"   Saldo: {format_currency(mes_data['saldo'])}\n\n"
        
        # Economia mensal e taxa de economia
        elif any(word in query for word in ['economia', 'economizar', 'poupança', 'taxa de economia']):
            if not transactions:
                response_text = "⚠️ Você ainda não possui dados para calcular economia."
                actions.append({'type': 'prompt_add_data'})
            else:
                receitas_mensal = get_period_sum(transactions, 'Receita', 'monthly')
                despesas_mensal = get_period_sum(transactions, 'Despesa', 'monthly')
                economia_mensal = receitas_mensal - despesas_mensal
                taxa_economia = (economia_mensal / receitas_mensal * 100) if receitas_mensal > 0 else 0
                
                receitas_anual = get_period_sum(transactions, 'Receita', 'yearly')
                despesas_anual = get_period_sum(transactions, 'Despesa', 'yearly')
                economia_anual = receitas_anual - despesas_anual
                
                response_text = "💰 **Análise de Economia:**\n\n"
                response_text += f"📅 **Este Mês:**\n"
                response_text += f"   Receitas: {format_currency(receitas_mensal)}\n"
                response_text += f"   Despesas: {format_currency(despesas_mensal)}\n"
                response_text += f"   Economia: {format_currency(economia_mensal)}\n"
                response_text += f"   Taxa de economia: {taxa_economia:.1f}%\n\n"
                
                response_text += f"📅 **Este Ano:**\n"
                response_text += f"   Receitas: {format_currency(receitas_anual)}\n"
                response_text += f"   Despesas: {format_currency(despesas_anual)}\n"
                response_text += f"   Economia acumulada: {format_currency(economia_anual)}\n\n"
                
                # Sugestões
                if taxa_economia < 10:
                    response_text += "💡 **Sugestão:** Sua taxa de economia está baixa (<10%). Considere revisar gastos desnecessários."
                elif taxa_economia >= 20:
                    response_text += "✅ **Excelente!** Você está economizando mais de 20% da sua receita. Continue assim!"
                else:
                    response_text += "👍 **Bom trabalho!** Você está mantendo uma taxa de economia saudável."
        
        # Alertas de orçamento (categorias próximas do limite)
        elif any(word in query for word in ['limite', 'orçamento estourado', 'gastando muito', 'alertas orçamento']):
            if not budgets:
                response_text = "⚠️ Você ainda não possui orçamentos cadastrados."
                actions.append({
                    'type': 'navigate_to_section',
                    'data': {'section': 'budget'}
                })
            else:
                alertas = []
                for budget in budgets:
                    porcentagem = (budget.spent_amount / budget.budget_amount * 100) if budget.budget_amount > 0 else 0
                    if porcentagem >= 100:
                        alertas.append(('🔴', budget.category, porcentagem, 'ESTOURADO'))
                    elif porcentagem >= 80:
                        alertas.append(('🟡', budget.category, porcentagem, 'PRÓXIMO DO LIMITE'))
                
                if alertas:
                    response_text = "⚠️ **Alertas de Orçamento:**\n\n"
                    for status, categoria, porcentagem, tipo in alertas:
                        budget_obj = next((b for b in budgets if b.category == categoria), None)
                        if budget_obj:
                            response_text += f"{status} **{categoria}:** {tipo}\n"
                            response_text += f"   Gasto: {format_currency(budget_obj.spent_amount)} de {format_currency(budget_obj.budget_amount)} ({porcentagem:.1f}%)\n\n"
                else:
                    response_text = "✅ **Ótimas notícias!** Nenhum orçamento próximo do limite no momento."
                    response_text += "\n\n📊 **Status dos seus orçamentos:**\n\n"
                    for budget in budgets[:5]:
                        porcentagem = (budget.spent_amount / budget.budget_amount * 100) if budget.budget_amount > 0 else 0
                        status = "✅" if porcentagem < 80 else "⚠️"
                        response_text += f"{status} {budget.category}: {format_currency(budget.spent_amount)} / {format_currency(budget.budget_amount)} ({porcentagem:.1f}%)\n"
        
        # Transações recentes
        elif any(word in query for word in ['transações recentes', 'últimas transações', 'movimentações recentes', 'histórico recente']):
            if not transactions:
                response_text = "⚠️ Nenhuma transação cadastrada ainda."
                actions.append({'type': 'prompt_add_data'})
            else:
                recentes = sorted(transactions, key=lambda x: x.date, reverse=True)[:10]
                response_text = f"📋 **Últimas {len(recentes)} transações:**\n\n"
                for i, t in enumerate(recentes, 1):
                    tipo_emoji = "💰" if t.type == "Receita" else "💸"
                    sinal = "+" if t.type == "Receita" else "-"
                    data_str = t.date.strftime('%d/%m/%Y')
                    response_text += f"{i}. {tipo_emoji} {t.description}\n"
                    response_text += f"   {sinal}{format_currency(t.value)} | {t.category} | {data_str}\n\n"
        
        # Categorias mais usadas
        elif any(word in query for word in ['categorias mais usadas', 'categorias frequentes', 'onde mais gasto', 'categorias principais']):
            if not transactions:
                response_text = "⚠️ Nenhuma transação cadastrada ainda."
                actions.append({'type': 'prompt_add_data'})
            else:
                # Contar frequência de uso de categorias
                freq_categorias = {}
                for t in transactions:
                    freq_categorias[t.category] = freq_categorias.get(t.category, 0) + 1
                
                sorted_freq = sorted(freq_categorias.items(), key=lambda x: x[1], reverse=True)
                
                response_text = "📊 **Categorias mais utilizadas:**\n\n"
                for i, (cat, count) in enumerate(sorted_freq[:10], 1):
                    response_text += f"{i}. {cat}: {count} transação(ões)\n"
        
        # Status detalhado de metas
        elif any(word in query for word in ['status metas', 'progresso metas', 'como estão minhas metas', 'meta próxima']):
            if not goals:
                response_text = "⚠️ Você ainda não possui metas cadastradas."
                actions.append({
                    'type': 'navigate_to_section',
                    'data': {'section': 'goals'}
                })
            else:
                response_text = "🎯 **Status das Metas:**\n\n"
                # Ordenar por progresso
                goals_sorted = sorted(goals, key=lambda g: (g.current / g.target) if g.target > 0 else 0, reverse=True)
                
                for goal in goals_sorted:
                    progresso = (goal.current / goal.target * 100) if goal.target > 0 else 0
                    dias_restantes = (goal.deadline.date() - now.date()).days
                    
                    if progresso >= 100:
                        status = "✅ CONCLUÍDA"
                    elif dias_restantes < 0:
                        status = "⏰ VENCIDA"
                    elif dias_restantes <= 30:
                        status = "🔥 URGENTE"
                    elif progresso >= 75:
                        status = "👍 QUASE LÁ"
                    else:
                        status = "📌 EM ANDAMENTO"
                    
                    response_text += f"{status} **{goal.title}**\n"
                    response_text += f"   Progresso: {format_currency(goal.current)} / {format_currency(goal.target)} ({progresso:.1f}%)\n"
                    response_text += f"   Faltam: {format_currency(goal.target - goal.current)} | {dias_restantes} dias restantes\n\n"
        
        # Previsão de gastos mensais (média dos últimos meses)
        elif any(word in query for word in ['previsão', 'média de gastos', 'quanto devo gastar', 'projeção']):
            if not transactions:
                response_text = "⚠️ Você ainda não possui dados suficientes para previsões."
                actions.append({'type': 'prompt_add_data'})
            else:
                # Calcular média dos últimos 3 meses
                valores_meses = []
                for i in range(1, 4):
                    month = current_month - i
                    year = current_year
                    if month <= 0:
                        month += 12
                        year -= 1
                    
                    gasto_mes = sum(t.value for t in transactions 
                                   if t.type == 'Despesa' 
                                   and t.date.month == month 
                                   and t.date.year == year)
                    if gasto_mes > 0:
                        valores_meses.append(gasto_mes)
                
                if valores_meses:
                    media_gastos = sum(valores_meses) / len(valores_meses)
                    gasto_atual = get_period_sum(transactions, 'Despesa', 'monthly')
                    
                    response_text = "🔮 **Previsão de Gastos:**\n\n"
                    response_text += f"📊 Média dos últimos {len(valores_meses)} meses: {format_currency(media_gastos)}\n"
                    response_text += f"📅 Gasto atual (este mês): {format_currency(gasto_atual)}\n\n"
                    
                    if gasto_atual > media_gastos * 1.2:
                        response_text += "⚠️ Você está gastando 20% acima da média. Considere revisar seus gastos."
                    elif gasto_atual < media_gastos * 0.8:
                        response_text += "✅ Você está gastando abaixo da média. Bom trabalho!"
                    else:
                        response_text += "👍 Seus gastos estão alinhados com a média histórica."
                else:
                    response_text = "⚠️ Dados insuficientes para calcular previsão (precisa de pelo menos 1 mês de histórico)."

        else:
            # Resposta padrão se não entender - dar resposta contextual
            response_text = "Desculpe, não entendi completamente sua pergunta. Mas posso te ajudar com:\n\n"
            response_text += "💰 **Consultas:** saldo, despesas, receitas\n"
            response_text += "📊 **Navegação:** abrir transação, orçamento, metas, relatórios\n"
            response_text += "🎯 **Análises:** maiores gastos, progresso de metas\n\n"
            response_text += "Tente reformular sua pergunta ou digite 'ajuda' para ver todos os comandos disponíveis."
            
            # Sugerir ajuda se não houver dados
            if not transactions:
                actions.append({
                    'type': 'prompt_add_data'
                })
        
        return jsonify({
            'response': response_text,
            'actions': actions,
            'confidence': 0.8 if actions else 0.5
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ ERRO em /api/ai/analyze: {str(e)}")
        print(f"📋 Traceback completo:\n{error_trace}")
        print(f"🔍 Query recebida: {query}")
        print(f"👤 User ID: {user_id}")
        return jsonify({
            'response': f'Desculpe, ocorreu um erro ao processar sua pergunta: {str(e)}. Tente novamente ou digite "ajuda" para ver os comandos disponíveis.',
            'actions': [],
            'error': str(e),
            'traceback': error_trace if app.debug else None
        }), 500

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

def init_demo_user():
    """Inicializa o usuário de demonstração se não existir"""
    with app.app_context():
        try:
            demo_email = 'demo@finanmaster.com'
            demo_user = User.query.filter_by(email=demo_email).first()
            
            if not demo_user:
                demo_user = User(
                    username='demo',
                    email=demo_email,
                    password_hint='Senha padrão do usuário de demonstração'
                )
                demo_user.set_password('demo123')
                db.session.add(demo_user)
                db.session.commit()
                print(f"✅ Usuário de demonstração criado: {demo_email} / demo123")
        except Exception as e:
            print(f"⚠️  Aviso ao verificar usuário demo: {e}")

if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()
            init_demo_user()
        except Exception as e:
            print(f"⚠️  Erro ao inicializar banco: {e}")
            print("💡 Execute 'python init_mysql.py' para configurar o banco manualmente.")
    app.run(debug=True, host='0.0.0.0', port=5001)
