-- Update existing records to new R2 custom domain + exact filenames

-- Fix music covers
UPDATE music SET cover_url =
  'https://assets.pagekillercutz.com/music-covers/music-covers_accra-night-pulse-vol4.jpg'
  WHERE title = 'Accra Night Pulse Vol. 4';

UPDATE music SET cover_url =
  'https://assets.pagekillercutz.com/music-covers/music-covers_electric-highlife.jpg'
  WHERE title = 'Electric Highlife';

UPDATE music SET cover_url =
  'https://assets.pagekillercutz.com/music-covers/music-covers_gold-coast-grooves.jpg'
  WHERE title = 'Gold Coast Grooves';

UPDATE music SET cover_url =
  'https://assets.pagekillercutz.com/music-covers/music-covers_kpanlogo-rave.jpg'
  WHERE title = 'Kpanlogo Rave';

UPDATE music SET cover_url =
  'https://assets.pagekillercutz.com/music-covers/music-covers_sunsum-remixes.jpg'
  WHERE title = 'Sunsum Remixes';

UPDATE music SET cover_url =
  'https://assets.pagekillercutz.com/music-covers/music-covers_wax-and-wire.jpg'
  WHERE title = 'Wax and Wire';

-- Fix event media
UPDATE events SET media_urls =
  ARRAY['https://assets.pagekillercutz.com/event-media/event-media_asante-mensah-wedding.jpg']
  WHERE title = 'Asante-Mensah Wedding Reception';

UPDATE events SET media_urls =
  ARRAY['https://assets.pagekillercutz.com/event-media/event-media_club-onyx-residency.webp']
  WHERE title = 'Club Onyx Residency';

UPDATE events SET media_urls =
  ARRAY['https://assets.pagekillercutz.com/event-media/event-media_detty-december-festival.jpg']
  WHERE title = 'Detty December Festival';

UPDATE events SET media_urls =
  ARRAY['https://assets.pagekillercutz.com/event-media/event-media_global-rhythm-fest.webp']
  WHERE title = 'Global Rhythm Fest';

UPDATE events SET media_urls =
  ARRAY['https://assets.pagekillercutz.com/event-media/event-media_mensah-celebration.webp']
  WHERE title = 'The Mensah Celebration';

UPDATE events SET media_urls =
  ARRAY['https://assets.pagekillercutz.com/event-media/event-media_totalenergies-gala.jpg']
  WHERE title = 'TotalEnergies Annual Gala';

-- Fix merch images
UPDATE products SET image_url =
  'https://assets.pagekillercutz.com/merch-images/merch-images_accra-nights-vinyl.webp'
  WHERE name = 'Accra Nights Vol.4 Vinyl';

UPDATE products SET image_url =
  'https://assets.pagekillercutz.com/merch-images/merch-images_dj-slipmat-set.webp'
  WHERE name = 'DJ Slipmat Set';

UPDATE products SET image_url =
  'https://assets.pagekillercutz.com/merch-images/merch-images_killercutz-hoodie.jpg'
  WHERE name = 'KillerCutz Hoodie';

UPDATE products SET image_url =
  'https://assets.pagekillercutz.com/merch-images/merch-images_killercutz-logo-tee.webp'
  WHERE name = 'KillerCutz Logo Tee';

UPDATE products SET image_url =
  'https://assets.pagekillercutz.com/merch-images/merch-images_scratch-dj-cap.webp'
  WHERE name = 'Scratch DJ Cap';

UPDATE products SET image_url =
  'https://assets.pagekillercutz.com/merch-images/merch-images_snapback.webp'
  WHERE name = 'Snapback';

UPDATE products SET image_url =
  'https://assets.pagekillercutz.com/merch-images/merch-images_stage-ready-tee.webp'
  WHERE name = 'Stage Ready Tee';

UPDATE products SET image_url =
  'https://assets.pagekillercutz.com/merch-images/merch-images_wax-wire-vinyl.webp'
  WHERE name = 'Wax and Wire EP Vinyl';
