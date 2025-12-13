#!/usr/bin/env python3
"""
Lira Server - Gateway Central para Todos os Serviços
Servidor FastAPI que centraliza acesso a todos os serviços da Lira
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import httpx

# Configurações
LIRA_ROOT = Path(__file__).parent
SERVICES_CONFIG = {
    "dashboard": {
        "name": "Lira Developer Dashboard",
        "url": "http://localhost:3004",
        "path": "/dashboard",
        "description": "Dashboard de desenvolvimento com IA e gamificação"
    },
    "chat": {
        "name": "Lira Chat UI",
        "url": "http://localhost:9000",
        "path": "/chat",
        "description": "Interface de chat da Lira"
    },
    "api": {
        "name": "Lira API",
        "url": None,  # Este servidor mesmo
        "path": "/api",
        "description": "APIs da Lira"
    }
}

# Inicializa FastAPI
app = FastAPI(
    title="Lira Server",
    description="Gateway central para todos os serviços da Lira",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configura CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cliente HTTP para proxy
client = httpx.AsyncClient(timeout=30.0)

# Rota raiz - Página inicial com links para todos os serviços
@app.get("/", response_class=HTMLResponse)
async def root():
    """Página inicial com acesso a todos os serviços da Lira"""

    services_html = ""
    for service_id, service in SERVICES_CONFIG.items():
        if service["url"]:  # Só mostra serviços que estão configurados
            status = await check_service_status(service["url"])
            status_class = "online" if status else "offline"
            status_text = "🟢 Online" if status else "🔴 Offline"

            services_html += f"""
            <div class="service-card {status_class}">
                <h3>{service['name']}</h3>
                <p>{service['description']}</p>
                <div class="status">{status_text}</div>
                <a href="{service['path']}" class="service-link">
                    Acessar {service['name']}
                </a>
            </div>
            """

    html = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🤖 Lira Server - Gateway Central</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}

            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: #f8fafc;
                min-height: 100vh;
                padding: 20px;
            }}

            .container {{
                max-width: 1200px;
                margin: 0 auto;
            }}

            .header {{
                text-align: center;
                margin-bottom: 50px;
                padding: 40px 0;
            }}

            .header h1 {{
                font-size: 3rem;
                margin-bottom: 10px;
                background: linear-gradient(45deg, #38bdf8, #a78bfa);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }}

            .logo-container {{
                margin-bottom: 16px;
                display: flex;
                justify-content: center;
            }}

            .logo-container img {{
                height: 150px;
                object-fit: contain;
            }}

            .header p {{
                font-size: 1.2rem;
                color: #94a3b8;
                margin-bottom: 20px;
            }}

            .stats {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }}

            .stat-card {{
                background: rgba(30, 41, 59, 0.8);
                border: 1px solid #38bdf8;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
            }}

            .stat-card h3 {{
                color: #38bdf8;
                margin-bottom: 10px;
            }}

            .services {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }}

            .service-card {{
                background: rgba(30, 41, 59, 0.8);
                border: 1px solid #64748b;
                border-radius: 12px;
                padding: 25px;
                transition: all 0.3s ease;
            }}

            .service-card:hover {{
                border-color: #38bdf8;
                transform: translateY(-2px);
            }}

            .service-card.online {{
                border-color: #22c55e;
            }}

            .service-card.offline {{
                border-color: #ef4444;
                opacity: 0.7;
            }}

            .service-card h3 {{
                color: #38bdf8;
                margin-bottom: 10px;
                font-size: 1.3rem;
            }}

            .service-card p {{
                color: #94a3b8;
                margin-bottom: 15px;
                line-height: 1.5;
            }}

            .status {{
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: bold;
                margin-bottom: 15px;
            }}

            .service-link {{
                display: inline-block;
                background: linear-gradient(45deg, #38bdf8, #a78bfa);
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                transition: all 0.3s ease;
            }}

            .service-link:hover {{
                transform: scale(1.05);
                box-shadow: 0 4px 20px rgba(56, 189, 248, 0.3);
            }}

            .footer {{
                text-align: center;
                margin-top: 50px;
                padding: 20px;
                color: #64748b;
                border-top: 1px solid #374151;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-container">
                    <img src="/src/assets/lira_logo.png" alt="Lira Amarinth Logo" />
                </div>
                <h1>🤖 Lira Server</h1>
                <p>Gateway central para todos os serviços da Lira</p>
                <div>🚀 Servidor rodando em <strong>http://localhost:8080</strong></div>
            </div>

            <div class="stats">
                <div class="stat-card">
                    <h3>📊 Status</h3>
                    <div>Sistema Online</div>
                </div>
                <div class="stat-card">
                    <h3>🔗 Serviços</h3>
                    <div>{len([s for s in SERVICES_CONFIG.values() if s['url']])} Ativos</div>
                </div>
                <div class="stat-card">
                    <h3>⚡ Uptime</h3>
                    <div>{datetime.now().strftime('%H:%M:%S')}</div>
                </div>
                <div class="stat-card">
                    <h3>🎯 Versão</h3>
                    <div>1.0.0</div>
                </div>
            </div>

            <div class="services">
                {services_html}
            </div>

            <div class="footer">
                <p>🛠️ Desenvolvido com ❤️ para a comunidade Lira | {datetime.now().year}</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)

# Health check
@app.get("/health")
async def health_check():
    """Verificação de saúde do servidor"""
    services_status = {}
    for service_id, service in SERVICES_CONFIG.items():
        if service["url"]:
            services_status[service_id] = await check_service_status(service["url"])

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": services_status
    }

# API de status dos serviços
@app.get("/api/services/status")
async def get_services_status():
    """Retorna status de todos os serviços"""
    status = {}
    for service_id, service in SERVICES_CONFIG.items():
        if service["url"]:
            status[service_id] = {
                "name": service["name"],
                "url": service["url"],
                "online": await check_service_status(service["url"]),
                "description": service["description"]
            }

    return {"services": status}

# Reverse proxy para os serviços
@app.api_route("/{service:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_service(service: str, request: Request):
    """Proxy reverso para os serviços"""

    # Mapeia paths para serviços
    service_mapping = {
        "dashboard": "dashboard",
        "chat": "chat"
    }

    # Verifica se é uma rota de serviço
    path_parts = service.split("/")
    if path_parts[0] in service_mapping:
        service_id = service_mapping[path_parts[0]]
        service_config = SERVICES_CONFIG.get(service_id)

        if service_config and service_config["url"]:
            # Remove o prefixo do service do path
            target_path = "/" + "/".join(path_parts[1:]) if len(path_parts) > 1 else "/"

            target_url = f"{service_config['url']}{target_path}"

            try:
                # Forward da requisição
                body = await request.body()
                headers = dict(request.headers)
                # Remove headers que podem causar problemas
                headers.pop("host", None)

                response = await client.request(
                    method=request.method,
                    url=target_url,
                    headers=headers,
                    content=body,
                    params=request.query_params
                )

                # Retorna a resposta
                return Response(
                    content=response.content,
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )

            except Exception as e:
                raise HTTPException(status_code=502, detail=f"Erro ao conectar com {service_config['name']}: {str(e)}")

    # Se não encontrou serviço, retorna 404
    raise HTTPException(status_code=404, detail="Serviço não encontrado")

# Função auxiliar para verificar status dos serviços
async def check_service_status(url: str) -> bool:
    """Verifica se um serviço está online"""
    try:
        # Tenta fazer uma requisição simples - alguns serviços não têm /health
        response = await client.get(url, timeout=5.0)
        return response.status_code < 500
    except:
        return False

# Startup event
@app.on_event("startup")
async def startup_event():
    """Evento de inicialização"""
    print("Iniciando Lira Server...")
    print(f"Servidor disponivel em: http://localhost:8080")
    print(f"Documentacao API em: http://localhost:8080/docs")

    # Verifica status inicial dos serviços
    print("\nVerificando status dos servicos:")
    for service_id, service in SERVICES_CONFIG.items():
        if service["url"]:
            status = await check_service_status(service["url"])
            status_icon = "[OK]" if status else "[OFFLINE]"
            print(f"  {status_icon} {service['name']}: {'Online' if status else 'Offline'}")

    print("\nAcesse http://localhost:8080 para ver todos os servicos!")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Evento de encerramento"""
    await client.aclose()
    print("Lira Server encerrado!")

if __name__ == "__main__":
    # Verifica se estamos no diretório correto
    if not LIRA_ROOT.exists():
        print("❌ Erro: Execute este script do diretório raiz da Lira")
        sys.exit(1)

    # Inicia o servidor
    uvicorn.run(
        "lira_server:app",
        host="localhost",
        port=8080,
        reload=True,
        log_level="info"
    )
