// Email Service for LiraOS
// Implementa envio real de emails para verificação e recuperação de senha

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  code?: string;
  resetLink?: string;
  userName?: string;
}

// Configurações do serviço de email
const EMAIL_CONFIG = {
  // Usando EmailJS como exemplo (gratuito para desenvolvimento)
  serviceId: 'service_liraos',
  templateIds: {
    verification: 'template_verification',
    passwordReset: 'template_password_reset'
  },
  publicKey: 'your_emailjs_public_key', // Será configurado pelo usuário
  apiUrl: 'https://api.emailjs.com/api/v1.0/email/send'
};

// Templates de email
const createVerificationTemplate = (code: string, userName?: string): EmailTemplate => ({
  subject: '🔐 Código de Verificação LiraOS',
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      
      <!-- Header com Logo -->
      <div style="background: linear-gradient(135deg, #fb7185 0%, #f97316 100%); padding: 30px; text-align: center; position: relative;">
        <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
          <div style="width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 24px; font-weight: bold; color: #fb7185;">L</span>
          </div>
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">LiraOS</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Neural Core Authentication</p>
      </div>

      <!-- Conteúdo Principal -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
          Olá${userName ? `, ${userName}` : ''}! 👋
        </h2>
        
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Você solicitou acesso ao <strong>LiraOS</strong>. Para completar a autenticação, use o código de verificação abaixo:
        </p>

        <!-- Código de Verificação -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">Seu código de verificação:</p>
          <div style="font-family: 'Monaco', 'Menlo', monospace; font-size: 36px; font-weight: bold; color: #15803d; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(34,197,94,0.2);">
            ${code}
          </div>
          <p style="color: #16a34a; font-size: 12px; margin: 10px 0 0 0;">Este código expira em 10 minutos</p>
        </div>

        <!-- Instruções -->
        <div style="background: #f8fafc; border-left: 4px solid #fb7185; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px;">📋 Como usar:</h3>
          <ol style="color: #64748b; font-size: 14px; margin: 0; padding-left: 20px;">
            <li>Volte para a tela de login do LiraOS</li>
            <li>Digite o código de 6 dígitos acima</li>
            <li>Clique em "Verify & Login"</li>
          </ol>
        </div>

        <!-- Segurança -->
        <div style="background: #fef7ff; border: 1px solid #e879f9; border-radius: 12px; padding: 20px; margin: 30px 0;">
          <h3 style="color: #a21caf; margin: 0 0 10px 0; font-size: 14px; display: flex; align-items: center;">
            🛡️ Segurança
          </h3>
          <p style="color: #86198f; font-size: 13px; margin: 0; line-height: 1.5;">
            Se você não solicitou este código, ignore este email. Nunca compartilhe seus códigos de verificação com terceiros.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0;">
          Este é um email automático do sistema LiraOS
        </p>
        <p style="color: #64748b; font-size: 11px; margin: 0;">
          © 2024 LiraOS - Neural Operating System
        </p>
      </div>
    </div>
  `,
  text: `
LiraOS - Código de Verificação

Olá${userName ? `, ${userName}` : ''}!

Você solicitou acesso ao LiraOS. Para completar a autenticação, use o código de verificação abaixo:

Código: ${code}

Este código expira em 10 minutos.

Como usar:
1. Volte para a tela de login do LiraOS
2. Digite o código de 6 dígitos acima  
3. Clique em "Verify & Login"

Se você não solicitou este código, ignore este email.

© 2024 LiraOS - Neural Operating System
  `
});

const createPasswordResetTemplate = (resetLink: string, userName?: string): EmailTemplate => ({
  subject: '🔑 Redefinição de Senha - LiraOS',
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
        <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
          <div style="width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 24px;">🔑</span>
          </div>
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">LiraOS</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Password Recovery</p>
      </div>

      <!-- Conteúdo -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
          Redefinir sua senha 🔐
        </h2>
        
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          ${userName ? `Olá, ${userName}! ` : 'Olá! '}Você solicitou a redefinição da sua senha no <strong>LiraOS</strong>. Clique no botão abaixo para criar uma nova senha:
        </p>

        <!-- Botão de Reset -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; font-weight: 600; font-size: 16px; padding: 16px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(59,130,246,0.3); transition: all 0.3s ease;">
            🔑 Redefinir Minha Senha
          </a>
        </div>

        <!-- Link alternativo -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Se o botão não funcionar, copie e cole este link no seu navegador:
          </p>
          <p style="word-break: break-all; background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; color: #3b82f6;">
            ${resetLink}
          </p>
        </div>

        <!-- Aviso de expiração -->
        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 30px 0;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 14px;">
            ⏰ Tempo Limitado
          </h3>
          <p style="color: #b45309; font-size: 13px; margin: 0;">
            Este link de redefinição expira em <strong>1 hora</strong>. Se não conseguir usar a tempo, solicite um novo reset.
          </p>
        </div>

        <!-- Segurança -->
        <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 20px;">
          <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 14px;">
            🛡️ Segurança Importante
          </h3>
          <p style="color: #b91c1c; font-size: 13px; margin: 0; line-height: 1.5;">
            Se você <strong>não solicitou</strong> a redefinição de senha, ignore este email e considere alterar sua senha por precaução.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0;">
          Este é um email automático do sistema LiraOS
        </p>
        <p style="color: #64748b; font-size: 11px; margin: 0;">
          © 2024 LiraOS - Neural Operating System
        </p>
      </div>
    </div>
  `,
  text: `
LiraOS - Redefinição de Senha

${userName ? `Olá, ${userName}! ` : 'Olá! '}Você solicitou a redefinição da sua senha no LiraOS.

Para criar uma nova senha, acesse este link:
${resetLink}

IMPORTANTE:
- Este link expira em 1 hora
- Se você não solicitou esta redefinição, ignore este email
- Considere alterar sua senha por precaução se não foi você

© 2024 LiraOS - Neural Operating System
  `
});

// Classe principal do serviço de email
export class EmailService {
  private static instance: EmailService;
  private isConfigured = false;

  private constructor() {
    this.checkConfiguration();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private checkConfiguration(): void {
    // Verifica se as variáveis de ambiente estão configuradas
    this.isConfigured = !!(
      process.env.REACT_APP_EMAILJS_SERVICE_ID ||
      localStorage.getItem('emailjs_service_id')
    );
  }

  // Configuração manual para desenvolvimento
  public configure(serviceId: string, publicKey: string): void {
    localStorage.setItem('emailjs_service_id', serviceId);
    localStorage.setItem('emailjs_public_key', publicKey);
    this.isConfigured = true;
  }

  // Enviar email de verificação
  public async sendVerificationEmail(email: string, code: string, userName?: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('EmailService not configured. Falling back to console log.');
      console.log(`🔐 Verification code for ${email}: ${code}`);
      return true; // Simula sucesso para desenvolvimento
    }

    try {
      const template = createVerificationTemplate(code, userName);
      
      const emailData = {
        service_id: this.getServiceId(),
        template_id: EMAIL_CONFIG.templateIds.verification,
        user_id: this.getPublicKey(),
        template_params: {
          to_email: email,
          to_name: userName || email.split('@')[0],
          subject: template.subject,
          html_content: template.html,
          text_content: template.text,
          verification_code: code
        }
      };

      const response = await fetch(EMAIL_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log(`✅ Verification email sent to ${email}`);
        return true;
      } else {
        throw new Error(`Email service responded with status: ${response.status}`);
      }

    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Fallback para desenvolvimento
      console.log(`🔐 Fallback - Verification code for ${email}: ${code}`);
      return false;
    }
  }

  // Enviar email de reset de senha
  public async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('EmailService not configured. Falling back to console log.');
      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
      console.log(`🔑 Password reset link for ${email}: ${resetLink}`);
      return true;
    }

    try {
      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
      const template = createPasswordResetTemplate(resetLink, userName);
      
      const emailData = {
        service_id: this.getServiceId(),
        template_id: EMAIL_CONFIG.templateIds.passwordReset,
        user_id: this.getPublicKey(),
        template_params: {
          to_email: email,
          to_name: userName || email.split('@')[0],
          subject: template.subject,
          html_content: template.html,
          text_content: template.text,
          reset_link: resetLink
        }
      };

      const response = await fetch(EMAIL_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log(`✅ Password reset email sent to ${email}`);
        return true;
      } else {
        throw new Error(`Email service responded with status: ${response.status}`);
      }

    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Fallback para desenvolvimento
      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
      console.log(`🔑 Fallback - Password reset link for ${email}: ${resetLink}`);
      return false;
    }
  }

  // Validar código de verificação
  public validateVerificationCode(inputCode: string, actualCode: string): boolean {
    return inputCode === actualCode;
  }

  // Gerar código de verificação
  public generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Gerar token de reset
  public generateResetToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private getServiceId(): string {
    return process.env.REACT_APP_EMAILJS_SERVICE_ID || 
           localStorage.getItem('emailjs_service_id') || 
           EMAIL_CONFIG.serviceId;
  }

  private getPublicKey(): string {
    return process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 
           localStorage.getItem('emailjs_public_key') || 
           EMAIL_CONFIG.publicKey;
  }

  // Verificar se o serviço está configurado
  public isReady(): boolean {
    return this.isConfigured;
  }
}

// Instância singleton
export const emailService = EmailService.getInstance();

// Configuração para desenvolvimento (opcional)
export const configureEmailService = (serviceId: string, publicKey: string) => {
  emailService.configure(serviceId, publicKey);
};

export default emailService;
