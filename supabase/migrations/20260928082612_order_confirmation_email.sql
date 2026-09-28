-- M13-P01: exactly-once order confirmation email. Written only by the service-role webhook.
alter table public.orders add column confirmation_email_sent_at timestamptz;
comment on column public.orders.confirmation_email_sent_at is 'When the order confirmation email was accepted by Resend; null = not sent yet (the webhook retries).';
