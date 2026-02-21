-- ghostty.style initial schema

CREATE TABLE configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  raw_config      TEXT NOT NULL,

  -- Parsed visual properties (denormalized for fast rendering)
  background      TEXT NOT NULL,
  foreground      TEXT NOT NULL,
  cursor_color    TEXT,
  cursor_text     TEXT,
  selection_bg    TEXT,
  selection_fg    TEXT,
  palette         JSONB NOT NULL DEFAULT '[]',
  font_family     TEXT,
  font_size       REAL,
  cursor_style    TEXT DEFAULT 'block',
  bg_opacity      REAL DEFAULT 1.0,

  -- Metadata
  is_dark         BOOLEAN NOT NULL DEFAULT true,
  tags            TEXT[] DEFAULT '{}',
  source_url      TEXT,
  author_name     TEXT,
  author_url      TEXT,
  is_featured     BOOLEAN DEFAULT false,
  is_seed         BOOLEAN DEFAULT false,

  -- Denormalized counters
  vote_count      INTEGER DEFAULT 0,
  view_count      INTEGER DEFAULT 0,
  download_count  INTEGER DEFAULT 0,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_configs_slug ON configs(slug);
CREATE INDEX idx_configs_vote_count ON configs(vote_count DESC);
CREATE INDEX idx_configs_created_at ON configs(created_at DESC);
CREATE INDEX idx_configs_is_dark ON configs(is_dark);
CREATE INDEX idx_configs_tags ON configs USING GIN(tags);
CREATE INDEX idx_configs_search ON configs USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Votes table
CREATE TABLE votes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id     UUID NOT NULL REFERENCES configs(id) ON DELETE CASCADE,
  voter_hash    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(config_id, voter_hash)
);

CREATE INDEX idx_votes_config_id ON votes(config_id);
CREATE INDEX idx_votes_voter_hash ON votes(voter_hash);

-- Analytics events
CREATE TABLE analytics_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id     UUID REFERENCES configs(id) ON DELETE SET NULL,
  event_type    TEXT NOT NULL,
  referrer      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_config_id ON analytics_events(config_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

-- Trigger: auto-update vote_count on configs
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.configs SET vote_count = vote_count + 1 WHERE id = NEW.config_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.configs SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.config_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trigger_update_vote_count
AFTER INSERT OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_vote_count();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_at
BEFORE UPDATE ON configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configs are publicly readable"
  ON configs FOR SELECT USING (true);

CREATE POLICY "Anyone can submit configs"
  ON configs FOR INSERT WITH CHECK (true);

CREATE POLICY "Configs counters can be updated"
  ON configs FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Votes are publicly readable"
  ON votes FOR SELECT USING (true);

CREATE POLICY "Anyone can vote"
  ON votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can remove votes"
  ON votes FOR DELETE USING (true);

CREATE POLICY "Anyone can insert analytics"
  ON analytics_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Analytics are publicly readable"
  ON analytics_events FOR SELECT USING (true);
