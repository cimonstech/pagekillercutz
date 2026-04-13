-- Aggregated play counts per catalog row (service role / API only — not exposed to anon clients).
CREATE OR REPLACE VIEW public.music_play_stats AS
SELECT
  music_id,
  COUNT(*)::bigint AS play_count
FROM public.play_events
WHERE music_id IS NOT NULL
GROUP BY music_id;

COMMENT ON VIEW public.music_play_stats IS 'Play counts per music.id for homepage popular list and analytics.';
