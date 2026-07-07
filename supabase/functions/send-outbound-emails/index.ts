import { createClient } from 'jsr:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const transporter = nodemailer.createTransport({
  host: Deno.env.get('SMTP_HOST')!,
  port: Number(Deno.env.get('SMTP_PORT') ?? 587),
  secure: Deno.env.get('SMTP_SECURE') === 'true',
  auth: {
    user: Deno.env.get('SMTP_USER')!,
    pass: Deno.env.get('SMTP_PASS')!,
  },
});

const FROM = `"ENERGIZE Festival" <${Deno.env.get('SMTP_FROM') ?? 'noreply@energize-festival.de'}>`;
const BATCH = 50;

Deno.serve(async (_req) => {
  const { data: emails, error: fetchError } = await supabase
    .from('outbound_emails')
    .select('id, to_email, subject, body_text, body_html')
    .is('sent_at', null)
    .is('error', null)
    .order('created_at', { ascending: true })
    .limit(BATCH);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  const results = { sent: 0, failed: 0 };

  for (const email of emails ?? []) {
    try {
      await transporter.sendMail({
        from: FROM,
        to: email.to_email,
        subject: email.subject,
        text: email.body_text,
        ...(email.body_html ? { html: email.body_html } : {}),
      });

      await supabase
        .from('outbound_emails')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', email.id);

      results.sent++;
    } catch (err) {
      await supabase
        .from('outbound_emails')
        .update({ error: String(err) })
        .eq('id', email.id);

      results.failed++;
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
});
