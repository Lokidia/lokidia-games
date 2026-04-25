-- Add Spotify playlist support to categories and games
ALTER TABLE categories ADD COLUMN IF NOT EXISTS spotify_playlist_id text;
ALTER TABLE jeux ADD COLUMN IF NOT EXISTS spotify_playlist_id text;
