GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.data_camp, public.data_agenda, public.data_forfait, public.data_reglements,
  public.data_avis, public.data_faq, public.data_faq_pages, public.data_media, public.data_page_config TO anon;
GRANT INSERT ON public.data_avis, public.data_contact, public.page_views TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.data_avis_id_seq, public.data_contact_id_contact_seq TO anon;
