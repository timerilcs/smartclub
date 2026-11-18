-- ===== SmartClub : schéma de base (dérivé de Polykids) =====
CREATE TYPE public.app_role AS ENUM ('admin','staff','readonly');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Formules (SmartClub Kids, Collège & Lycée, Stages)
CREATE TABLE public.data_camp (
  id_camp serial PRIMARY KEY,
  nom text, nom_court text, intitule text, age text, duree text, niveau integer, page integer
);
-- Groupes / périodes (créneaux de 5 semaines, stages)
CREATE TABLE public.data_agenda (
  id_agenda serial PRIMARY KEY,
  id_camp integer REFERENCES public.data_camp(id_camp) ON DELETE SET NULL,
  id_ecole integer, debut date, fin date, heure_debut text, heure_fin text, heurecourte text,
  info text, infocourte text, infosms text, lieu text, lieu_id integer,
  place_max integer DEFAULT 5, supp integer DEFAULT 0, actif integer DEFAULT 1
);
CREATE TABLE public.data_communications (
  id_communication serial PRIMARY KEY, information text, information_courte text, color text
);
CREATE TABLE public.data_inscription (
  id_inscription serial PRIMARY KEY,
  uniqueid text, genre text, nom text, prenom text, date_naissance date, lieu_naissance text,
  legal_nom text, legal_prenom text, email text, telephone text, adresse text, code_postal text,
  ville text, ile text, pays text DEFAULT 'Polynésie française', id_ecole integer,
  id_communication integer, id_camp integer, id_agenda integer, comment_connu text,
  creneau_horaire text, consent_image boolean, assurance_accident integer, assurance_civile integer,
  assurance_compagnie text, assurance_police text, pc integer, mdp text, remarque text,
  current_step integer DEFAULT 1, is_draft boolean DEFAULT false, statut text DEFAULT 'nouveau',
  date_formulaire timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.data_participation (
  id_participation serial PRIMARY KEY,
  id_inscription integer REFERENCES public.data_inscription(id_inscription) ON DELETE CASCADE,
  id_agenda integer REFERENCES public.data_agenda(id_agenda) ON DELETE SET NULL,
  code text, formule integer, inscrit integer DEFAULT 1, ordinateur integer DEFAULT 0,
  date_formulaire timestamptz DEFAULT now()
);
CREATE TABLE public.data_forfait (
  id_forfait serial PRIMARY KEY, nom text, designation text, heure numeric, prix numeric
);
CREATE TABLE public.data_reglements (
  id_reglement serial PRIMARY KEY, titre text, reglement text, date_maj timestamptz DEFAULT now()
);
CREATE TABLE public.data_clients (
  id_client serial PRIMARY KEY, societe text, adresse text, code_postal text, ville text
);
CREATE TABLE public.data_facturation (
  id_facturation serial PRIMARY KEY,
  id_inscription integer REFERENCES public.data_inscription(id_inscription) ON DELETE SET NULL,
  id_participation integer, id_forfait integer, id_client integer, id_mois integer, id_reglement integer,
  code text, objet text, montant numeric, date_facturation date DEFAULT current_date,
  date_formulaire timestamptz DEFAULT now()
);
CREATE TABLE public.data_paiement (
  id_paiement serial PRIMARY KEY,
  id_inscription integer REFERENCES public.data_inscription(id_inscription) ON DELETE SET NULL,
  id_facturation integer REFERENCES public.data_facturation(id_facturation) ON DELETE SET NULL,
  type text, montant numeric, numero text, porteur text, info text, depot text,
  date_paiement date DEFAULT current_date, date_depot date, date_formulaire timestamptz DEFAULT now()
);
CREATE TABLE public.data_presence (
  id_presence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_agenda integer NOT NULL, id_inscription integer NOT NULL, date_seance date NOT NULL,
  statut text NOT NULL DEFAULT 'présent' CHECK (statut IN ('présent','absent','excusé')),
  heures numeric, remarque text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id_agenda, id_inscription, date_seance)
);
CREATE TABLE public.kids_demandes (
  id serial PRIMARY KEY, id_inscription integer NOT NULL, id_agenda integer NOT NULL,
  message text, statut text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now()
);
-- Paramètres de la structure (coordonnées, banque pour les factures)
CREATE TABLE public.data_ecoles (
  id_ecole serial PRIMARY KEY, sarl text, nom_directeur text, prenom_directeur text, sign_directeur text,
  rue text, cp text, ville text, tahiti text, tel text, mobile text, email text, siret text, tva text,
  banque text, domiciliation text, agence text, compte text, cle text, iban text, bic text,
  login text, mdp text, google_conversion_id text, google_conversion_label text
);
CREATE TABLE public.data_matieres (
  id_matiere serial PRIMARY KEY, nom text, couleur text, coef numeric, actif integer DEFAULT 1,
  affiche_absences integer, compte_heures integer, eval integer, id_select integer
);
CREATE TABLE public.data_contact (
  id_contact serial PRIMARY KEY, nom text, prenom text, email text, telephone text, message text,
  date_formulaire timestamptz DEFAULT now()
);
CREATE TABLE public.data_message_templates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, label text NOT NULL,
  channel text NOT NULL DEFAULT 'sms', subject text, body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.data_avis (
  id serial PRIMARY KEY, nom text NOT NULL, message text NOT NULL,
  note integer NOT NULL DEFAULT 5 CHECK (note BETWEEN 1 AND 5),
  approuve integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.data_faq (
  id serial PRIMARY KEY, question text NOT NULL, reponse text NOT NULL,
  ordre integer NOT NULL DEFAULT 0, actif integer NOT NULL DEFAULT 1
);
CREATE TABLE public.data_faq_pages (
  id serial PRIMARY KEY, id_faq integer NOT NULL REFERENCES public.data_faq(id) ON DELETE CASCADE, page text NOT NULL
);
CREATE TABLE public.data_media (
  id serial PRIMARY KEY, page text NOT NULL DEFAULT 'accueil', section text NOT NULL DEFAULT 'hero',
  type text NOT NULL DEFAULT 'image' CHECK (type IN ('image','video')), url text NOT NULL, alt text,
  sort_order integer NOT NULL DEFAULT 0, actif integer NOT NULL DEFAULT 1,
  overlay_color text DEFAULT '#000000', overlay_opacity double precision DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.data_page_config (
  id serial PRIMARY KEY, page text UNIQUE NOT NULL, id_camp integer, annee_active text,
  theme_color text DEFAULT '#1f4fd8', overlay_color text DEFAULT '#000000',
  overlay_opacity double precision DEFAULT 0.5,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.page_views (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, page text NOT NULL, referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
