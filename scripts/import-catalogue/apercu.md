# Aperçu import catalogue — à relire avant import SQL

Généré le 2026-11-16 par `npm run import:catalogue` : **200 avions**.

Ordre d'import dans Supabase : `supabase/migrations/002_aircraft_details.sql`, puis `supabase/seed/aircraft.sql`.

## Remplissage des colonnes

| Donnée | Remplie | |
|---|---|---|
| Résumé (Wikipédia FR) | 200 / 200 | 100 % |
| Constructeur | 200 / 200 | 100 % |
| Premier vol | 200 / 200 | 100 % |
| Vitesse max | 17 / 200 | 9 % |
| Longueur | 150 / 200 | 75 % |
| Envergure | 164 / 200 | 82 % |
| Hauteur | 129 / 200 | 65 % |
| Autonomie | 72 / 200 | 36 % |
| Plafond | 102 / 200 | 51 % |
| Mise en service | 186 / 200 | 93 % |
| Pays d'origine | 175 / 200 | 88 % |
| Motorisation | 129 / 200 | 65 % |
| Exemplaires construits | 182 / 200 | 91 % |
| Photo | 200 / 200 | 100 % |
| Auteur de la photo | 193 / 200 | 97 % |
| Indices Gemini (test:vision) | 15 / 200 | 8 % |
| Au moins une source citée | 108 / 200 | 54 % |

La vitesse max est rarement renseignée sur Wikidata : c'est un manque de la source, pas du script.

## Répartition

| Catégorie | Avions |
|---|---|
| ligne | 53 |
| militaire | 75 |
| collection | 69 |
| autre | 3 |

| Rareté | Avions |
|---|---|
| 1 — Bronze | 22 |
| 2 — Argent | 35 |
| 3 — Or | 76 |
| 4 — Platine | 51 |
| 5 — Légendaire | 16 |

Rareté 3 par défaut quand le nombre d'exemplaires est inconnu : 18 avions.

## Avions

| id | Nom | Catégorie | 1er vol | Exempl. | Rareté | Photo | Résumé | Sources |
|---|---|---|---|---|---|---|---|---|
| a320 | Airbus A320 | ligne | 1987-02-22 | 9 693 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Airbus_A320-214,_Airbus_Industrie_JP7617615.jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A320) | 1 |
| a321 | Airbus A321 | ligne | 1993-03-11 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Lufthansa.a321-100.d-aire.arp.jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A321) | — |
| b737 | Boeing 737 | ligne | 1967-04-09 | 10 510 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Aviogenex_b737-200_yu-anp_arp.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_737) | 1 |
| a380 | Airbus A380 | ligne | 2005-04-27 | 251 | 4 | [oui](https://commons.wikimedia.org/wiki/File:A6-EDY_A380_Emirates_31_jan_2013_jfk_(8442269364)_(cropped).jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A380) | 1 |
| b747 | Boeing 747 | ligne | 1969-02-09 | 1 574 | 3 | [oui](https://commons.wikimedia.org/wiki/File:B-747_Iberia.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_747) | 3 |
| concorde | Concorde | ligne | 1969-03-02 | 20 | 5 | [oui](https://commons.wikimedia.org/wiki/File:British_Airways_Concorde_G-BOAC_03.jpg) | [oui](https://fr.wikipedia.org/wiki/Concorde_(avion)) | 7 |
| rafale | Dassault Rafale | militaire | 1986-07-04 | 313 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Rafale_-_RIAT_2009_(3751416421).jpg) | [oui](https://fr.wikipedia.org/wiki/Dassault_Rafale) | 1 |
| mirage-2000 | Dassault Mirage 2000 | militaire | 1978-03-10 | 601 | 3 | [oui](https://commons.wikimedia.org/wiki/File:French_Mirage_2000_finishes_refueling_from_KC-10A_2009-12-06_mod1.jpg) | [oui](https://fr.wikipedia.org/wiki/Dassault_Mirage_2000) | 1 |
| f16 | General Dynamics F-16 Fighting Falcon | militaire | 1974-01-20 | 4 604 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Defense.gov_News_Photo_070720-F-5502S-003.jpg) | [oui](https://fr.wikipedia.org/wiki/General_Dynamics_F-16_Fighting_Falcon) | 1 |
| fa18 | F/A-18 Hornet | militaire | 1978-11-18 | 1 480 | 3 | [oui](https://commons.wikimedia.org/wiki/File:F-18_overflying_water_-_(USN,_USDoD).jpg) | [oui](https://fr.wikipedia.org/wiki/McDonnell_Douglas_F/A-18_Hornet) | — |
| spitfire | Supermarine Spitfire | collection | 1936-03-05 | 20 351 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Ray_Flying_Legends_2005-1.jpg) | [oui](https://fr.wikipedia.org/wiki/Supermarine_Spitfire) | — |
| hurricane | Hawker Hurricane | collection | 1935-11-06 | 14 532 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Hawker_Hurricane_I_%27R4118_UP-W%27_(G-HUPW)_(41455530471).jpg) | [oui](https://fr.wikipedia.org/wiki/Hawker_Hurricane) | — |
| dc3 | Douglas DC-3 | collection | 1935-12-17 | 607 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Douglas_DC-3,_SE-CFP.jpg) | [oui](https://fr.wikipedia.org/wiki/Douglas_DC-3) | 5 |
| p51 | North American P-51 Mustang | collection | 1940-10-26 | 16 974 | 1 | [oui](https://commons.wikimedia.org/wiki/File:P51_Mustang_-_CHino_Airshow_2014_(14349568311).jpg) | [oui](https://fr.wikipedia.org/wiki/North_American_P-51_Mustang) | — |
| a350 | Airbus A350 | ligne | 2013-06-14 | 295 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Virgin_Atlantic_Airbus_A350-1041XWB_G-VLUX_(Red_Velvet)_approaching_JFK_Airport.jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A350) | 1 |
| lockheed-martin-f-22-raptor | Lockheed Martin F-22 Raptor | militaire | 1997-09-07 | 195 | 4 | [oui](https://commons.wikimedia.org/wiki/File:192d_FW_F-22_Raptor.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_Martin_F-22_Raptor) | 8 |
| boeing-777 | Boeing 777 | ligne | 1994-06-12 | 1 662 | 3 | [oui](https://commons.wikimedia.org/wiki/File:United_Airlines_777_N797UA_LAX.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_777) | 1 |
| lockheed-martin-f-35-lightning-ii | Lockheed Martin F-35 Lightning II | militaire | 2006-12-15 | 610 | 3 | [oui](https://commons.wikimedia.org/wiki/File:F-35_at_Edwards.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_Martin_F-35_Lightning_II) | 6 |
| boeing-787-dreamliner | Boeing 787 | ligne | 2009-12-15 | 1 005 | 3 | [oui](https://commons.wikimedia.org/wiki/File:All_Nippon_Airways,_Boeing_787-8_JA828A_NRT_(23661189691).jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_787) | 1 |
| northrop-b-2-spirit | B-2 Spirit | militaire | 1989-07-17 | 33 | 5 | [oui](https://commons.wikimedia.org/wiki/File:RAF_F-35B_integration_flying_training_with_USAF_B-2_30092019_-_4.jpg) | [oui](https://fr.wikipedia.org/wiki/Northrop_B-2_Spirit) | 2 |
| mikoyan-mig-29 | Mikoyan-Gourevitch MiG-29 | militaire | 1977-10-06 | 1 600 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Russian_Air_Force_Mikoyan-Gurevich_MiG-29S_Naumenko-1.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-29) | 2 |
| boeing-707 | Boeing 707 | ligne | 1957-12-20 | 1 010 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Ecuatoriana_Boeing_707-321C_Hoppe.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_707) | 2 |
| mikoyan-gurevich-mig-21 | MiG-21 | militaire | 1956-02-14 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Czechoslovak_Air_Force_Mikoyan-Gurevich_MiG-21R_Lofting-4.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-21) | 2 |
| antonov-an-225-mriya | Antonov An-225 | militaire | 1988-12-21 | 1 | 5 | [oui](https://commons.wikimedia.org/wiki/File:Antonov_An-225_Beltyukov-1.jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-225_Mriya) | 8 |
| boeing-b-52-stratofortress | Boeing B-52 Stratofortress | militaire | 1952-04-15 | 744 | 3 | [oui](https://commons.wikimedia.org/wiki/File:An_air-to-air_left_underside_view_of_the_92nd_Bombardment_Wing%27s_new_camouflaged_B-52G_Stratofortress_aircraft_DF-ST-85-12450.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_B-52_Stratofortress) | 4 |
| lockheed-c-130-hercules | Lockheed C-130 Hercules | militaire | 1954-08-23 | 2 600 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Lockheed_C-130_Hercules.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_C-130_Hercules) | 3 |
| boeing-727 | Boeing 727 | ligne | 1963-02-09 | 1 832 | 3 | [oui](https://commons.wikimedia.org/wiki/File:B-727_Iberia_(cropped).jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_727) | — |
| tupolev-tu-154 | Tupolev Tu-154 | ligne | 1968-10-04 | 1 026 | 3 | [oui](https://commons.wikimedia.org/wiki/File:RA-85019_T154(M)_Special_Flight_Squadron_Rossiya_(Russian_Government)_VKO_UUWW_(32966735944).jpg) | [oui](https://fr.wikipedia.org/wiki/Tupolev_Tu-154) | 2 |
| sukhoi-su-27 | Sukhoi Su-27 | militaire | 1977-05-20 | 809 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Su-27SM3_in_flight,_Celebration_of_the_100th_anniversary_of_Russian_Air_Force.jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-27) | 2 |
| mcdonnell-douglas-f-15-eagle | McDonnell Douglas F-15 Eagle | militaire | 1972-07-27 | 1 198 | 3 | [oui](https://commons.wikimedia.org/wiki/File:F-15C_Eagle_from_the_44th_Fighter_Squadron_flies_during_a_routine_training_exercise_April_15,_2019.jpg) | [oui](https://fr.wikipedia.org/wiki/McDonnell_Douglas_F-15_Eagle) | 1 |
| eurofighter-typhoon | Eurofighter Typhoon | militaire | 1994-03-27 | 926 | 3 | [oui](https://commons.wikimedia.org/wiki/File:RAF_Eurofighter_EF-2000_Typhoon_F2_Lofting-1.jpg) | [oui](https://fr.wikipedia.org/wiki/Eurofighter_Typhoon) | — |
| sukhoi-su-30 | Soukhoï Su-30 | militaire | 1989-12-31 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Sukhoi_Su-30MK_of_the_Russian_Air_Force.jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-30) | — |
| airbus-a330 | Airbus A330 | ligne | 1992-11-02 | 1 378 | 3 | [oui](https://commons.wikimedia.org/wiki/File:F-WWCB_A330-203_Airbus_Industrie_TLS_27SEP13_(9972134676).jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A330) | — |
| boeing-767 | Boeing 767 | ligne | 1981-09-26 | 1 326 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Delta_Air_Lines_B767-332_N130DL.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_767) | 1 |
| boeing-b-17-flying-fortress | Boeing B-17 Flying Fortress | collection | 1935-07-28 | 12 731 | 1 | [oui](https://commons.wikimedia.org/wiki/File:B17_-_Chino_Airshow_2014_(framed).jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_B-17_Flying_Fortress) | — |
| tupolev-tu-144 | Tupolev Tu-144 | ligne | 1968-12-31 | 16 | 5 | [oui](https://commons.wikimedia.org/wiki/File:.00_0896_Supersonic_Airliner_Concorde.jpg) | [oui](https://fr.wikipedia.org/wiki/Tupolev_Tu-144) | — |
| airbus-a340 | Airbus A340 | ligne | 1991-10-25 | 377 | 4 | [oui](https://commons.wikimedia.org/wiki/File:A340-600.jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A340) | — |
| grumman-f-14-tomcat | F-14 Tomcat | militaire | 1970-12-21 | 712 | 3 | [oui](https://commons.wikimedia.org/wiki/File:F-14A_Tomcat_over_Iraq_during_Southern_Watch.jpg) | [oui](https://fr.wikipedia.org/wiki/Grumman_F-14_Tomcat) | 2 |
| lockheed-f-117-nighthawk | Lockheed F-117 Nighthawk | militaire | 1981-06-18 | 64 | 4 | [oui](https://commons.wikimedia.org/wiki/File:F-117_Nighthawk_Front.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_F-117_Nighthawk) | 9 |
| boeing-757 | Boeing 757 | ligne | 1982-02-19 | 1 050 | 3 | [oui](https://commons.wikimedia.org/wiki/File:American_Airlines_Boeing_757-200_N605AA_SJC.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_757) | 3 |
| airbus-a300 | Airbus A300 | ligne | 1972-10-28 | 561 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Airbus_A300B4-603,_Lufthansa_AN0520385.jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A300) | 2 |
| saab-jas-39-gripen | Saab JAS 39 Gripen | militaire | 1988-12-09 | 264 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Saab_JAS-39_Gripen_of_the_Czech_Air_Force_taking_off_from_AFB_%C4%8C%C3%A1slav.jpg) | [oui](https://fr.wikipedia.org/wiki/Saab_JAS_39_Gripen) | 2 |
| mcdonnell-douglas-f-4-phantom-ii | McDonnell Douglas F-4 Phantom II | militaire | 1958-05-27 | 5 195 | 2 | [oui](https://commons.wikimedia.org/wiki/File:McDonnell_F-4B_Phantom_II_of_VF-111_in_flight,_in_1973.jpg) | [oui](https://fr.wikipedia.org/wiki/McDonnell_Douglas_F-4_Phantom_II) | — |
| boeing-b-29-superfortress | Boeing B-29 Superfortress | collection | 1942-09-21 | 3 970 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Boeing_B-29_Superfortress_Bockscar_2_USAF.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_B-29_Superfortress) | 1 |
| mikoyan-gurevich-mig-15 | Mikoyan-Gourevitch MiG-15 | collection | 1947-12-30 | 15 560 | 1 | [oui](https://commons.wikimedia.org/wiki/File:MiG-15_RB1.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-15) | 1 |
| sukhoi-su-35 | Soukhoï Su-35 | militaire | 2008-02-19 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Sukhoi_Su-35_on_MAKS-2011.jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-35) | — |
| messerschmitt-bf-109 | Messerschmitt Bf 109 | collection | 1935-05-01 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Me109_G-6_D-FMBB_1.jpg) | [oui](https://fr.wikipedia.org/wiki/Messerschmitt_Bf_109) | — |
| sukhoi-su-24 | Su-24 | militaire | 1970-01-17 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Sukhoi_Su-24_inflight_Mishin-3.jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-24) | 1 |
| mikoyan-mig-31 | MiG-31 | militaire | 1975-09-16 | 519 | 3 | [oui](https://commons.wikimedia.org/wiki/File:MiG-31_Pichugin-1.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-31) | — |
| mikoyan-gurevich-mig-25 | Mikoyan-Gourevitch MiG-25 | militaire | 1964-03-05 | 1 190 | 3 | [oui](https://commons.wikimedia.org/wiki/File:MiG-25RBS_Pichugin-1.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-25) | — |
| mikoyan-gurevich-mig-23 | Mikoyan-Gurevich MiG-23 | militaire | 1967-06-10 | 5 047 | 2 | [oui](https://commons.wikimedia.org/wiki/File:MiG-23-red12.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-23) | — |
| sukhoi-su-57 | Su-57 | militaire | 2010-01-29 | 10 | 5 | [oui](https://commons.wikimedia.org/wiki/File:Sukhoi_T-50_in_2011_(4).jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-57) | — |
| ilyushin-il-76 | Ilyushin Il-76 | militaire | 1971-03-25 | 950 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Ilyushin_IL-76MD_-_Ukrainian_Air_Force_-_76683_(48367735331_cropped).jpg) | [oui](https://fr.wikipedia.org/wiki/Iliouchine_Il-76) | 3 |
| lockheed-sr-71-blackbird | Lockheed SR-71 Blackbird | militaire | 1964-12-22 | 29 | 5 | [oui](https://commons.wikimedia.org/wiki/File:SR-71A_in_flight_near_Beale_AFB_1988.JPEG) | [oui](https://fr.wikipedia.org/wiki/Lockheed_SR-71_Blackbird) | 10 |
| sukhoi-su-25 | Su-25 | militaire | 1975-02-22 | 1 320 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Su-25_in_flight_01.JPEG) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-25) | 2 |
| rockwell-b-1-lancer | Rockwell B-1 Lancer | militaire | 1974-12-23 | 100 | 4 | [oui](https://commons.wikimedia.org/wiki/File:B-1B.jpg) | [oui](https://fr.wikipedia.org/wiki/Rockwell_B-1_Lancer) | 1 |
| mitsubishi-a6m-zero | Mitsubishi A6M | collection | 1939-04-01 | 11 000 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Mitsubishi_A6M_Zero_Replica.jpg) | [oui](https://fr.wikipedia.org/wiki/Mitsubishi_A6M) | — |
| mikoyan-gurevich-mig-17 | Mikoyan-Gourevitch MiG-17 | collection | 1950-01-14 | 10 649 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Wingsoverpgh_IMG_2448_(34572173392).jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-17) | 1 |
| lockheed-u-2 | Lockheed U-2 | militaire | 1955-08-01 | 104 | 4 | [oui](https://commons.wikimedia.org/wiki/File:5th_Reconnaissance_Squadron_-_U-2_Osan.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_U-2) | 3 |
| fairchild-republic-a-10-thunderbolt-ii | Fairchild A-10 Thunderbolt II | militaire | 1972-05-10 | 716 | 3 | [oui](https://commons.wikimedia.org/wiki/File:A10Thunderbolt2_990422-F-7910D-517.jpg) | [oui](https://fr.wikipedia.org/wiki/Fairchild_A-10_Thunderbolt_II) | 2 |
| antonov-an-124-ruslan | Antonov An-124 | militaire | 1982-12-26 | 55 | 4 | [oui](https://commons.wikimedia.org/wiki/File:%D0%90%D0%BD%D1%82%D0%BE%D0%BD%D0%BE%D0%B2_%D0%90%D0%BD-124_9773054055093,_%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0_-_%D0%94%D0%BE%D0%BC%D0%BE%D0%B4%D0%B5%D0%B4%D0%BE%D0%B2%D0%BE_RP2297.jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-124) | 2 |
| boeing-717 | Boeing 717 | ligne | 1998-09-02 | 156 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Blue1_Boeing_717-200_OH-BLJ_ARN_2012-6-30.png) | [oui](https://fr.wikipedia.org/wiki/Boeing_717) | 1 |
| airbus-a310 | Airbus A310 | ligne | 1982-04-03 | 255 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Air_Transat_A310_(C-GTSF)_@_LHR,_Aug_2009.jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A310) | 1 |
| north-american-f-86-sabre | F-86 Sabre | collection | 1947-10-01 | 8 740 | 2 | [oui](https://commons.wikimedia.org/wiki/File:F-86_Sabre_hertiage_flight.jpg) | [oui](https://fr.wikipedia.org/wiki/North_American_F-86_Sabre) | — |
| sukhoi-su-34 | Soukhoï Su-34 | militaire | 1990-04-13 | 143 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Russian_Air_Force_Sukhoi_Su-34_Beltyukov-1.jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-34) | 2 |
| junkers-ju-87 | Ju 87 | collection | 1935-09-17 | 6 500 | 2 | [oui](https://commons.wikimedia.org/wiki/File:StukaRA.jpg) | [oui](https://fr.wikipedia.org/wiki/Junkers_Ju_87) | — |
| messerschmitt-me-262 | Messerschmitt Me 262 | collection | 1942-07-18 | 1 433 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Me_262_flight_show_at_ILA_2006_(cropped).jpg) | [oui](https://fr.wikipedia.org/wiki/Messerschmitt_Me_262) | — |
| republic-p-47-thunderbolt | Republic P-47 Thunderbolt | collection | 1941-05-06 | 15 686 | 1 | [oui](https://commons.wikimedia.org/wiki/File:P47_Thunderbolt_-_Chino_Airshow_2014.jpg) | [oui](https://fr.wikipedia.org/wiki/Republic_P-47_Thunderbolt) | — |
| antonov-an-2 | Antonov An-2 | autre | 1947-08-31 | 18 000 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Antonov_An-2_OK-HFL_amk_(cropped).jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-2) | 4 |
| atr-72 | ATR 72 | ligne | 1988-10-27 | 1 500 | 3 | [oui](https://commons.wikimedia.org/wiki/File:ATR_ATR-72-202,_LOT_-_Polish_Airlines_-_Polskie_Linie_Lotnicze_(EuroLOT)_AN2020929.jpg) | [oui](https://fr.wikipedia.org/wiki/ATR_72) | 1 |
| boeing-f-a-18e-f-super-hornet | Boeing F/A-18E/F Super Hornet | militaire | 1995-11-29 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:081102-N-0000C-002.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_F/A-18E/F_Super_Hornet) | — |
| lockheed-p-38-lightning | Lockheed P-38 Lightning | collection | 1939-01-27 | 10 037 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Lockheed_P-38J_Lightning,_Chino,_California.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_P-38_Lightning) | — |
| mikoyan-gurevich-mig-19 | Mikoyan-Gourevitch MiG-19 | militaire | 1953-09-18 | 6 500 | 2 | [oui](https://commons.wikimedia.org/wiki/File:0312_a_MiG-19S_preserved_at_Horni_Nemci_Czech_Republic_(3117339353).jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-19) | 1 |
| junkers-ju-88 | Junkers Ju 88 | collection | 1936-12-21 | 14 882 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_101I-417-1766-03A,_Flugzeug_Junkers_Ju_88.jpg) | [oui](https://fr.wikipedia.org/wiki/Junkers_Ju_88) | — |
| boeing-c-17-globemaster-iii | Boeing C-17 Globemaster III | militaire | 1991-09-15 | 279 | 4 | [oui](https://commons.wikimedia.org/wiki/File:C-17_4.jpg) | [oui](https://fr.wikipedia.org/wiki/McDonnell_Douglas_C-17_Globemaster_III) | — |
| ilyushin-il-2 | Il-2 Sturmovik | collection | 1939-10-02 | 36 163 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Ilyushin_Il-2M3_-_%D0%98%D0%BB%D1%8C%D1%8E%D1%88%D0%B8%D0%BD_%D0%98%D0%BB-2M3_30May1945_over_Berlin.png) | [oui](https://fr.wikipedia.org/wiki/Iliouchine_Il-2) | — |
| airbus-beluga | Airbus A300-600ST Beluga | ligne | 1994-09-13 | 5 | 5 | [oui](https://commons.wikimedia.org/wiki/File:Airbus_Beluga_Airbus_A300B4-608ST_F-GSTA_(28858044414).jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A300-600ST) | 9 |
| tupolev-tu-134 | Tupolev Tu-134 | ligne | 1963-07-29 | 854 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Tupolev_Tu-134_of_Aviogenex.jpg) | [oui](https://fr.wikipedia.org/wiki/Tupolev_Tu-134) | 3 |
| mikoyan-mig-35 | Mikoyan-Gourevitch MiG-35 | militaire | 2007-02-07 | 6 | 5 | [oui](https://commons.wikimedia.org/wiki/File:Mikoyan-Gurevich_MiG-35_MAKS%272007_Pichugin.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-35) | 1 |
| cessna-172 | Cessna 172 Skyhawk | autre | 1955-01-01 | 44 000 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Cessna_172S_Skyhawk_%E2%80%98G-JMKE%E2%80%99_(45077563364).jpg) | [oui](https://fr.wikipedia.org/wiki/Cessna_172) | 2 |
| heinkel-he-111 | Heinkel He 111 | collection | 1935-02-24 | 6 508 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_101I-343-0694-21,_Belgien-Frankreich,_Flugzeug_Heinkel_He_111.jpg) | [oui](https://fr.wikipedia.org/wiki/Heinkel_He_111) | — |
| mikoyan-gurevich-mig-3 | Mikoyan-Gourevitch MiG-3 | collection | 1940-01-01 | 3 172 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Mikoyan-Gurevich_MiG-3_(MAKS-2007)_cropped.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-3) | — |
| airbus-a400m-atlas | Airbus A400M Atlas | militaire | 2009-12-11 | 80 | 4 | [oui](https://commons.wikimedia.org/wiki/File:EC-402_-_A400M_-_Airbus_industrie_-_TLS_-_En_finale_sur_32L_-_04550-2.jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A400M_Atlas) | 1 |
| lockheed-c-5-galaxy | Lockheed C-5 Galaxy | militaire | 1968-06-30 | 131 | 4 | [oui](https://commons.wikimedia.org/wiki/File:C5_galaxy.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_C-5_Galaxy) | — |
| avro-lancaster | Avro Lancaster | collection | 1941-01-09 | 7 377 | 2 | [oui](https://commons.wikimedia.org/wiki/File:The_Royal_Air_Force_in_Britain,_29_September_1942_TR197.jpg) | [oui](https://fr.wikipedia.org/wiki/Avro_Lancaster) | — |
| curtiss-p-40-warhawk | Curtiss P-40 Warhawk | collection | 1938-10-14 | 13 738 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Curtiss_P-40_Warhawk_airshow.jpg) | [oui](https://fr.wikipedia.org/wiki/Curtiss_P-40_Warhawk) | — |
| de-havilland-mosquito | Mosquito | collection | 1940-11-25 | 7 781 | 2 | [oui](https://commons.wikimedia.org/wiki/File:RAF_Mosquito_with_Molins_gun_WWII_IWM_CH_14114.jpg) | [oui](https://fr.wikipedia.org/wiki/De_Havilland_DH.98_Mosquito) | — |
| airbus-a220 | Airbus A220 | ligne | 2015-02-27 | 455 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Airbus_A220-300.jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A220) | 1 |
| mcdonnell-douglas-dc-10 | McDonnell Douglas DC-10 | ligne | 1970-08-29 | 446 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Continental_Airlines_DC-10.jpg) | [oui](https://fr.wikipedia.org/wiki/McDonnell_Douglas_DC-10) | — |
| atr-42 | ATR 42 | ligne | 1984-08-16 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:D-BCRS_European_Air_Express_(EAE)_(2185550037).jpg) | [oui](https://fr.wikipedia.org/wiki/ATR_42) | — |
| mcdonnell-douglas-f-15e-strike-eagle | McDonnell Douglas F-15E Strike Eagle | militaire | 1986-12-11 | 470 | 4 | [oui](https://commons.wikimedia.org/wiki/File:F-15E_Strike_Eagle_over_Afghanistan.jpg) | [oui](https://fr.wikipedia.org/wiki/McDonnell_Douglas_F-15E_Strike_Eagle) | 4 |
| vought-f4u-corsair | F4U Corsair | collection | 1940-05-29 | 12 618 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Vought_F4U_Corsair_(USMC).jpg) | [oui](https://fr.wikipedia.org/wiki/Chance_Vought_F4U_Corsair) | — |
| panavia-tornado | Panavia Tornado | militaire | 1974-08-14 | 992 | 3 | [oui](https://commons.wikimedia.org/wiki/File:German_Panavia_Tornado.JPG) | [oui](https://fr.wikipedia.org/wiki/Panavia_Tornado) | 1 |
| douglas-dc-8 | Douglas DC-8 | ligne | 1958-05-30 | 556 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Iberia_-_Douglas_DC-8-63.jpg) | [oui](https://fr.wikipedia.org/wiki/Douglas_DC-8) | — |
| mikoyan-mig-27 | Mikoyan-Gourevitch MiG-27 | militaire | 1970-08-20 | 1 075 | 3 | [oui](https://commons.wikimedia.org/wiki/File:MiG-27_take_off.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-27) | 2 |
| antonov-an-26 | Antonov An-26 | militaire | 1969-05-21 | 1 403 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Antonov_An-26B,_Air-Urga_JP7560169.jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-26) | 6 |
| lockheed-f-104-starfighter | Lockheed F-104 Starfighter | collection | 1956-02-17 | 2 578 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Lockheed_F-104G_Starfighter_D-8114_(9179542542).jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_F-104_Starfighter) | — |
| ilyushin-il-62 | Iliouchine Il-62 | ligne | 1963-01-03 | 292 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Air_Koryo_IL-62M_P-881.JPG) | [oui](https://fr.wikipedia.org/wiki/Iliouchine_Il-62) | 2 |
| antonov-an-12 | Antonov An-12 | militaire | 1957-12-16 | 1 248 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Antonov_An-12B,_Antonov_Design_Bureau_AN0373725.jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-12) | 5 |
| north-american-x-15 | North American X-15 | collection | 1959-06-08 | 4 | 5 | [oui](https://commons.wikimedia.org/wiki/File:North_American_X-15.jpg) | [oui](https://fr.wikipedia.org/wiki/North_American_X-15) | — |
| grumman-f6f-hellcat | F6F Hellcat | collection | 1942-06-26 | 12 275 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Grumman_F6F_Hellcat_-_Chino_Airshow_2014_(16581440362).jpg) | [oui](https://fr.wikipedia.org/wiki/Grumman_F6F_Hellcat) | — |
| focke-wulf-fw-190 | Focke-Wulf Fw 190 | collection | 1939-06-01 | 19 500 | 1 | [oui](https://commons.wikimedia.org/wiki/File:FW190_-_Chino_Airshow_2014_(15246309761).jpg) | [oui](https://fr.wikipedia.org/wiki/Focke-Wulf_Fw_190) | — |
| messerschmitt-bf-110 | Bf 110 | collection | 1936-05-12 | 6 170 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_101I-360-2095-23,_Flugzeuge_Messerschmitt_Me_110.jpg) | [oui](https://fr.wikipedia.org/wiki/Messerschmitt_Bf_110) | — |
| tupolev-tu-16 | Tu-16 | collection | 1952-04-27 | 1 509 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Tu-16badger_2.jpg) | [oui](https://fr.wikipedia.org/wiki/Tupolev_Tu-16) | 1 |
| consolidated-b-24-liberator | Consolidated B-24 Liberator | collection | 1939-12-29 | 18 482 | 1 | [oui](https://commons.wikimedia.org/wiki/File:B24J-The_Dragon_And_His_Tail.jpg) | [oui](https://fr.wikipedia.org/wiki/Consolidated_B-24_Liberator) | — |
| sukhoi-su-33 | Soukhoï Su-33 | militaire | 1987-08-17 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Sukhoi_Su-33_in_2010_(5).jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-33) | 1 |
| junkers-ju-52 | Junkers Ju 52/3m | collection | 1932-03-07 | 4 845 | 2 | [oui](https://commons.wikimedia.org/wiki/File:100820_Speyer_Museum_(17).jpg) | [oui](https://fr.wikipedia.org/wiki/Junkers_Ju_52) | — |
| mcdonnell-douglas-md-11 | McDonnell Douglas MD-11 | ligne | 1990-01-10 | 200 | 4 | [oui](https://commons.wikimedia.org/wiki/File:KLM_McDonnell_Douglas_MD-11_PH-KCK_Ingrid_Bergman.jpg) | [oui](https://fr.wikipedia.org/wiki/McDonnell_Douglas_MD-11) | 2 |
| ilyushin-il-86 | Iliouchine Il-86 | ligne | 1976-12-22 | 106 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Aeroflot_RA_Ilyushin_Il-86_von_Wedelstaedt.jpg) | [oui](https://fr.wikipedia.org/wiki/Iliouchine_Il-86) | 1 |
| lockheed-ac-130 | AC-130 | militaire | 1966-01-01 | 47 | 5 | [oui](https://commons.wikimedia.org/wiki/File:AC-130H_flies_along_Northwest_Florida_coast.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_AC-130) | — |
| tupolev-tu-204 | Tupolev Tu-204 | ligne | 1989-01-02 | 76 | 4 | [oui](https://commons.wikimedia.org/wiki/File:KMV_T204_RA-64022.jpg) | [oui](https://fr.wikipedia.org/wiki/Tupolev_Tu-204) | — |
| sukhoi-su-17 | Su-17 | militaire | 1966-08-02 | 2 867 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Su-17_(12387980854).jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-17) | 2 |
| boeing-e-3-sentry | Boeing E-3 Sentry | militaire | 1972-02-09 | 68 | 4 | [oui](https://commons.wikimedia.org/wiki/File:060610-SKP-E-3-01.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_E-3_Sentry) | 2 |
| ilyushin-il-96 | Iliouchine Il-96 | ligne | 1988-09-28 | 30 | 5 | [oui](https://commons.wikimedia.org/wiki/File:RA96010_(6715454961).jpg) | [oui](https://fr.wikipedia.org/wiki/Iliouchine_Il-96) | — |
| north-american-b-25-mitchell | North American B-25 Mitchell | collection | 1940-08-19 | 9 984 | 2 | [oui](https://commons.wikimedia.org/wiki/File:N9643C_(7938842996).jpg) | [oui](https://fr.wikipedia.org/wiki/North_American_B-25_Mitchell) | — |
| antonov-an-32 | An-32 | ligne | 1976-07-09 | 361 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Antonov_An-32_9Q-CAC.jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-32) | 2 |
| mikoyan-gurevich-mig-1 | MiG-1 | collection | 1940-04-05 | 100 | 4 | [oui](https://commons.wikimedia.org/wiki/File:MiG-1.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-1) | — |
| chengdu-j-20 | Chengdu J-20 | militaire | 2011-01-11 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:J-20_at_Airshow_China_2016.jpg) | [oui](https://fr.wikipedia.org/wiki/Chengdu_J-20) | — |
| northrop-grumman-b-21-raider | Northrop Grumman B-21 | militaire | 2023-11-10 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:B-21_Plant_42_hangar.jpg) | [oui](https://fr.wikipedia.org/wiki/Northrop_Grumman_B-21_Raider) | 1 |
| lockheed-l-1011-tristar | Lockheed L-1011 TriStar | ligne | 1970-11-16 | 250 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Lockheed_L-1011-385-1_TriStar_1_demonstrator_with_additional_Court_Line_titles.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_L-1011_TriStar) | 2 |
| airbus-a320neo-family | Airbus A320neo | ligne | 2014-09-25 | 474 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Airbus_A320-271N_NEO_D-AVVA.jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A320neo) | — |
| sukhoi-su-7 | Su-7 | collection | 1955-09-07 | 1 874 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Su7bkl_mob.jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-7) | 1 |
| dassault-mirage-iii | Dassault Mirage III | militaire | 1956-11-17 | 1 422 | 3 | [oui](https://commons.wikimedia.org/wiki/File:RAAF_Mirage.jpg) | [oui](https://fr.wikipedia.org/wiki/Dassault_Mirage_III) | 2 |
| yakovlev-yak-40 | Yakovlev Yak-40 | ligne | 1966-10-21 | 1 011 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Tulpar_Air_Yakovlev_Yak-40.jpg) | [oui](https://fr.wikipedia.org/wiki/Yakovlev_Yak-40) | 4 |
| antonov-an-22 | Antonov An-22 | ligne | 1965-02-27 | 68 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Antonov_An-22_2.jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-22) | 6 |
| bell-x-1 | X-1 | autre | 1946-01-19 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Bell_X-1_in_flight.jpg) | [oui](https://fr.wikipedia.org/wiki/Bell_X-1) | 1 |
| mikoyan-gurevich-mig-9 | Mikoyan-Gourevitch MiG-9 | militaire | 1946-04-24 | 598 | 3 | [oui](https://commons.wikimedia.org/wiki/File:MiG-9_VVS_museum.jpg) | [oui](https://fr.wikipedia.org/wiki/Mikoyan-Gourevitch_MiG-9) | 1 |
| de-havilland-comet | De Havilland DH 106 Comet | collection | 1949-07-27 | 114 | 4 | [oui](https://commons.wikimedia.org/wiki/File:BEA_de_Havilland_DH-106_Comet_4B_Berlin.jpg) | [oui](https://fr.wikipedia.org/wiki/De_Havilland_Comet) | 1 |
| dassault-mirage-f1 | Mirage F1 | militaire | 1966-12-23 | 730 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Ecuadorian_Air_Force_Dassault_Mirage_F1E.jpg) | [oui](https://fr.wikipedia.org/wiki/Dassault_Mirage_F1) | — |
| grumman-f4f-wildcat | Grumman F4F Wildcat | collection | 1937-09-02 | 7 885 | 2 | [oui](https://commons.wikimedia.org/wiki/File:FM-2_N86572_150502.JPG) | [oui](https://fr.wikipedia.org/wiki/Grumman_F4F_Wildcat) | — |
| antonov-an-24 | Antonov An-24 | ligne | 1959-12-20 | 1 367 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Mordovia_Airlines_Antonov_An-24.jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-24) | — |
| sukhoi-su-15 | Su-15 | militaire | 1962-05-30 | 1 300 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Su-15_Flagon.jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-15) | 5 |
| messerschmitt-me-163-komet | Messerschmitt Me 163 Komet | collection | 1941-09-01 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Messerschmitt_Me_163B_USAF.jpg) | [oui](https://fr.wikipedia.org/wiki/Messerschmitt_Me_163_Komet) | — |
| lockheed-p-3-orion | Lockheed P-3 Orion | militaire | 1959-11-01 | 757 | 3 | [oui](https://commons.wikimedia.org/wiki/File:US_Navy_030129-N-0226M-002_P-3C_Orion.jpg) | [oui](https://fr.wikipedia.org/wiki/Lockheed_P-3_Orion) | 2 |
| hal-tejas | HAL Tejas | militaire | 2001-01-04 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:HAL_Tejas.jpg) | [oui](https://fr.wikipedia.org/wiki/HAL_Tejas) | 1 |
| mcdonnell-douglas-md-80 | McDonnell Douglas MD-80/MD-90 | ligne | 1979-10-18 | 1 191 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Andes_L%C3%ADneas_A%C3%A9reas_MD-83_(LV-BTH),_February_2009.jpg) | [oui](https://fr.wikipedia.org/wiki/McDonnell_Douglas_MD-80) | 2 |
| avro-vulcan | Avro Vulcan | collection | 1952-08-30 | 136 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Avro_Vulcan_Bomber_RAF.JPEG) | [oui](https://fr.wikipedia.org/wiki/Avro_Vulcan) | — |
| mcdonnell-douglas-dc-9 | Douglas DC-9 | ligne | 1965-02-25 | 976 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Northwest_N756NW_DC9.JPG) | [oui](https://fr.wikipedia.org/wiki/Douglas_DC-9) | — |
| general-dynamics-f-111-aardvark | General Dynamics F-111 Aardvark | militaire | 1964-12-21 | 563 | 3 | [oui](https://commons.wikimedia.org/wiki/File:F-111_2.jpg) | [oui](https://fr.wikipedia.org/wiki/General_Dynamics_F-111_Aardvark) | 2 |
| northrop-f-5 | Northrop F-5 | militaire | 1959-07-30 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Northrop_F-5E_(Tail_No._01557)_061006-F-1234S-073.jpg) | [oui](https://fr.wikipedia.org/wiki/Northrop_F-5_Freedom_Fighter) | 1 |
| yakovlev-yak-9 | Yakovlev Yak-9 | collection | 1942-01-01 | 16 769 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Yak-9-1978.jpg) | [oui](https://fr.wikipedia.org/wiki/Yakovlev_Yak-9) | — |
| consolidated-pby-catalina | Consolidated PBY Catalina | collection | 1935-03-28 | 3 305 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Consolidated_PBY_Catalina,_Fantasy_Of_Flight_Museum,_Florida_(1).jpg) | [oui](https://fr.wikipedia.org/wiki/Consolidated_PBY_Catalina) | — |
| douglas-sbd-dauntless | Douglas SBD Dauntless | collection | 1940-05-01 | 5 936 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Douglas_SBD-5_Dauntless_Feb1944.png) | [oui](https://fr.wikipedia.org/wiki/Douglas_SBD_Dauntless) | — |
| bristol-blenheim | Bristol Blenheim | collection | 1935-04-12 | 4 422 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Bristol_Blenheim_ExCC.jpg) | [oui](https://fr.wikipedia.org/wiki/Bristol_Blenheim) | — |
| boeing-737-max | Boeing 737 MAX | ligne | 2016-01-29 | 370 | 4 | [oui](https://commons.wikimedia.org/wiki/File:C-FSJJ_(43123199145).jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_737_Max) | 1 |
| yakovlev-yak-42 | Yakovlev Yak-42 | ligne | 1975-03-07 | 183 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Yak-42D_(5742470447).jpg) | [oui](https://fr.wikipedia.org/wiki/Yakovlev_Yak-42) | 3 |
| fokker-f27-friendship | Fokker F27 | ligne | 1955-11-24 | 793 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Busy_Bee_F-27_at_Basel_1982.jpg) | [oui](https://fr.wikipedia.org/wiki/Fokker_F27) | — |
| polikarpov-i-16 | Polikarpov I-16 | collection | 1933-12-30 | 8 644 | 2 | [oui](https://commons.wikimedia.org/wiki/File:OSH2003_Polikarpov_I-16.jpg) | [oui](https://fr.wikipedia.org/wiki/Polikarpov_I-16) | 5 |
| douglas-c-47-skytrain | Douglas C-47 Skytrain | collection | 1941-12-23 | 10 174 | 1 | [oui](https://commons.wikimedia.org/wiki/File:C-47_Dakota_-_Chino_Airshow_2014_(15867578416).jpg) | [oui](https://fr.wikipedia.org/wiki/Douglas_C-47_Skytrain) | — |
| grumman-tbf-avenger | Grumman Avenger | collection | 1941-08-07 | 9 839 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Grumman_TBM_Avenger,_Chino,_California.jpg) | [oui](https://fr.wikipedia.org/wiki/Grumman_TBF_Avenger) | — |
| de-havilland-canada-dash-8 | de Havilland Canada DHC-8 | ligne | 1983-06-20 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:D-ABQR_Bombardier_Dash_8-Q400_airberlin_Eurowings_opb_LGW_DUS_2018-07-31_(33a)_(44206314192).jpg) | [oui](https://fr.wikipedia.org/wiki/Bombardier_Q_Series) | 2 |
| boeing-747-8 | Boeing 747-8 | ligne | 2010-02-08 | 110 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Lufthansa_Boeing_747-830_D-ABYL_%22Hessen%22_(29613598941).jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_747-8) | — |
| douglas-a-4-skyhawk | Douglas A-4 Skyhawk | collection | 1954-06-22 | 2 960 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Last_bulit_A-4_Skyhawk_in_flight_in_February_1979.jpg) | [oui](https://fr.wikipedia.org/wiki/Douglas_A-4_Skyhawk) | — |
| bell-p-39-airacobra | Bell P-39 Airacobra | collection | 1938-04-06 | 9 584 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Bell_P-39Q_Airacobra_USAF.jpg) | [oui](https://fr.wikipedia.org/wiki/Bell_P-39_Airacobra) | — |
| gloster-meteor | Gloster Meteor | collection | 1943-03-05 | 3 947 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Gloster_Meteor_F8,_UK_-_Air_Force_AN2059465.jpg) | [oui](https://fr.wikipedia.org/wiki/Gloster_Meteor) | — |
| dornier-do-17 | Dornier Do 17 | collection | 1934-11-23 | 2 139 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Dornier_Do_17Z.jpg) | [oui](https://fr.wikipedia.org/wiki/Dornier_Do_17) | 1 |
| mitsubishi-f-2 | Mitsubishi F-2 | militaire | 1995-10-07 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:Mitsubishi_F-2_at_Guam_(Cropped).jpg) | [oui](https://fr.wikipedia.org/wiki/Mitsubishi_F-2) | — |
| sepecat-jaguar | SEPECAT Jaguar | militaire | 1968-09-08 | 543 | 3 | [oui](https://commons.wikimedia.org/wiki/File:French_Jaguar_A_of_EC_1-7_Provence_in_flight_over_the_Adriatic_Sea,_8_April_2003_(DF-SD-05-05511).jpg) | [oui](https://fr.wikipedia.org/wiki/SEPECAT_Jaguar) | 2 |
| ilyushin-il-14 | Iliouchine Il-14 | collection | 1950-10-01 | 1 348 | 3 | [oui](https://commons.wikimedia.org/wiki/File:%D0%A1%D0%A1%D0%A1%D0%A0-91612_IL14_Private_-_Penguin_livery_-_by_name_Mikhail_Farikh_-_UUTO_(33251180091)_(2).jpg) | [oui](https://fr.wikipedia.org/wiki/Iliouchine_Il-14) | 1 |
| beriev-a-50 | Iliouchine A-50 | militaire | 1978-12-19 | 40 | 5 | [oui](https://commons.wikimedia.org/wiki/File:%D0%A1%D0%B0%D0%BC%D0%BE%D0%BB%D0%B5%D1%82_%D0%94%D0%A0%D0%9B%D0%9E_%D0%90-50%D0%A3_(1).png) | [oui](https://fr.wikipedia.org/wiki/Iliouchine_A-50) | 2 |
| yakovlev-yak-1 | Yak-1 | collection | 1940-01-13 | 8 734 | 2 | [oui](https://commons.wikimedia.org/wiki/File:I-26.jpg) | [oui](https://fr.wikipedia.org/wiki/Yakovlev_Yak-1) | — |
| antonov-an-148 | Antonov An-148 | ligne | 2004-12-17 | 49 | 5 | [oui](https://commons.wikimedia.org/wiki/File:Antonov--148_2.jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-148) | 1 |
| boeing-p-8-poseidon | Boeing P-8 Poseidon | militaire | 2009-04-25 | ⚠ | 3 | [oui](https://commons.wikimedia.org/wiki/File:P-8A_Poseidon_VX-20_Squadron.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_P-8_Poseidon) | 2 |
| chengdu-j-10 | Chengdu J-10 | militaire | 1998-03-23 | 468 | 4 | [oui](https://commons.wikimedia.org/wiki/File:PLAAF_J-10A_-_1.jpg) | [oui](https://fr.wikipedia.org/wiki/Chengdu_J-10) | 1 |
| fokker-f28-fellowship | Fokker F28 Fellowship | ligne | 1967-05-09 | 241 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Scandinavian_Airlines_F-28-4000.jpg) | [oui](https://fr.wikipedia.org/wiki/Fokker_F28) | — |
| cac-pac-jf-17-thunder | JF-17 Thunder | militaire | 2003-08-25 | 86 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Pakistan_JF-17_Thunder,_Pakistan_-_Air_Force_JP7136023.jpg) | [oui](https://fr.wikipedia.org/wiki/Chengdu_JF-17_Thunder) | — |
| sukhoi-su-9 | Su-9 | collection | 1957-10-10 | 1 150 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Su-9B_VVS_museum.jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-9) | — |
| arado-ar-234-blitz | Ar 234 Blitz | collection | 1943-06-15 | 244 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Arado_Ar_234_at_the_Steven_F._Udvar-Hazy_Center.JPG) | [oui](https://fr.wikipedia.org/wiki/Arado_Ar_234) | — |
| embraer-e-jet-family | E-Jet | ligne | 2002-02-19 | 1 544 | 3 | [oui](https://commons.wikimedia.org/wiki/File:EI-RDB_Embraer_175_Alitalia_BCN.jpg) | [oui](https://en.wikipedia.org/wiki/Embraer_E-Jet_family) | 1 |
| saab-35-draken | Saab 35 Draken | collection | 1955-10-25 | 644 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Draken_Swedish_Air_Force_(27882427885).jpg) | [oui](https://fr.wikipedia.org/wiki/Saab_35_Draken) | 2 |
| boeing-b-47-stratojet | Boeing B-47 Stratojet | collection | 1947-12-17 | 2 032 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Boeing_XB-47D_Stratojet_testbed_for_Wright_YT49_turboprop_engine.jpg) | [oui](https://fr.wikipedia.org/wiki/Boeing_B-47_Stratojet) | — |
| fokker-100 | Fokker 100 | ligne | 1986-11-30 | 283 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Klm_cityhopper_fokker100_ph-kle_arp.jpg) | [oui](https://fr.wikipedia.org/wiki/Fokker_F100) | 2 |
| antonov-an-30 | Antonov An-30 | militaire | 1974-01-01 | 123 | 4 | [oui](https://commons.wikimedia.org/wiki/File:An-30_-_RA-26226.jpg) | [oui](https://fr.wikipedia.org/wiki/Antonov_An-30) | 3 |
| vickers-wellington | Vickers Wellington | collection | 1936-06-15 | 11 461 | 1 | [oui](https://commons.wikimedia.org/wiki/File:Vickers_Wellington.jpg) | [oui](https://fr.wikipedia.org/wiki/Vickers_Wellington) | — |
| heinkel-he-178 | Heinkel He 178 | collection | 1939-08-27 | 2 | 5 | [oui](https://commons.wikimedia.org/wiki/File:Heinkel_He_178_050602-F-1234P-002.jpg) | [oui](https://fr.wikipedia.org/wiki/Heinkel_He_178) | — |
| comac-c919 | Comac C919 | ligne | 2017-05-05 | 30 | 5 | [oui](https://commons.wikimedia.org/wiki/File:COMAC_B-001A_May_2017.jpg) | [oui](https://fr.wikipedia.org/wiki/Comac_C919) | 2 |
| sud-aviation-caravelle | Sud-Aviation SE 210 Caravelle | collection | 1955-05-27 | 282 | 4 | [oui](https://commons.wikimedia.org/wiki/File:HB-ICZ_Swissair_Caravelle.jpg) | [oui](https://fr.wikipedia.org/wiki/Sud-Aviation_SE_210_Caravelle) | 1 |
| grumman-a-6-intruder | Grumman A-6 Intruder | militaire | 1960-04-19 | 793 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Grumman_KA-6D_Intruder_of_VA-34_in_flight,_in_1988.jpg) | [oui](https://fr.wikipedia.org/wiki/Grumman_A-6_Intruder) | — |
| aichi-d3a | Aichi D3A | collection | 1938-01-01 | 1 495 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Aichi_D3A_Replica_Airshow.jpg) | [oui](https://fr.wikipedia.org/wiki/Aichi_D3A) | — |
| yakovlev-yak-3 | Yakovlev Yak-3 | collection | 1943-04-01 | 4 848 | 2 | [oui](https://commons.wikimedia.org/wiki/File:CF15_Yak-3_ZK-VVS_040415_01.jpg) | [oui](https://fr.wikipedia.org/wiki/Yakovlev_Yak-3) | — |
| saab-37-viggen | Saab 37 Viggen | militaire | 1967-02-08 | 330 | 4 | [oui](https://commons.wikimedia.org/wiki/File:SAAB_J-37_Viggen_special_red_version.jpg) | [oui](https://fr.wikipedia.org/wiki/Saab_37_Viggen) | 3 |
| hawker-hunter | Hawker Hunter | militaire | 1951-07-21 | 1 972 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Hawker_hunter_ag1.jpg) | [oui](https://fr.wikipedia.org/wiki/Hawker_Hunter) | 2 |
| fairey-swordfish | Fairey Swordfish | collection | 1934-04-17 | 2 396 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Fairey_Swordfish_on_Airfield.jpg) | [oui](https://fr.wikipedia.org/wiki/Fairey_Swordfish) | — |
| dassault-mirage-iv | Dassault Mirage IV | collection | 1959-06-17 | 66 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Mirage_IV_DN-ST-87-02585.JPEG) | [oui](https://fr.wikipedia.org/wiki/Dassault_Mirage_IV) | 2 |
| gloster-gladiator | Gladiator | collection | 1934-09-12 | 747 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Gloster_Gladiator_3_ExCC.jpg) | [oui](https://fr.wikipedia.org/wiki/Gloster_Gladiator) | — |
| convair-b-36-peacemaker | Convair B-36 Peacemaker | collection | 1946-08-08 | 384 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Convair_B-36_Peacemaker.jpg) | [oui](https://fr.wikipedia.org/wiki/Convair_B-36_Peacemaker) | — |
| sukhoi-su-37 | Soukhoï Su-37 | militaire | 1996-04-02 | 3 | 5 | [oui](https://commons.wikimedia.org/wiki/File:Sukhoi_Su-37_at_Farnborough_1996_airshow.jpg) | [oui](https://fr.wikipedia.org/wiki/Soukho%C3%AF_Su-37) | — |
| airbus-a318 | Airbus A318 | ligne | 2002-01-15 | 80 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Air_France_Airbus_A318-111;_F-GUGI@FRA;06.07.2011_603gt_(5915187832).jpg) | [oui](https://fr.wikipedia.org/wiki/Airbus_A318) | — |
| aero-l-39-albatros | Aero L-39 Albatros | militaire | 1968-01-01 | 2 900 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Aero_L-39_Albatros_Jet_Trainer.jpg) | [oui](https://fr.wikipedia.org/wiki/Aero_L-39_Albatros) | 6 |
| fokker-dr-i | Fokker Dr.I | collection | 1917-07-05 | 320 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Fok.Dr.I.jpg) | [oui](https://fr.wikipedia.org/wiki/Fokker_Dr.I) | 3 |
| heinkel-he-162-volksjager | Heinkel He 162 | collection | 1944-12-06 | 320 | 4 | [oui](https://commons.wikimedia.org/wiki/File:He162_color010.jpg) | [oui](https://fr.wikipedia.org/wiki/Heinkel_He_162) | — |
| let-l-410-turbolet | Let L-410 Turbolet | ligne | 1969-04-16 | 1 138 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Let_L-410.jpg) | [oui](https://fr.wikipedia.org/wiki/Let_L-410_Turbolet) | 2 |
| de-havilland-vampire | De Havilland Vampire | collection | 1943-09-20 | 3 268 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Dh115.vampire.t11.june2004.arp.jpg) | [oui](https://fr.wikipedia.org/wiki/De_Havilland_DH.100_Vampire) | — |
| grumman-e-2-hawkeye | Grumman E-2 Hawkeye | militaire | 1960-10-21 | 200 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Grumman_E-2C_Hawkeye_0014.jpg) | [oui](https://fr.wikipedia.org/wiki/Grumman_E-2_Hawkeye) | 1 |
| douglas-a-1-skyraider | Douglas A-1 Skyraider | collection | 1945-03-18 | 3 180 | 2 | [oui](https://commons.wikimedia.org/wiki/File:Douglas_AD-6_Skyraider_of_VA-65_in_flight_in_March_1958.jpg) | [oui](https://fr.wikipedia.org/wiki/Douglas_AD_Skyraider) | — |
| saab-340 | Saab 340 | ligne | 1983-01-25 | 459 | 4 | [oui](https://commons.wikimedia.org/wiki/File:Estonian_Air_Saab_340A_ES-ASN.jpg) | [oui](https://fr.wikipedia.org/wiki/Saab_340) | 1 |
| kai-t-50-golden-eagle | T-50 Golden Eagle | militaire | 2002-08-20 | 200 | 4 | [oui](https://commons.wikimedia.org/wiki/File:T-50_Golden_Eagle_Demo_flight_(12201663454).jpg) | [oui](https://fr.wikipedia.org/wiki/KAI_T-50_Golden_Eagle) | — |
| vought-f-8-crusader | Vought F-8 Crusader | collection | 1955-03-25 | 1 219 | 3 | [oui](https://commons.wikimedia.org/wiki/File:F8E_Launch-VF33-CVAN65-1964.jpg) | [oui](https://fr.wikipedia.org/wiki/Vought_F-8_Crusader) | — |
| mcdonnell-douglas-av-8b-harrier-ii | AV-8B Harrier II | militaire | 1978-11-09 | 337 | 4 | [oui](https://commons.wikimedia.org/wiki/File:DM-SD-02-01334.jpg) | [oui](https://fr.wikipedia.org/wiki/McDonnell_Douglas_AV-8B_Harrier_II) | 8 |
| bae-systems-hawk | BAe Hawk | militaire | 1974-08-21 | 1 000 | 3 | [oui](https://commons.wikimedia.org/wiki/File:Bae_hawk_t1_xx245_inflight_arp.jpg) | [oui](https://fr.wikipedia.org/wiki/BAe_Hawk) | 2 |
