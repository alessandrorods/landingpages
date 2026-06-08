INSERT INTO system_config (key, value, updated_at)
VALUES (
  'undeliveredReasons',
  '["Destinatário ausente","Endereço não encontrado / incorreto","Acesso bloqueado (portaria, condomínio)","Recusa de recebimento","Outro"]'::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;
