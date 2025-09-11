-- Schema inicial para almacenar scripts y embeddings (sin embeddings aún)
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  code TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scripts_updated ON scripts;
CREATE TRIGGER trg_scripts_updated
BEFORE UPDATE ON scripts
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
