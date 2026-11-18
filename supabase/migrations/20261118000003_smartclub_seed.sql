INSERT INTO public.data_camp (id_camp, nom, nom_court, intitule, age, duree, niveau, page) VALUES
 (1,'SmartClub Kids','Kids','Maths & français – primaire','Primaire','1h30 / séance',1,1),
 (2,'SmartClub Collège & Lycée','Collège-Lycée','Mathématiques – collège & lycée','Collège / Lycée','1h30 / séance',2,2),
 (3,'Stages de vacances','Stages','Remise à niveau, révisions, préparation aux examens','Tous niveaux','Selon le stage',3,3);
SELECT setval('data_camp_id_camp_seq', 3);

INSERT INTO public.data_forfait (nom, designation, heure, prix) VALUES
 ('Kids – 1 séance/sem.','SmartClub Kids – 1 séance de 1h30 par semaine (période de 5 semaines)',7.5,15000),
 ('Kids – 2 séances/sem.','SmartClub Kids – 2 séances de 1h30 par semaine (période de 5 semaines)',15,25000),
 ('Kids – 3 séances/sem.','SmartClub Kids – 3 séances de 1h30 par semaine (période de 5 semaines)',22.5,36000),
 ('Collège & Lycée','SmartClub Collège & Lycée – 1 séance de 1h30 par semaine (période de 5 semaines)',7.5,18000);

INSERT INTO public.data_communications (information, information_courte, color) VALUES
 ('Bouche à oreille','Bouche à oreille','#10b981'),('Facebook / Instagram','Réseaux sociaux','#3b82f6'),
 ('Google','Google','#f59e0b'),('École / enseignant','École','#8b5cf6'),('Autre','Autre','#64748b');

INSERT INTO public.data_ecoles (id_ecole, sarl, email, ville, tahiti) VALUES (1,'SmartClub',NULL,NULL,'Tahiti');
SELECT setval('data_ecoles_id_ecole_seq', 1);

INSERT INTO public.data_page_config (page, theme_color) VALUES
 ('accueil','#1f4fd8'),('accompagnements','#1f4fd8'),('tarifs','#1f4fd8'),('stages','#ff7a59'),('avis','#1fb58f'),('contact','#1f4fd8');

INSERT INTO public.data_faq (question, reponse, ordre) VALUES
 ('Combien d''élèves par groupe ?','Les séances se déroulent en petits groupes de 3 à 5 élèves, pour concilier dynamique collective et suivi individualisé.',1),
 ('Comment fonctionnent les périodes ?','Les séances de 1h30 sont organisées par périodes de 5 semaines, en suivant le calendrier scolaire.',2),
 ('Quelles matières sont proposées ?','Mathématiques et français pour le primaire ; principalement les mathématiques pour le collège et le lycée.',3),
 ('Préparez-vous aux examens ?','Oui : préparation au DNB et au baccalauréat, et des stages de révision pendant les vacances.',4);

INSERT INTO public.data_message_templates (label, channel, subject, body) VALUES
 ('Confirmation d''inscription','email','Votre inscription à SmartClub','Bonjour {parent},\n\nNous avons bien reçu l''inscription de {enfant}. Nous revenons vers vous très vite pour confirmer le créneau.\n\nÀ bientôt,\nL''équipe SmartClub'),
 ('Rappel de paiement','sms',NULL,'Bonjour, petit rappel : le règlement de la période SmartClub de {enfant} est en attente. Merci !');
