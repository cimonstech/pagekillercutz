-- The R2 public base URL is:
-- https://assets.pagekillercutz.com
--
-- The bucket name is: pagekillercutz

-- ================================================
-- PAGE KILLERCUTZ — DATABASE SEED
-- Run this in Supabase SQL Editor after schema.sql
-- ================================================
-- ━━━ PACKAGES ━━━

INSERT INTO packages (name, description, price, inclusions, display_order, active)
SELECT seed.name, seed.description, seed.price, seed.inclusions, seed.display_order, seed.active
FROM (
  VALUES
    (
      'Essential',
      'Perfect for intimate events and house parties.',
      1500.00,
      ARRAY[
        'Up to 3 hours of live performance',
        'Pioneer CDJ setup',
        'Playlist portal access',
        'SMS and email reminders'
      ],
      1,
      true
    ),
    (
      'Signature',
      'Our most popular package for weddings 
      and corporate events.',
      2800.00,
      ARRAY[
        'Up to 6 hours of live performance',
        'Pioneer CDJ-2000 + DJM-900 setup',
        '2x Technics 1200 turntables',
        'Dedicated playlist portal access',
        '7-day and 1-day SMS reminders',
        'Post-event mix recording'
      ],
      2,
      true
    ),
    (
      'Premium',
      'The full Page KillerCutz experience for 
      festivals and headline events.',
      5000.00,
      ARRAY[
        'Up to 10 hours of live performance',
        'Full Pioneer professional setup',
        'Scratch DJ showcase set',
        'Custom event playlist curation',
        'Priority playlist portal access',
        'Dedicated event coordinator',
        'Post-event mix recording',
        'Social media coverage'
      ],
      3,
      true
    )
) AS seed(name, description, price, inclusions, display_order, active)
WHERE NOT EXISTS (
  SELECT 1 FROM packages p WHERE p.name = seed.name
);

-- ━━━ MUSIC RELEASES ━━━

INSERT INTO music (title, type, genre, release_date, description, featured, cover_url)
SELECT seed.title, seed.type, seed.genre, seed.release_date::date, seed.description, seed.featured, seed.cover_url
FROM (
  VALUES
  (
    'Accra Night Pulse Vol. 4',
    'album',
    'Afrobeats / Highlife',
    '2024-03-15',
    'The fourth instalment of the Accra Night 
    Pulse series. A 12-track journey through 
    the streets of Accra after dark. Blending 
    deep Highlife roots with modern Afrobeats 
    production.',
    true,
    'https://assets.pagekillercutz.com/music-covers/music-covers_accra-night-pulse-vol4.jpg'
  ),
  (
    'Electric Highlife',
    'single',
    'Highlife / Electronic',
    '2024-01-20',
    'A fusion of traditional Highlife melodies 
    with cutting-edge electronic production. 
    The track bridges cultural heritage with 
    contemporary sound design.',
    false,
    'https://assets.pagekillercutz.com/music-covers/music-covers_electric-highlife.jpg'
  ),
  (
    'Sunsum Remixes',
    'mix',
    'Afrobeats / Trap',
    '2023-11-10',
    'Official remix collection featuring 
    regional artists from across West Africa. 
    Six reinterpretations of the Sunsum 
    original EP.',
    false,
    'https://assets.pagekillercutz.com/music-covers/music-covers_sunsum-remixes.jpg'
  ),
  (
    'Gold Coast Grooves',
    'album',
    'Highlife / Afrobeats',
    '2023-06-01',
    'A tribute to the golden era of Ghanaian 
    music, reimagined for the modern dancefloor. 
    10 tracks spanning Highlife, Afrobeats, 
    and Afro-soul.',
    false,
    'https://assets.pagekillercutz.com/music-covers/music-covers_gold-coast-grooves.jpg'
  ),
  (
    'Kpanlogo Rave',
    'single',
    'Kpanlogo / Electronic',
    '2023-02-14',
    'Traditional Kpanlogo rhythms fused with 
    contemporary rave and electronic production. 
    A genre-defying single that pays homage 
    to Ghanaian roots.',
    false,
    'https://assets.pagekillercutz.com/music-covers/music-covers_kpanlogo-rave.jpg'
  ),
  (
    'Wax and Wire',
    'mix',
    'Hip-Hop / Scratch',
    '2022-09-30',
    'A scratch DJ showcase mix. Raw, technical, 
    and deeply Ghanaian. Features live scratch 
    performances recorded in one take.',
    false,
    'https://assets.pagekillercutz.com/music-covers/music-covers_wax-and-wire.jpg'
  )
) AS seed(title, type, genre, release_date, description, featured, cover_url)
WHERE NOT EXISTS (
  SELECT 1 FROM music m WHERE m.title = seed.title
);

-- ━━━ EVENTS ━━━

INSERT INTO events (title, event_type, event_date, venue, location, description, featured, media_urls)
SELECT seed.title, seed.event_type, seed.event_date::date, seed.venue, seed.location, seed.description, seed.featured, seed.media_urls
FROM (
  VALUES
  (
    'Detty December Festival',
    'Festival',
    '2024-12-21',
    'Accra Sports Stadium',
    'Accra, Ghana',
    'Headline set at the biggest end-of-year 
    festival in Accra. A 3-hour journey spanning 
    Afrobeats, Highlife, and Amapiano to a 
    crowd of 15,000.',
    true,
    ARRAY['https://assets.pagekillercutz.com/event-media/event-media_detty-december-festival.jpg']
  ),
  (
    'Asante-Mensah Wedding Reception',
    'Wedding',
    '2024-11-16',
    'Kempinski Hotel Gold Coast',
    'Accra, Ghana',
    'Full evening reception set for an intimate 
    luxury wedding. Playlist curated via the 
    Page KillerCutz portal by the couple.',
    false,
    ARRAY['https://assets.pagekillercutz.com/event-media/event-media_asante-mensah-wedding.jpg']
  ),
  (
    'TotalEnergies Annual Gala',
    'Corporate',
    '2024-10-05',
    'Movenpick Ambassador Hotel',
    'Accra, Ghana',
    'Sophisticated background and dinner set 
    for the annual TotalEnergies Ghana corporate 
    gala. Smooth Afro-soul and Jazz selections.',
    false,
    ARRAY['https://assets.pagekillercutz.com/event-media/event-media_totalenergies-gala.jpg']
  ),
  (
    'Club Onyx Residency',
    'Club Night',
    '2024-09-14',
    'Club Onyx',
    'Accra, Ghana',
    'Monthly residency set at Club Onyx. 
    High-energy 4-hour club night featuring 
    Afrobeats, Amapiano, and Trap.',
    false,
    ARRAY['https://assets.pagekillercutz.com/event-media/event-media_club-onyx-residency.webp']
  ),
  (
    'Global Rhythm Fest',
    'Festival',
    '2024-12-28',
    'Black Star Square',
    'Accra, Ghana',
    'Opening set for the main stage at the 
    inaugural Global Rhythm Fest. First major 
    festival on Ghanaian soil spotlighting 
    Pan-African electronic music.',
    false,
    ARRAY['https://assets.pagekillercutz.com/event-media/event-media_global-rhythm-fest.webp']
  ),
  (
    'The Mensah Celebration',
    'Wedding',
    '2024-11-18',
    'Kempinski Hotel Gold Coast',
    'Kumasi, Ghana',
    'Private luxury wedding celebration in 
    Kumasi. Afrobeats and Highlife classics 
    all night for 200 guests.',
    false,
    ARRAY['https://assets.pagekillercutz.com/event-media/event-media_mensah-celebration.webp']
  )
) AS seed(title, event_type, event_date, venue, location, description, featured, media_urls)
WHERE NOT EXISTS (
  SELECT 1 FROM events e WHERE e.title = seed.title
);

-- ━━━ PRODUCTS ━━━

INSERT INTO products (name, description, price, category, badge, sizes, colours, stock, active, image_url)
SELECT seed.name, seed.description, seed.price, seed.category, seed.badge, seed.sizes, seed.colours, seed.stock, seed.active, seed.image_url
FROM (
  VALUES
  (
    'KillerCutz Logo Tee',
    'Classic heavyweight tee with the Page 
    KillerCutz handprint logo. 
    100% cotton, pre-shrunk.',
    120.00,
    'Apparel',
    'New Drop',
    ARRAY['S','M','L','XL','2XL'],
    ARRAY['Black','White'],
    50,
    true,
    'https://assets.pagekillercutz.com/merch-images/merch-images_killercutz-logo-tee.webp'
  ),
  (
    'Scratch DJ Cap',
    'Structured 6-panel cap with embroidered 
    KC logo. Adjustable snapback closure.',
    85.00,
    'Headwear',
    'Limited',
    ARRAY['One Size'],
    ARRAY['Black','Navy'],
    30,
    true,
    'https://assets.pagekillercutz.com/merch-images/merch-images_scratch-dj-cap.webp'
  ),
  (
    'DJ Slipmat Set',
    'Set of 2 premium felt slipmats with 
    original KillerCutz artwork. 
    Fits standard 12-inch turntables.',
    150.00,
    'Accessories',
    'New Drop',
    ARRAY['One Size'],
    ARRAY['Black'],
    20,
    true,
    'https://assets.pagekillercutz.com/merch-images/merch-images_dj-slipmat-set.webp'
  ),
  (
    'Accra Nights Vol.4 Vinyl',
    'Limited pressing of Accra Night Pulse 
    Vol.4 on 180g black vinyl. 
    Hand-numbered. Includes download code.',
    200.00,
    'Vinyl',
    'Limited',
    ARRAY['One Size'],
    ARRAY['Black'],
    15,
    true,
    'https://assets.pagekillercutz.com/merch-images/merch-images_accra-nights-vinyl.webp'
  ),
  (
    'KillerCutz Hoodie',
    'Premium heavyweight hoodie. 
    Embroidered KC logo on chest. 
    Kangaroo pocket. Unisex fit.',
    280.00,
    'Apparel',
    'New Drop',
    ARRAY['S','M','L','XL'],
    ARRAY['Black','Grey'],
    25,
    true,
    'https://assets.pagekillercutz.com/merch-images/merch-images_killercutz-hoodie.jpg'
  ),
  (
    'Stage Ready Tee',
    'Lightweight performance tee worn on 
    stage by Page KillerCutz. 
    Moisture-wicking fabric.',
    110.00,
    'Apparel',
    'New Drop',
    ARRAY['S','M','L','XL'],
    ARRAY['Black','White'],
    40,
    true,
    'https://assets.pagekillercutz.com/merch-images/merch-images_stage-ready-tee.webp'
  ),
  (
    'Snapback',
    'Flat brim snapback with woven 
    KillerCutz patch on front. 
    One size fits most.',
    95.00,
    'Headwear',
    'Limited',
    ARRAY['One Size'],
    ARRAY['Black'],
    20,
    true,
    'https://assets.pagekillercutz.com/merch-images/merch-images_snapback.webp'
  ),
  (
    'Wax and Wire EP Vinyl',
    'Limited pressing of the Wax and Wire 
    mix on 12-inch black vinyl. 
    Only 50 copies pressed.',
    180.00,
    'Vinyl',
    'Limited',
    ARRAY['One Size'],
    ARRAY['Black'],
    10,
    true,
    'https://assets.pagekillercutz.com/merch-images/merch-images_wax-wire-vinyl.webp'
  )
) AS seed(name, description, price, category, badge, sizes, colours, stock, active, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = seed.name
);

-- ━━━ FIRST SUPER ADMIN ━━━
-- Replace the email below with your real email
-- before running this

INSERT INTO admins (email, role, status)
SELECT 'your@email.com', 'super_admin', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM admins a WHERE a.email = 'your@email.com'
);
