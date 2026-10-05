CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    short_code TEXT UNIQUE NOT NULL,
    long_url TEXT NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ DEFAULT now(),
    referrer TEXT
);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own links" ON links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own links" ON links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own links" ON links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own links" ON links FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert clicks" ON clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view clicks of their links" ON clicks FOR SELECT USING (
    EXISTS (SELECT 1 FROM links WHERE links.id = clicks.link_id AND links.user_id = auth.uid())
);
