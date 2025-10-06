#!/usr/bin/env python3
"""
FinanMaster - Servidor de Teste Melhorado
Processa templates e serve arquivos estáticos corretamente
"""

import http.server
import socketserver
import json
import os
import urllib.parse
import re
from datetime import datetime

class FinanMasterHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def do_GET(self):
        # Processar templates Flask
        if self.path == '/' or self.path == '/index.html':
            self.serve_template()
            return
        
        # Servir arquivos estáticos
        if self.path.startswith('/static/'):
            self.path = self.path[1:]  # Remove a barra inicial
            return super().do_GET()
        
        # APIs mockadas
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            self.send_error(404)
    
    def serve_template(self):
        """Serve o template HTML processando as variáveis Flask"""
        try:
            with open('templates/index.html', 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Substituir as variáveis Flask por caminhos corretos
            content = re.sub(
                r'\{\{\s*url_for\(\'static\',\s*filename=[\'"]([^\'"]+)[\'"]\)\s*\}\}',
                r'static/\1',
                content
            )
            
            # Remover scripts que não funcionam sem Flask
            content = re.sub(
                r'<script src="https://cdn\.jsdelivr\.net/npm/bootstrap@5\.3\.2/dist/js/bootstrap\.bundle\.min\.js"></script>',
                '<!-- Bootstrap JS removido para teste -->',
                content
            )
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
            
        except FileNotFoundError:
            self.send_error(404, "Template não encontrado")
        except Exception as e:
            self.send_error(500, f"Erro ao processar template: {str(e)}")
    
    def handle_api_request(self):
        """Simula as APIs do FinanMaster com dados mockados"""
        
        # Dashboard data
        if self.path == '/api/dashboard-data':
            data = {
                "saldo": 15420.50,
                "receitas": 8500.00,
                "despesas": 3200.75,
                "economia": 5299.25,
                "months_data": [
                    {"month": "Jan", "receitas": 7500, "despesas": 2800},
                    {"month": "Fev", "receitas": 8200, "despesas": 3100},
                    {"month": "Mar", "receitas": 9000, "despesas": 2900},
                    {"month": "Abr", "receitas": 7800, "despesas": 3300},
                    {"month": "Mai", "receitas": 8500, "despesas": 3200}
                ],
                "categorias_despesas": [
                    {"categoria": "Alimentação", "total": 1200.50},
                    {"categoria": "Transporte", "total": 800.25},
                    {"categoria": "Moradia", "total": 1000.00},
                    {"categoria": "Lazer", "total": 600.00},
                    {"categoria": "Saúde", "total": 400.00}
                ]
            }
            self.send_json_response(data)
        
        # Transactions
        elif self.path == '/api/transactions':
            data = [
                {"id": 1, "description": "Salário", "value": 8500.00, "category": "Salário", "type": "Receita", "date": "2024-01-15"},
                {"id": 2, "description": "Supermercado", "value": 320.50, "category": "Alimentação", "type": "Despesa", "date": "2024-01-14"},
                {"id": 3, "description": "Combustível", "value": 150.00, "category": "Transporte", "type": "Despesa", "date": "2024-01-13"},
                {"id": 4, "description": "Aluguel", "value": 1000.00, "category": "Moradia", "type": "Despesa", "date": "2024-01-10"},
                {"id": 5, "description": "Cinema", "value": 80.00, "category": "Lazer", "type": "Despesa", "date": "2024-01-12"}
            ]
            self.send_json_response(data)
        
        # Goals
        elif self.path == '/api/goals':
            data = [
                {"id": 1, "title": "Reserva de Emergência", "target": 10000.00, "current": 6500.00, "deadline": "2024-12-31", "icon": "fas fa-piggy-bank", "progress": 65.0},
                {"id": 2, "title": "Viagem Europa", "target": 15000.00, "current": 8500.00, "deadline": "2024-06-15", "icon": "fas fa-plane", "progress": 56.7},
                {"id": 3, "title": "Novo Notebook", "target": 3500.00, "current": 2100.00, "deadline": "2024-03-30", "icon": "fas fa-laptop", "progress": 60.0}
            ]
            self.send_json_response(data)
        
        # Budget
        elif self.path == '/api/budget':
            data = [
                {"category": "Alimentação", "budget": 1500.00, "spent": 1200.50, "progress": 80.0},
                {"category": "Transporte", "budget": 1000.00, "spent": 800.25, "progress": 80.0},
                {"category": "Moradia", "budget": 1200.00, "spent": 1000.00, "progress": 83.3},
                {"category": "Lazer", "budget": 800.00, "spent": 600.00, "progress": 75.0},
                {"category": "Saúde", "budget": 500.00, "spent": 400.00, "progress": 80.0}
            ]
            self.send_json_response(data)
        
        else:
            self.send_error(404)
    
    def send_json_response(self, data):
        """Envia resposta JSON"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

def main():
    PORT = 5001
    
    print("🚀 FinanMaster - Servidor de Teste Melhorado")
    print("=" * 60)
    print(f"📡 Servidor rodando em: http://localhost:{PORT}")
    print("🎨 Testando as melhorias do frontend:")
    print("   ✅ Menu horizontal com ícones")
    print("   ✅ Paleta de cores amigável")
    print("   ✅ Design responsivo")
    print("   ✅ Animações e micro-interações")
    print("   ✅ Templates processados corretamente")
    print("   ✅ Arquivos estáticos servidos")
    print("=" * 60)
    print("💡 Pressione Ctrl+C para parar o servidor")
    
    with socketserver.TCPServer(("", PORT), FinanMasterHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor parado!")
            httpd.shutdown()

if __name__ == "__main__":
    main()
