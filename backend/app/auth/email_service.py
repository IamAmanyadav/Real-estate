"""Email service using Resend for sending password reset emails."""

from __future__ import annotations

import resend
from app.config import settings


def send_password_reset_email(to_email: str, reset_token: str, user_name: str) -> bool:
    """Send a password reset email with a reset link.

    Returns True if email sent successfully, False otherwise.
    """
    if not settings.resend_api_key:
        print("WARNING: RESEND_API_KEY not set — cannot send emails.")
        return False

    resend.api_key = settings.resend_api_key

    reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                    🏠 Luxe Estates
                </h1>
            </div>

            <!-- Body -->
            <div style="padding: 32px 28px;">
                <h2 style="color: #1a1a2e; font-size: 20px; margin: 0 0 8px 0; font-weight: 600;">
                    Reset Your Password
                </h2>
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                    Hi {user_name},<br><br>
                    We received a request to reset your password. Click the button below to create a new password. This link is valid for <strong>30 minutes</strong>.
                </p>

                <!-- Button -->
                <div style="text-align: center; margin: 28px 0;">
                    <a href="{reset_url}"
                       style="display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(5,150,105,0.3);">
                        Reset Password
                    </a>
                </div>

                <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0;">
                    If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
                </p>

                <!-- Fallback link -->
                <div style="margin-top: 24px; padding: 16px; background: #f1f5f9; border-radius: 10px;">
                    <p style="color: #64748b; font-size: 11px; margin: 0 0 6px 0; font-weight: 600;">
                        Button not working? Copy this link:
                    </p>
                    <p style="color: #059669; font-size: 11px; margin: 0; word-break: break-all;">
                        {reset_url}
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding: 20px 28px; background: #f8fafb; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                    &copy; 2026 Luxe Estates. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        resend.Emails.send({
            "from": "Luxe Estates <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "Reset Your Password — Luxe Estates",
            "html": html_content,
        })
        return True
    except Exception as e:
        print(f"Failed to send reset email: {e}")
        return False
