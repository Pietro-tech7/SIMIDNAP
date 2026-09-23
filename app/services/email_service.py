"""
Serviço de envio de e-mails transacionais via Brevo.

Três tipos de e-mail:
1. Boas-vindas (no cadastro)
2. Confirmação de compra (após pagamento aprovado — PIX ou cartão)
3. Cancelamento de assinatura

Todos usam o mesmo template HTML com identidade visual do SIMIDNAPE PRO.
Falhas no envio NÃO interrompem o fluxo principal (sempre retornam False e logam).
"""

import os
import requests
from typing import Optional, Dict, Any

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://simidnape.com.br")


# ============================================================
# CONFIGURAÇÃO
# ============================================================
def _config() -> Optional[Dict[str, str]]:
    api_key = os.getenv("BREVO_API_KEY")
    if not api_key:
        print("[Email] BREVO_API_KEY não configurada. Envio pulado.")
        return None
    return {
        "api_key": api_key,
        "sender_email": os.getenv("BREVO_SENDER_EMAIL", "nao-responda@simidnape.com.br"),
        "sender_name": os.getenv("BREVO_SENDER_NAME", "SIMIDNAPE PRO"),
        "reply_to": os.getenv("BREVO_REPLY_TO", "contato@simidnape.com.br"),
    }


# ============================================================
# TEMPLATE BASE (HTML + CSS inline)
# ============================================================
def _template(titulo: str, corpo_html: str) -> str:
    """Envolve o corpo específico no layout padrão do SIMIDNAPE PRO."""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                SIMIDNAPE <span style="color:#93c5fd;">PRO</span>
              </h1>
              <p style="margin:6px 0 0;font-size:12px;color:#dbeafe;letter-spacing:1px;text-transform:uppercase;">
                O Professor Inesquecível
              </p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:40px;">
              {corpo_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
                Precisa de ajuda? Fale com a gente:
              </p>
              <p style="margin:0 0 16px;font-size:13px;">
                <a href="mailto:contato@simidnape.com.br" style="color:#2563eb;text-decoration:none;font-weight:600;">contato@simidnape.com.br</a>
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                <a href="{FRONTEND_URL}/termos" style="color:#94a3b8;text-decoration:underline;">Termos de Uso</a>
                &nbsp;·&nbsp;
                <a href="{FRONTEND_URL}/privacidade" style="color:#94a3b8;text-decoration:underline;">Política de Privacidade</a>
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">
                © SIMIDNAPE PRO — Sistema Municipal Integral de Desenvolvimento<br>
                da Neuroaprendizagem e Performance Educacional
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


# ============================================================
# ENVIO GENÉRICO
# ============================================================
def _enviar(
    destinatario: str,
    nome_destinatario: str,
    assunto: str,
    html: str,
) -> bool:
    """Envia um e-mail via API do Brevo. Retorna True/False."""
    cfg = _config()
    if not cfg:
        return False

    payload = {
        "sender": {"email": cfg["sender_email"], "name": cfg["sender_name"]},
        "to": [{"email": destinatario, "name": nome_destinatario or destinatario}],
        "replyTo": {"email": cfg["reply_to"], "name": cfg["sender_name"]},
        "subject": assunto,
        "htmlContent": html,
    }

    headers = {
        "accept": "application/json",
        "api-key": cfg["api_key"],
        "content-type": "application/json",
    }

    try:
        resp = requests.post(BREVO_API_URL, json=payload, headers=headers, timeout=15)
        if resp.status_code not in (200, 201, 202):
            print(f"[Email] Falha ao enviar para {destinatario}: {resp.status_code} - {resp.text[:200]}")
            return False
        return True
    except Exception as e:
        print(f"[Email] Exceção ao enviar para {destinatario}: {e}")
        return False


# ============================================================
# 1. BOAS-VINDAS
# ============================================================
def send_welcome_email(email: str, nome: str) -> bool:
    primeiro_nome = (nome or "").split(" ")[0] or "professor(a)"

    corpo = f"""
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
        Olá, {primeiro_nome}! 🎓
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
        É com alegria que damos as boas-vindas ao <strong>SIMIDNAPE PRO</strong> — o assistente pedagógico com Inteligência Artificial feito para professores e coordenadores da educação básica brasileira.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
        Aqui você tem <strong>7 motores de IA</strong> à disposição para transformar sua prática em sala de aula:
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">🧠 <strong>NeuroAula</strong> — design de aprendizagem baseado em neuroeducação</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">❤️ <strong>Terapia Pedagógica</strong> — escuta profissional para seus desafios</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">🎯 <strong>Aula que Funciona</strong> — roteiro cronometrado de execução</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">📊 <strong>Meu Aluno</strong> — análise pedagógica de situações concretas</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">📄 <strong>Gerador de Materiais</strong> — atividades, jogos e simulados</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">🏆 <strong>Práticas Exitosas</strong> — documente e replique o que funciona</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">📚 <strong>Banco de Questões</strong> — mais de 3.000 questões do ENEM</td></tr>
      </table>

      <div style="background-color:#eff6ff;border-left:4px solid #2563eb;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.6;">
          💡 <strong>Comece pelo teste gratuito:</strong> você tem créditos iniciais para experimentar cada motor. Aproveite!
        </p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="{FRONTEND_URL}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">
          Acessar o SIMIDNAPE PRO →
        </a>
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
        Qualquer dúvida, basta responder este e-mail. Estamos aqui para caminhar com você.
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
        Com carinho,<br>
        <strong style="color:#0f172a;">Equipe SIMIDNAPE PRO</strong>
      </p>
    """

    return _enviar(
        destinatario=email,
        nome_destinatario=nome,
        assunto="🎓 Bem-vindo ao SIMIDNAPE PRO — O Professor Inesquecível",
        html=_template("Bem-vindo ao SIMIDNAPE PRO", corpo),
    )


# ============================================================
# 2. CONFIRMAÇÃO DE COMPRA
# ============================================================
def send_purchase_email(
    email: str,
    nome: str,
    produto: str,
    valor: float,
    metodo: str,
    creditos_adicionados: Optional[float] = None,
    tipo: str = "credits",
) -> bool:
    """
    Envia confirmação de compra.
      - tipo='credits': comprou créditos avulsos (mostra créditos adicionados)
      - tipo='subscription': assinou um plano mensal
    """
    primeiro_nome = (nome or "").split(" ")[0] or "professor(a)"
    valor_fmt = f"R$ {valor:.2f}".replace(".", ",")
    metodo_fmt = {
        "pix": "PIX",
        "credit_card": "Cartão de crédito",
        "debit_card": "Cartão de débito",
        "mercadopago": "Mercado Pago",
    }.get(metodo, metodo or "—")

    if tipo == "subscription":
        titulo_bloco = "Sua assinatura está ativa! 🎉"
        linha_destaque = f"""<p style="margin:0;font-size:14px;color:#065f46;line-height:1.6;">
          Seu plano <strong>{produto}</strong> foi ativado. A renovação acontece automaticamente todo mês.
        </p>"""
        cta = f"""
          <div style="text-align:center;margin:32px 0;">
            <a href="{FRONTEND_URL}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">
              Aproveitar meus créditos →
            </a>
          </div>
        """
    else:
        creditos_fmt = f"{creditos_adicionados:.1f}".replace(".", ",") if creditos_adicionados else "—"
        titulo_bloco = "Seus créditos foram adicionados! ✅"
        linha_destaque = f"""<p style="margin:0;font-size:14px;color:#065f46;line-height:1.6;">
          Os créditos já estão disponíveis na sua conta e <strong>não expiram</strong>. Use quando quiser.
        </p>"""
        cta = f"""
          <div style="text-align:center;margin:32px 0;">
            <a href="{FRONTEND_URL}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">
              Usar meus créditos agora →
            </a>
          </div>
        """

    # Linha extra de créditos só para o caso de compra avulsa
    linha_creditos = ""
    if tipo == "credits" and creditos_adicionados:
        linha_creditos = f"""
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Créditos adicionados</td>
            <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:700;color:#0d9488;text-align:right;">
              +{f"{creditos_adicionados:.1f}".replace(".", ",")}
            </td>
          </tr>
        """

    corpo = f"""
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
        Olá, {primeiro_nome}!
      </h2>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
        Recebemos seu pagamento com sucesso. Confira os detalhes:
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;border-radius:12px;padding:20px;margin:0 0 24px;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Produto</td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">{produto}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Valor</td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:700;color:#0f172a;text-align:right;">{valor_fmt}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Forma de pagamento</td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;text-align:right;">{metodo_fmt}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-size:14px;color:#64748b;">Status</td>
          <td style="padding:12px 0;font-size:14px;font-weight:700;color:#059669;text-align:right;">● Aprovado</td>
        </tr>
        {linha_creditos}
      </table>

      <div style="background-color:#ecfdf5;border-left:4px solid #10b981;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#065f46;">{titulo_bloco}</p>
        {linha_destaque}
      </div>

      {cta}

      <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
        Guarde este e-mail como comprovante. Se precisar de suporte com pagamentos, responda esta mensagem.
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
        Obrigado por confiar no SIMIDNAPE PRO!<br>
        <strong style="color:#0f172a;">Equipe SIMIDNAPE PRO</strong>
      </p>
    """

    assunto = (
        "✅ Assinatura ativada — SIMIDNAPE PRO"
        if tipo == "subscription"
        else "✅ Pagamento confirmado — SIMIDNAPE PRO"
    )

    return _enviar(
        destinatario=email,
        nome_destinatario=nome,
        assunto=assunto,
        html=_template("Pagamento confirmado", corpo),
    )


# ============================================================
# 3. CANCELAMENTO DE ASSINATURA
# ============================================================
def send_cancellation_email(email: str, nome: str, plano: str) -> bool:
    primeiro_nome = (nome or "").split(" ")[0] or "professor(a)"

    corpo = f"""
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
        Olá, {primeiro_nome}
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
        Confirmamos o cancelamento da sua assinatura do plano <strong>{plano}</strong>.
      </p>

      <div style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;">
          Você continua com acesso aos recursos do plano <strong>até o fim do ciclo atual já pago</strong>. Depois disso, sua conta volta para o modo gratuito.
        </p>
      </div>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
        Se mudar de ideia, você pode reativar a qualquer momento, sem perder seus dados ou histórico de conteúdos gerados.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="{FRONTEND_URL}/minha-assinatura" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">
          Ver planos disponíveis →
        </a>
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
        Se o cancelamento foi um engano, ou se houve algum problema que possamos resolver, responda este e-mail. Queremos muito ouvir você.
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
        Com carinho,<br>
        <strong style="color:#0f172a;">Equipe SIMIDNAPE PRO</strong>
      </p>
    """

    return _enviar(
        destinatario=email,
        nome_destinatario=nome,
        assunto="Sua assinatura foi cancelada — SIMIDNAPE PRO",
        html=_template("Assinatura cancelada", corpo),
    )