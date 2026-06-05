import "server-only";
import { getResend, RESEND_FROM } from "./resend";

interface InvitationEmailParams {
  to: string;
  orgName: string;
  inviterEmail: string | null;
  role: string;
  acceptUrl: string;
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderHtml(p: InvitationEmailParams): string {
  const inviter = p.inviterEmail ? escape(p.inviterEmail) : "Someone";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#141414;border:1px solid #262626;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:32px 32px 0 32px;">
          <div style="font-size:22px;font-weight:600;color:#fafafa;letter-spacing:-0.01em;">replyloop</div>
        </td></tr>
        <tr><td style="padding:24px 32px 8px 32px;">
          <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:600;color:#fafafa;">You're invited to join ${escape(p.orgName)}</h1>
          <p style="margin:0;color:#a3a3a3;font-size:15px;line-height:1.55;">
            ${inviter} added you to <strong style="color:#fafafa;">${escape(p.orgName)}</strong> on Replyloop as a <strong style="color:#fafafa;">${escape(p.role)}</strong>.
            Accept the invite to start drafting review responses with Claude.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <a href="${p.acceptUrl}" style="display:inline-block;background:#fafafa;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">Accept invitation</a>
        </td></tr>
        <tr><td style="padding:0 32px 32px 32px;">
          <p style="margin:0;color:#737373;font-size:13px;line-height:1.6;">
            Or paste this link into your browser:<br>
            <a href="${p.acceptUrl}" style="color:#a3a3a3;word-break:break-all;">${p.acceptUrl}</a>
          </p>
          <p style="margin:24px 0 0 0;color:#525252;font-size:12px;">
            This invitation expires in 7 days. If you weren't expecting it, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText(p: InvitationEmailParams): string {
  const inviter = p.inviterEmail ?? "Someone";
  return `${inviter} invited you to join ${p.orgName} on Replyloop as a ${p.role}.

Accept the invitation:
${p.acceptUrl}

This invitation expires in 7 days.`;
}

export async function sendInvitationEmail(params: InvitationEmailParams): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "resend_not_configured" };

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: params.to,
    subject: `You're invited to ${params.orgName} on Replyloop`,
    html: renderHtml(params),
    text: renderText(params),
  });

  if (error) {
    console.error("[invitation-email] resend error:", error);
    return { sent: false, reason: error.message };
  }
  return { sent: !!data };
}
