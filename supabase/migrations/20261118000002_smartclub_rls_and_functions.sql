ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

DO $$
DECLARE t text;
  -- Tables gérées uniquement par l'équipe (lecture staff, écriture admin)
  priv text[] := ARRAY['data_inscription','data_participation','data_facturation','data_paiement',
    'data_presence','kids_demandes','data_clients','data_communications','data_matieres',
    'data_contact','data_message_templates','data_forfait','data_camp','data_agenda',
    'data_reglements','data_avis','data_faq','data_faq_pages','data_media','data_page_config','page_views'];
BEGIN
  FOREACH t IN ARRAY priv LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Staff read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''staff'') OR public.has_role(auth.uid(),''readonly''))', t);
    EXECUTE format('CREATE POLICY "Admin insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),''admin''))', t);
    EXECUTE format('CREATE POLICY "Admin update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t);
    EXECUTE format('CREATE POLICY "Admin delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(),''admin''))', t);
  END LOOP;
END $$;

-- data_ecoles : coordonnées bancaires → admin uniquement
ALTER TABLE public.data_ecoles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin all data_ecoles" ON public.data_ecoles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Lecture publique du contenu du site
CREATE POLICY "Public read camp" ON public.data_camp FOR SELECT TO anon USING (true);
CREATE POLICY "Public read active agenda" ON public.data_agenda FOR SELECT TO anon USING (actif = 1);
CREATE POLICY "Public read forfait" ON public.data_forfait FOR SELECT TO anon USING (true);
CREATE POLICY "Public read reglements" ON public.data_reglements FOR SELECT TO anon USING (true);
CREATE POLICY "Public read approved avis" ON public.data_avis FOR SELECT TO anon USING (approuve = 1);
CREATE POLICY "Public read active faq" ON public.data_faq FOR SELECT TO anon USING (actif = 1);
CREATE POLICY "Public read faq_pages" ON public.data_faq_pages FOR SELECT TO anon USING (true);
CREATE POLICY "Public read active media" ON public.data_media FOR SELECT TO anon USING (actif = 1);
CREATE POLICY "Public read page_config" ON public.data_page_config FOR SELECT TO anon USING (true);

-- Envois publics contrôlés (pas de lecture en retour)
CREATE POLICY "Public submit avis" ON public.data_avis FOR INSERT TO anon
  WITH CHECK (approuve = 0 AND length(nom) BETWEEN 1 AND 100 AND length(message) BETWEEN 1 AND 2000);
CREATE POLICY "Public submit contact" ON public.data_contact FOR INSERT TO anon
  WITH CHECK (length(coalesce(message,'')) <= 5000);
CREATE POLICY "Public track page_views" ON public.page_views FOR INSERT TO anon
  WITH CHECK (length(page) <= 200);

-- Inscription publique : fonction sécurisée qui crée l'élève + sa participation au groupe
CREATE OR REPLACE FUNCTION public.submit_inscription(payload jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id integer; v_agenda integer; v_camp integer;
BEGIN
  IF coalesce(trim(payload->>'prenom'),'') = '' OR coalesce(trim(payload->>'email'),'') = ''
     OR coalesce(trim(payload->>'telephone'),'') = '' THEN
    RAISE EXCEPTION 'Champs obligatoires manquants';
  END IF;
  v_agenda := nullif(payload->>'id_agenda','')::integer;
  v_camp := nullif(payload->>'id_camp','')::integer;
  IF v_agenda IS NOT NULL AND NOT EXISTS (SELECT 1 FROM data_agenda WHERE id_agenda = v_agenda AND actif = 1) THEN
    v_agenda := NULL;
  END IF;
  INSERT INTO data_inscription (genre, nom, prenom, date_naissance, legal_nom, legal_prenom, email,
    telephone, adresse, ville, ile, id_camp, id_agenda, comment_connu, creneau_horaire,
    consent_image, remarque, is_draft, statut, uniqueid)
  VALUES (left(payload->>'genre',20), left(payload->>'nom',100), left(payload->>'prenom',100),
    nullif(payload->>'date_naissance','')::date, left(payload->>'legal_nom',100), left(payload->>'legal_prenom',100),
    left(payload->>'email',200), left(payload->>'telephone',50), left(payload->>'adresse',300),
    left(payload->>'ville',100), left(payload->>'ile',50), v_camp, v_agenda,
    left(payload->>'comment_connu',200), left(payload->>'creneau_horaire',200),
    (payload->>'consent_image')::boolean, left(payload->>'remarque',3000), false, 'nouveau',
    substr(md5(random()::text),1,12))
  RETURNING id_inscription INTO new_id;
  IF v_agenda IS NOT NULL THEN
    INSERT INTO data_participation (id_inscription, id_agenda, code, inscrit, formule)
    VALUES (new_id, v_agenda, upper(substr(md5(random()::text),1,8)), 1,
            nullif(payload->>'formule','')::integer);
  END IF;
  RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.submit_inscription(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_inscription(jsonb) TO anon, authenticated;

-- updated_at automatique
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_presence_updated BEFORE UPDATE ON public.data_presence FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_inscription_updated BEFORE UPDATE ON public.data_inscription FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON public.data_message_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Stockage des visuels du site
INSERT INTO storage.buckets (id, name, public) VALUES ('site-banners','site-banners',true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Admin upload site-banners" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-banners' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update site-banners" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-banners' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete site-banners" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-banners' AND public.has_role(auth.uid(),'admin'));
