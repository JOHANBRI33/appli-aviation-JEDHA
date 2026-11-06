-- supabase/seed/aircraft.sql
-- Généré par scripts/import-catalogue/run.js — NE PAS MODIFIER À LA MAIN
-- 2026-11-05T19:43:14.741Z
--
-- INSERT ... ON CONFLICT : peut être relancé sans créer de doublons.
-- Exécuter dans l'éditeur SQL du projet Supabase (interface web ou CLI).

-- Airbus A320 (Q18784360)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'a320', 'Airbus A320', 'Airbus Commercial Aircraft', 'ligne',
  'avion de ligne biréacteur', 'Monocouloir court/moyen-courrier, moteurs sous les ailes, nez arrondi caractéristique',
  NULL, NULL, 35.75, 33.91, NULL, 5,
  'https://upload.wikimedia.org/wikipedia/commons/c/c1/Airbus_A320-214%2C_Airbus_Industrie_JP7617615.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', 'Pedro Aragão', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', 'https://commons.wikimedia.org/wiki/File:Airbus_A320-214,_Airbus_Industrie_JP7617615.jpg',
  'Q18784360', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Airbus A321 (Q3278675)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'a321', 'Airbus A321', 'Airbus Commercial Aircraft', 'ligne',
  'avion commercial', 'Version allongée de l''A320, fuselage plus long, même configuration moteurs',
  '1994-01-01', NULL, NULL, NULL, NULL, 5,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Lufthansa.a321-100.d-aire.arp.jpg/1280px-Lufthansa.a321-100.d-aire.arp.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Arpingstone', 'Public domain', NULL, 'https://commons.wikimedia.org/wiki/File:Lufthansa.a321-100.d-aire.arp.jpg',
  'Q3278675', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Boeing 737 (Q6387)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'b737', 'Boeing 737', 'Boeing Commercial Airplanes', 'ligne',
  'avions de ligne monocouloirs', 'Monocouloir court/moyen-courrier, moteurs aplatis sous les ailes (nacelles ovales)',
  '1968-02-10', NULL, NULL, 34.3, 10510, 1,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Aviogenex_b737-200_yu-anp_arp.jpg/1280px-Aviogenex_b737-200_yu-anp_arp.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Photographed by Adrian Pingstone and released to the public domain. Public domainPublic domainfalsefalse This work has been released into the public domain by its author, Arpingstone. This applies worldwide. In some countries this may not be legally possible; if so: Arpingstone grants anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.', 'Public domain', NULL, 'https://commons.wikimedia.org/wiki/File:Aviogenex_b737-200_yu-anp_arp.jpg',
  'Q6387', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Airbus A380 (Q5830)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'a380', 'Airbus A380', 'Airbus Commercial Aircraft', 'ligne',
  'avion civil produit par Airbus de 2007 à 2021', 'Très gros porteur double-pont, 4 moteurs, fuselage très large, double pont visible',
  '2007-10-25', NULL, 72.72, 79.8, 251, 4,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/A6-EDY_A380_Emirates_31_jan_2013_jfk_%288442269364%29_%28cropped%29.jpg/1280px-A6-EDY_A380_Emirates_31_jan_2013_jfk_%288442269364%29_%28cropped%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Maarten Visser from Capelle aan den IJssel, Nederland', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', 'https://commons.wikimedia.org/wiki/File:A6-EDY_A380_Emirates_31_jan_2013_jfk_(8442269364)_(cropped).jpg',
  'Q5830', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Boeing 747 (Q179)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'b747', 'Boeing 747', 'Boeing Commercial Airplanes', 'ligne',
  'avion de ligne des années 1970', 'Gros porteur, 4 moteurs, bosse caractéristique sur l''avant (double pont partiel)',
  '1970-01-22', NULL, NULL, 59.64, 1574, 3,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/B-747_Iberia.jpg/1280px-B-747_Iberia.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Iberia Airlines', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', 'https://commons.wikimedia.org/wiki/File:B-747_Iberia.jpg',
  'Q179', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Concorde (Q6505)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'concorde', 'Concorde', 'British Aircraft Corporation', 'ligne',
  'premier avion de ligne supersonique franco-britannique', 'Supersonique civil, ailes delta ogives, nez en visite articulé, 4 moteurs Olympus sous les ailes',
  '1976-01-21', NULL, 61.66, 25.56, 20, 5,
  'https://upload.wikimedia.org/wikipedia/commons/e/eb/British_Airways_Concorde_G-BOAC_03.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', 'Eduard Marmet', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', 'https://commons.wikimedia.org/wiki/File:British_Airways_Concorde_G-BOAC_03.jpg',
  'Q6505', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Dassault Rafale (Q190973)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'rafale', 'Dassault Rafale', 'Dassault Aviation', 'militaire',
  'avion de chasse français des années 2000', 'Chasseur français bimoteur, delta avec canards, entrée d''air sous le nez, dérive unique',
  '2002-01-01', NULL, 15.27, 10.86, 313, 4,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Rafale_-_RIAT_2009_%283751416421%29.jpg/1280px-Rafale_-_RIAT_2009_%283751416421%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Tim Felce (Airwolfhound)', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', 'https://commons.wikimedia.org/wiki/File:Rafale_-_RIAT_2009_(3751416421).jpg',
  'Q190973', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Dassault Mirage 2000 (Q200038)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'mirage-2000', 'Dassault Mirage 2000', 'Dassault Aviation', 'militaire',
  'avion de chasse français des années 80', 'Chasseur français monomoteur, aile delta pure sans canards, dérive unique, nez plus fin',
  '1984-07-02', NULL, 14.36, 9, 601, 3,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/French_Mirage_2000_finishes_refueling_from_KC-10A_2009-12-06_mod1.jpg/1280px-French_Mirage_2000_finishes_refueling_from_KC-10A_2009-12-06_mod1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Staff Sgt. Michael B. Keller, USAF', 'Public domain', NULL, 'https://commons.wikimedia.org/wiki/File:French_Mirage_2000_finishes_refueling_from_KC-10A_2009-12-06_mod1.jpg',
  'Q200038', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- General Dynamics F-16 Fighting Falcon (Q100026)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'f16', 'General Dynamics F-16 Fighting Falcon', 'General Dynamics', 'militaire',
  'avion de chasse américain des années 1970', 'Chasseur monomoteur américain, entrée d''air ventrale, aile delta/trapézoïdale, dérive unique haute',
  '1979-01-01', NULL, 14.52, 9.96, 4604, 2,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Defense.gov_News_Photo_070720-F-5502S-003.jpg/1280px-Defense.gov_News_Photo_070720-F-5502S-003.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Capt. Tana R.H. Stevenson, U.S. Air Force', 'Public domain', NULL, 'https://commons.wikimedia.org/wiki/File:Defense.gov_News_Photo_070720-F-5502S-003.jpg',
  'Q100026', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- McDonnell Douglas F/A-18 Hornet (Q46397)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'fa18', 'McDonnell Douglas F/A-18 Hornet', 'Boeing', 'militaire',
  'avion de combat multirôle américain', 'Chasseur bimoteur américain, double dérive, entrées d''air latérales, aile trapézoïdale',
  '1983-01-07', NULL, 17.1, NULL, 1480, 3,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/F-18_overflying_water_-_%28USN%2C_USDoD%29.jpg/1280px-F-18_overflying_water_-_%28USN%2C_USDoD%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'DN-SC-04-08946', 'Public domain', NULL, 'https://commons.wikimedia.org/wiki/File:F-18_overflying_water_-_(USN,_USDoD).jpg',
  'Q46397', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Supermarine Spitfire (Q29190)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'spitfire', 'Supermarine Spitfire', 'Supermarine', 'collection',
  'avion de chasse anglais', 'Chasseur WWII britannique, aile elliptique très distinctive, moteur Merlin en étoile, hélice',
  '1938-08-04', 370, NULL, NULL, 20351, 1,
  'https://upload.wikimedia.org/wikipedia/commons/3/31/Ray_Flying_Legends_2005-1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', 'The original uploader was Bryan Fury75 at French Wikipedia.', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', 'https://commons.wikimedia.org/wiki/File:Ray_Flying_Legends_2005-1.jpg',
  'Q29190', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Hawker Hurricane (Q194251)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'hurricane', 'Hawker Hurricane', 'Hawker Aircraft', 'collection',
  'chasseur britannique de la Seconde Guerre mondiale', 'Chasseur WWII britannique, aile droite arrondie (moins elliptique que le Spitfire), fuselage plus trapu',
  '1937-01-01', NULL, NULL, NULL, 14532, 1,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Hawker_Hurricane_I_%27R4118_UP-W%27_%28G-HUPW%29_%2841455530471%29.jpg/1280px-Hawker_Hurricane_I_%27R4118_UP-W%27_%28G-HUPW%29_%2841455530471%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Alan Wilson from Stilton, Peterborough, Cambs, UK', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', 'https://commons.wikimedia.org/wiki/File:Hawker_Hurricane_I_%27R4118_UP-W%27_(G-HUPW)_(41455530471).jpg',
  'Q194251', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Douglas DC-3 (Q190211)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'dc3', 'Douglas DC-3', 'Douglas', 'ligne',
  'avion de ligne bimoteur à hélices', 'Transport classique années 1930-40, deux moteurs en étoile, aile basse, train fixe ou rétractable',
  '1936-01-01', 231, 19.63, 28.96, 607, 3,
  'https://upload.wikimedia.org/wikipedia/commons/d/df/Douglas_DC-3%2C_SE-CFP.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', 'Towpilot', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', 'https://commons.wikimedia.org/wiki/File:Douglas_DC-3,_SE-CFP.jpg',
  'Q190211', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- North American P-51 Mustang (Q192075)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'p51', 'North American P-51 Mustang', 'North American Aviation', 'collection',
  'avion militaire', 'Chasseur WWII américain, aile trapézoïdale, entrée d''air ventrale caractéristique (radiateur), hélice',
  '1942-01-01', NULL, NULL, 11.28, 16974, 1,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/P51_Mustang_-_CHino_Airshow_2014_%2814349568311%29.jpg/1280px-P51_Mustang_-_CHino_Airshow_2014_%2814349568311%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Airwolfhound from Hertfordshire, UK', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', 'https://commons.wikimedia.org/wiki/File:P51_Mustang_-_CHino_Airshow_2014_(14349568311).jpg',
  'Q192075', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();

-- Airbus A350 (Q6484)
INSERT INTO public.aircraft (
  id, name, manufacturer, category,
  description, recognition_hints,
  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,
  image_url, image_author, image_license, image_license_url, image_source_url,
  wikidata_id, visible
) VALUES (
  'a350', 'Airbus A350', 'Airbus Commercial Aircraft', 'ligne',
  'avion de ligne long-courrier et gros porteur du constructeur Airbus', 'Gros porteur long-courrier, 2 moteurs, fuselage composite sombre, bouts d''ailes courbés vers le haut',
  '2015-01-15', NULL, NULL, 64.75, 295, 4,
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Virgin_Atlantic_Airbus_A350-1041XWB_G-VLUX_%28Red_Velvet%29_approaching_JFK_Airport.jpg/1280px-Virgin_Atlantic_Airbus_A350-1041XWB_G-VLUX_%28Red_Velvet%29_approaching_JFK_Airport.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'Adam Moreira (AEMoreira042281)', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', 'https://commons.wikimedia.org/wiki/File:Virgin_Atlantic_Airbus_A350-1041XWB_G-VLUX_(Red_Velvet)_approaching_JFK_Airport.jpg',
  'Q6484', true
) ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  manufacturer      = EXCLUDED.manufacturer,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  recognition_hints = EXCLUDED.recognition_hints,
  first_flight      = EXCLUDED.first_flight,
  max_speed_kmh     = EXCLUDED.max_speed_kmh,
  length_m          = EXCLUDED.length_m,
  wingspan_m        = EXCLUDED.wingspan_m,
  units_built       = EXCLUDED.units_built,
  rarity            = EXCLUDED.rarity,
  image_url         = EXCLUDED.image_url,
  image_author      = EXCLUDED.image_author,
  image_license     = EXCLUDED.image_license,
  image_license_url = EXCLUDED.image_license_url,
  image_source_url  = EXCLUDED.image_source_url,
  wikidata_id       = EXCLUDED.wikidata_id,
  updated_at        = now();
