#!/usr/bin/env python3
"""
LiraOS Configuration Checker
Verifica se SMTP e GitHub OAuth estão configurados corretamente
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Cores para terminal
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text.center(60)}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{RESET}")

def print_info(text):
    print(f"{BLUE}ℹ️  {text}{RESET}")

def check_env_file():
    """Verifica se o arquivo .env existe"""
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        print_error(f".env file not found at {env_path}")
        return False
    print_success(f".env file found at {env_path}")
    load_dotenv(env_path)
    return True

def check_smtp_config():
    """Verifica configuração SMTP"""
    print_header("SMTP Configuration Check")
    
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM")
    
    all_configured = True
    
    if smtp_host:
        print_success(f"SMTP_HOST: {smtp_host}")
    else:
        print_error("SMTP_HOST not configured")
        all_configured = False
    
    if smtp_port:
        print_success(f"SMTP_PORT: {smtp_port}")
    else:
        print_error("SMTP_PORT not configured")
        all_configured = False
    
    if smtp_user:
        masked = smtp_user[:3] + "***" + smtp_user.split('@')[1] if '@' in smtp_user else smtp_user[:3] + "***"
        print_success(f"SMTP_USER: {masked}")
    else:
        print_error("SMTP_USER not configured")
        all_configured = False
    
    if smtp_password:
        print_success(f"SMTP_PASSWORD: {'*' * len(smtp_password)} (configured)")
    else:
        print_error("SMTP_PASSWORD not configured")
        all_configured = False
    
    if smtp_from:
        print_success(f"SMTP_FROM: {smtp_from}")
    else:
        print_warning("SMTP_FROM not configured (will use SMTP_USER)")
    
    return all_configured

def test_smtp_connection():
    """Testa conexão SMTP"""
    print_header("SMTP Connection Test")
    
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not smtp_user or not smtp_password:
        print_warning("SMTP credentials not configured. Skipping connection test.")
        return False
    
    try:
        import smtplib
        print_info(f"Connecting to {smtp_host}:{smtp_port}...")
        
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        print_success("TLS connection established")
        
        server.login(smtp_user, smtp_password)
        print_success("Authentication successful")
        
        server.quit()
        print_success("SMTP connection test PASSED")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print_error("Authentication failed. Check SMTP_USER and SMTP_PASSWORD")
        print_info("For Gmail, use an App Password, not your regular password")
        print_info("Generate at: https://myaccount.google.com/apppasswords")
        return False
    except Exception as e:
        print_error(f"Connection failed: {str(e)}")
        return False

def check_github_config():
    """Verifica configuração GitHub OAuth"""
    print_header("GitHub OAuth Configuration Check")
    
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    backend_url = os.getenv("BACKEND_URL", "http://localhost:4000")
    
    all_configured = True
    
    if client_id:
        masked = client_id[:4] + "***" + client_id[-4:] if len(client_id) > 8 else "***"
        print_success(f"GITHUB_CLIENT_ID: {masked}")
    else:
        print_error("GITHUB_CLIENT_ID not configured")
        all_configured = False
    
    if client_secret:
        masked = client_secret[:4] + "***" + client_secret[-4:] if len(client_secret) > 8 else "***"
        print_success(f"GITHUB_CLIENT_SECRET: {masked}")
    else:
        print_error("GITHUB_CLIENT_SECRET not configured")
        all_configured = False
    
    print_success(f"BACKEND_URL: {backend_url}")
    print_info(f"Callback URL should be: {backend_url}/auth/github/callback")
    
    return all_configured

def print_summary(smtp_ok, github_ok):
    """Imprime resumo final"""
    print_header("Configuration Summary")
    
    if smtp_ok:
        print_success("SMTP: Fully configured and tested")
    else:
        print_error("SMTP: Not configured or connection failed")
        print_info("Password reset via email will NOT work")
    
    if github_ok:
        print_success("GitHub OAuth: Fully configured")
    else:
        print_error("GitHub OAuth: Not configured")
        print_info("GitHub login will NOT work")
    
    print("\n" + "="*60)
    
    if smtp_ok and github_ok:
        print(f"{GREEN}🎉 All systems configured! You're ready to go!{RESET}")
    elif smtp_ok or github_ok:
        print(f"{YELLOW}⚠️  Partial configuration. Some features may not work.{RESET}")
    else:
        print(f"{RED}❌ Configuration needed. Please update your .env file.{RESET}")
    
    print("="*60 + "\n")

def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{'LiraOS Configuration Checker'.center(60)}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    if not check_env_file():
        print_error("Cannot proceed without .env file")
        sys.exit(1)
    
    smtp_configured = check_smtp_config()
    smtp_ok = False
    if smtp_configured:
        smtp_ok = test_smtp_connection()
    
    github_ok = check_github_config()
    
    print_summary(smtp_ok, github_ok)

if __name__ == "__main__":
    main()
