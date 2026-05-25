import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MailerService {
    private readonly endpoint =
        process.env.BREVO_EMAIL_ENDPOINT ||
        'https://api.brevo.com/v3/smtp/email';

    private readonly sender = {
        name: 'Coffee POS System',
        email: process.env.BREVO_SENDER!,
    };

    private readonly headers = {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json',
    };

    constructor() {
        if (!process.env.BREVO_API_KEY) {
            throw new Error('BREVO_API_KEY is missing');
        }

        if (!process.env.BREVO_SENDER) {
            throw new Error('BREVO_SENDER is missing');
        }

        if (!process.env.BACKEND_URL) {
            throw new Error('BACKEND_URL is missing');
        }
    }

    async sendVerificationEmail(to: string, token: string) {
        const backendUrl = new URL(process.env.BACKEND_URL!);

        const verificationUrl = new URL(
            '/verify-email',
            process.env.FRONTEND_URL,
        );

        verificationUrl.searchParams.set('token', token);

        const html = this.buildVerificationTemplate(
            verificationUrl.toString(),
        );

        const text = `Verify your email: ${verificationUrl.toString()}`;

        const res = await axios.post(
            this.endpoint,
            {
                sender: this.sender,

                to: [
                    {
                        email: to,
                    },
                ],

                subject: 'Verify Your Email - Coffee POS System',

                htmlContent: html,

                textContent: text,
            },
            {
                headers: this.headers,
                timeout: 10000,
            },
        );

        // console.log('📧 Brevo verification email response:', res.data);

        return res.data;
    }

    // =====================================================
    // EMAIL WRAPPER
    // =====================================================
    private wrapEmail(title: string, content: string) {
        return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${title}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#f4f7fb;
    font-family:Arial, Helvetica, sans-serif;
    color:#1f2937;
  "
>

  <!-- PREHEADER -->
  <div style="display:none;max-height:0;overflow:hidden;">
    Coffee POS System notification email
  </div>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
      padding:40px 15px;
      background:#f4f7fb;
    "
  >
    <tr>
      <td align="center">

        <!-- CONTAINER -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            max-width:600px;
            background:#ffffff;
            border-radius:14px;
            overflow:hidden;
            box-shadow:0 4px 20px rgba(0,0,0,0.06);
          "
        >

          <!-- HEADER -->
          <tr>
            <td
              align="center"
              style="
                background:linear-gradient(135deg,#6f4e37,#4b2e2e);
                padding:32px 20px;
                color:#ffffff;
              "
            >
              <h1
                style="
                  margin:0;
                  font-size:28px;
                  font-weight:700;
                  letter-spacing:0.5px;
                "
              >
                ☕ Coffee POS System
              </h1>

              <p
                style="
                  margin-top:10px;
                  font-size:14px;
                  opacity:0.9;
                "
              >
                Smart & Modern Point of Sale Management
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td
              style="
                padding:45px 35px;
                line-height:1.7;
              "
            >
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              align="center"
              style="
                background:#f9fafb;
                padding:25px 20px;
                font-size:12px;
                color:#6b7280;
                border-top:1px solid #e5e7eb;
              "
            >
              © ${new Date().getFullYear()} Coffee POS System
              <br />
              Educational Purpose Only
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
    }

    // =====================================================
    // VERIFICATION TEMPLATE
    // =====================================================
    private buildVerificationTemplate(url: string) {
        return this.wrapEmail(
            'Verify Your Email',
            `
      <div style="text-align:center;">

        <h2
          style="
            margin:0;
            font-size:26px;
            color:#111827;
          "
        >
          Verify Your Email
        </h2>

        <p
          style="
            margin-top:18px;
            font-size:15px;
            color:#4b5563;
          "
        >
          Welcome to <strong>Coffee POS System</strong>.
          <br />
          Please confirm your email address to activate your account.
        </p>

        <!-- BUTTON -->
        <div style="margin-top:35px;">
          <a
            href="${url}"
            style="
              display:inline-block;
              background:#6f4e37;
              color:#ffffff;
              text-decoration:none;
              padding:14px 32px;
              border-radius:8px;
              font-size:15px;
              font-weight:bold;
              letter-spacing:0.3px;
            "
          >
            Verify Email
          </a>
        </div>

        <!-- EXTRA -->
        <p
          style="
            margin-top:35px;
            font-size:13px;
            color:#9ca3af;
          "
        >
          This verification link will expire in 1 hour.
        </p>

        <p
          style="
            margin-top:10px;
            font-size:13px;
            color:#9ca3af;
            word-break:break-word;
          "
        >
          If the button does not work, copy and paste this link:
          <br /><br />

          <a
            href="${url}"
            style="
              color:#6f4e37;
              text-decoration:none;
            "
          >
            ${url}
          </a>
        </p>

      </div>
      `,
        );
    }
}