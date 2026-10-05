CREATE TABLE users_meta (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free' NOT NULL
);
ALTER TABLE users_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own plan" ON users_meta FOR SELECT USING (id = auth.uid());
