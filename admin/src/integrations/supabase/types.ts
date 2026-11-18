export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      data_agenda: {
        Row: {
          actif: number | null
          debut: string | null
          fin: string | null
          heure_debut: string | null
          heure_fin: string | null
          heurecourte: string | null
          id_agenda: number
          id_camp: number | null
          id_ecole: number | null
          info: string | null
          infocourte: string | null
          infosms: string | null
          lieu: string | null
          lieu_id: number | null
          place_max: number | null
          supp: number | null
        }
        Insert: {
          actif?: number | null
          debut?: string | null
          fin?: string | null
          heure_debut?: string | null
          heure_fin?: string | null
          heurecourte?: string | null
          id_agenda: number
          id_camp?: number | null
          id_ecole?: number | null
          info?: string | null
          infocourte?: string | null
          infosms?: string | null
          lieu?: string | null
          lieu_id?: number | null
          place_max?: number | null
          supp?: number | null
        }
        Update: {
          actif?: number | null
          debut?: string | null
          fin?: string | null
          heure_debut?: string | null
          heure_fin?: string | null
          heurecourte?: string | null
          id_agenda?: number
          id_camp?: number | null
          id_ecole?: number | null
          info?: string | null
          infocourte?: string | null
          infosms?: string | null
          lieu?: string | null
          lieu_id?: number | null
          place_max?: number | null
          supp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "data_agenda_lieu_id_fkey"
            columns: ["lieu_id"]
            isOneToOne: false
            referencedRelation: "data_lieux"
            referencedColumns: ["id"]
          },
        ]
      }
      data_avis: {
        Row: {
          approuve: number
          created_at: string
          id: number
          message: string
          nom: string
          note: number
        }
        Insert: {
          approuve?: number
          created_at?: string
          id?: number
          message: string
          nom: string
          note?: number
        }
        Update: {
          approuve?: number
          created_at?: string
          id?: number
          message?: string
          nom?: string
          note?: number
        }
        Relationships: []
      }
      data_camp: {
        Row: {
          age: string | null
          duree: string | null
          id_camp: number
          intitule: string | null
          niveau: number | null
          nom: string | null
          nom_court: string | null
          page: number | null
        }
        Insert: {
          age?: string | null
          duree?: string | null
          id_camp: number
          intitule?: string | null
          niveau?: number | null
          nom?: string | null
          nom_court?: string | null
          page?: number | null
        }
        Update: {
          age?: string | null
          duree?: string | null
          id_camp?: number
          intitule?: string | null
          niveau?: number | null
          nom?: string | null
          nom_court?: string | null
          page?: number | null
        }
        Relationships: []
      }
      data_clients: {
        Row: {
          adresse: string | null
          code_postal: string | null
          id_client: number
          societe: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          id_client: number
          societe?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          id_client?: number
          societe?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      data_communications: {
        Row: {
          color: string | null
          id_communication: number
          information: string | null
          information_courte: string | null
        }
        Insert: {
          color?: string | null
          id_communication: number
          information?: string | null
          information_courte?: string | null
        }
        Update: {
          color?: string | null
          id_communication?: number
          information?: string | null
          information_courte?: string | null
        }
        Relationships: []
      }
      data_contact: {
        Row: {
          date_formulaire: string | null
          email: string | null
          id_contact: number
          message: string | null
          nom: string | null
          prenom: string | null
          telephone: string | null
        }
        Insert: {
          date_formulaire?: string | null
          email?: string | null
          id_contact: number
          message?: string | null
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
        }
        Update: {
          date_formulaire?: string | null
          email?: string | null
          id_contact?: number
          message?: string | null
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
        }
        Relationships: []
      }
      data_documents: {
        Row: {
          date_doc: string | null
          date_modification: string | null
          description_doc: string | null
          id_doc: number
          id_inscription: number | null
          nom_fichier: string | null
          taille: number | null
          titre_doc: string | null
          type: string | null
          vignette: string | null
        }
        Insert: {
          date_doc?: string | null
          date_modification?: string | null
          description_doc?: string | null
          id_doc: number
          id_inscription?: number | null
          nom_fichier?: string | null
          taille?: number | null
          titre_doc?: string | null
          type?: string | null
          vignette?: string | null
        }
        Update: {
          date_doc?: string | null
          date_modification?: string | null
          description_doc?: string | null
          id_doc?: number
          id_inscription?: number | null
          nom_fichier?: string | null
          taille?: number | null
          titre_doc?: string | null
          type?: string | null
          vignette?: string | null
        }
        Relationships: []
      }
      data_ecoles: {
        Row: {
          agence: string | null
          banque: string | null
          bic: string | null
          cle: string | null
          compte: string | null
          cp: string | null
          domiciliation: string | null
          email: string | null
          google_conversion_id: string | null
          google_conversion_label: string | null
          iban: string | null
          id_ecole: number
          login: string | null
          mdp: string | null
          mobile: string | null
          nom_directeur: string | null
          prenom_directeur: string | null
          rue: string | null
          sarl: string | null
          sign_directeur: string | null
          siret: string | null
          tahiti: string | null
          tel: string | null
          tva: string | null
          ville: string | null
        }
        Insert: {
          agence?: string | null
          banque?: string | null
          bic?: string | null
          cle?: string | null
          compte?: string | null
          cp?: string | null
          domiciliation?: string | null
          email?: string | null
          google_conversion_id?: string | null
          google_conversion_label?: string | null
          iban?: string | null
          id_ecole: number
          login?: string | null
          mdp?: string | null
          mobile?: string | null
          nom_directeur?: string | null
          prenom_directeur?: string | null
          rue?: string | null
          sarl?: string | null
          sign_directeur?: string | null
          siret?: string | null
          tahiti?: string | null
          tel?: string | null
          tva?: string | null
          ville?: string | null
        }
        Update: {
          agence?: string | null
          banque?: string | null
          bic?: string | null
          cle?: string | null
          compte?: string | null
          cp?: string | null
          domiciliation?: string | null
          email?: string | null
          google_conversion_id?: string | null
          google_conversion_label?: string | null
          iban?: string | null
          id_ecole?: number
          login?: string | null
          mdp?: string | null
          mobile?: string | null
          nom_directeur?: string | null
          prenom_directeur?: string | null
          rue?: string | null
          sarl?: string | null
          sign_directeur?: string | null
          siret?: string | null
          tahiti?: string | null
          tel?: string | null
          tva?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      data_emploi_du_temps: {
        Row: {
          date_creation: string | null
          date_debut: string | null
          date_fin: string | null
          id_agenda: number | null
          id_edt: number
          id_matiere: number | null
          id_professeur: number | null
          id_salle: number | null
          id_timeline: number | null
        }
        Insert: {
          date_creation?: string | null
          date_debut?: string | null
          date_fin?: string | null
          id_agenda?: number | null
          id_edt: number
          id_matiere?: number | null
          id_professeur?: number | null
          id_salle?: number | null
          id_timeline?: number | null
        }
        Update: {
          date_creation?: string | null
          date_debut?: string | null
          date_fin?: string | null
          id_agenda?: number | null
          id_edt?: number
          id_matiere?: number | null
          id_professeur?: number | null
          id_salle?: number | null
          id_timeline?: number | null
        }
        Relationships: []
      }
      data_facturation: {
        Row: {
          code: string | null
          date_facturation: string | null
          date_formulaire: string | null
          id_client: number | null
          id_facturation: number
          id_forfait: number | null
          id_inscription: number | null
          id_mois: number | null
          id_participation: number | null
          id_reglement: number | null
          montant: number | null
          objet: string | null
        }
        Insert: {
          code?: string | null
          date_facturation?: string | null
          date_formulaire?: string | null
          id_client?: number | null
          id_facturation: number
          id_forfait?: number | null
          id_inscription?: number | null
          id_mois?: number | null
          id_participation?: number | null
          id_reglement?: number | null
          montant?: number | null
          objet?: string | null
        }
        Update: {
          code?: string | null
          date_facturation?: string | null
          date_formulaire?: string | null
          id_client?: number | null
          id_facturation?: number
          id_forfait?: number | null
          id_inscription?: number | null
          id_mois?: number | null
          id_participation?: number | null
          id_reglement?: number | null
          montant?: number | null
          objet?: string | null
        }
        Relationships: []
      }
      data_forfait: {
        Row: {
          designation: string | null
          heure: number | null
          id_forfait: number
          nom: string | null
          prix: number | null
        }
        Insert: {
          designation?: string | null
          heure?: number | null
          id_forfait: number
          nom?: string | null
          prix?: number | null
        }
        Update: {
          designation?: string | null
          heure?: number | null
          id_forfait?: number
          nom?: string | null
          prix?: number | null
        }
        Relationships: []
      }
      data_inscription: {
        Row: {
          adresse: string | null
          assurance_accident: number | null
          assurance_civile: number | null
          assurance_compagnie: string | null
          assurance_police: string | null
          code_postal: string | null
          comment_connu: string | null
          consent_image: boolean | null
          creneau_horaire: string | null
          current_step: number | null
          date_formulaire: string | null
          date_naissance: string | null
          email: string | null
          genre: string | null
          id_agenda: number | null
          id_camp: number | null
          id_communication: number | null
          id_ecole: number | null
          id_inscription: number
          ile: string | null
          is_draft: boolean | null
          legal_nom: string | null
          legal_prenom: string | null
          lieu_naissance: string | null
          mdp: string | null
          nom: string | null
          pays: string | null
          pc: number | null
          prenom: string | null
          remarque: string | null
          statut: string | null
          telephone: string | null
          uniqueid: string | null
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          assurance_accident?: number | null
          assurance_civile?: number | null
          assurance_compagnie?: string | null
          assurance_police?: string | null
          code_postal?: string | null
          comment_connu?: string | null
          consent_image?: boolean | null
          creneau_horaire?: string | null
          current_step?: number | null
          date_formulaire?: string | null
          date_naissance?: string | null
          email?: string | null
          genre?: string | null
          id_agenda?: number | null
          id_camp?: number | null
          id_communication?: number | null
          id_ecole?: number | null
          id_inscription?: number
          ile?: string | null
          is_draft?: boolean | null
          legal_nom?: string | null
          legal_prenom?: string | null
          lieu_naissance?: string | null
          mdp?: string | null
          nom?: string | null
          pays?: string | null
          pc?: number | null
          prenom?: string | null
          remarque?: string | null
          statut?: string | null
          telephone?: string | null
          uniqueid?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          assurance_accident?: number | null
          assurance_civile?: number | null
          assurance_compagnie?: string | null
          assurance_police?: string | null
          code_postal?: string | null
          comment_connu?: string | null
          consent_image?: boolean | null
          creneau_horaire?: string | null
          current_step?: number | null
          date_formulaire?: string | null
          date_naissance?: string | null
          email?: string | null
          genre?: string | null
          id_agenda?: number | null
          id_camp?: number | null
          id_communication?: number | null
          id_ecole?: number | null
          id_inscription?: number
          ile?: string | null
          is_draft?: boolean | null
          legal_nom?: string | null
          legal_prenom?: string | null
          lieu_naissance?: string | null
          mdp?: string | null
          nom?: string | null
          pays?: string | null
          pc?: number | null
          prenom?: string | null
          remarque?: string | null
          statut?: string | null
          telephone?: string | null
          uniqueid?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      data_lieux: {
        Row: {
          actif: number | null
          adresse_ligne_1: string | null
          adresse_ligne_2: string | null
          code_postal: string | null
          cout_horaire: number | null
          created_at: string | null
          description: string | null
          display_map: boolean | null
          google_maps_embed_url: string | null
          google_maps_url: string | null
          id: number
          ile: string | null
          latitude: number | null
          longitude: number | null
          map_type: string | null
          nom: string
          ordre_affichage: number | null
          slug: string | null
          updated_at: string | null
          video_url: string | null
          ville: string | null
          zoom_level: number | null
        }
        Insert: {
          actif?: number | null
          adresse_ligne_1?: string | null
          adresse_ligne_2?: string | null
          code_postal?: string | null
          cout_horaire?: number | null
          created_at?: string | null
          description?: string | null
          display_map?: boolean | null
          google_maps_embed_url?: string | null
          google_maps_url?: string | null
          id?: number
          ile?: string | null
          latitude?: number | null
          longitude?: number | null
          map_type?: string | null
          nom: string
          ordre_affichage?: number | null
          slug?: string | null
          updated_at?: string | null
          video_url?: string | null
          ville?: string | null
          zoom_level?: number | null
        }
        Update: {
          actif?: number | null
          adresse_ligne_1?: string | null
          adresse_ligne_2?: string | null
          code_postal?: string | null
          cout_horaire?: number | null
          created_at?: string | null
          description?: string | null
          display_map?: boolean | null
          google_maps_embed_url?: string | null
          google_maps_url?: string | null
          id?: number
          ile?: string | null
          latitude?: number | null
          longitude?: number | null
          map_type?: string | null
          nom?: string
          ordre_affichage?: number | null
          slug?: string | null
          updated_at?: string | null
          video_url?: string | null
          ville?: string | null
          zoom_level?: number | null
        }
        Relationships: []
      }
      data_matieres: {
        Row: {
          actif: number | null
          affiche_absences: number | null
          coef: number | null
          compte_heures: number | null
          couleur: string | null
          eval: number | null
          id_matiere: number
          id_select: number | null
          nom: string | null
        }
        Insert: {
          actif?: number | null
          affiche_absences?: number | null
          coef?: number | null
          compte_heures?: number | null
          couleur?: string | null
          eval?: number | null
          id_matiere: number
          id_select?: number | null
          nom?: string | null
        }
        Update: {
          actif?: number | null
          affiche_absences?: number | null
          coef?: number | null
          compte_heures?: number | null
          couleur?: string | null
          eval?: number | null
          id_matiere?: number
          id_select?: number | null
          nom?: string | null
        }
        Relationships: []
      }
      data_media: {
        Row: {
          actif: number
          alt: string | null
          created_at: string
          id: number
          overlay_color: string | null
          overlay_opacity: number | null
          page: string
          section: string
          sort_order: number
          type: string
          url: string
        }
        Insert: {
          actif?: number
          alt?: string | null
          created_at?: string
          id?: number
          overlay_color?: string | null
          overlay_opacity?: number | null
          page?: string
          section?: string
          sort_order?: number
          type?: string
          url: string
        }
        Update: {
          actif?: number
          alt?: string | null
          created_at?: string
          id?: number
          overlay_color?: string | null
          overlay_opacity?: number | null
          page?: string
          section?: string
          sort_order?: number
          type?: string
          url?: string
        }
        Relationships: []
      }
      data_message_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: number
          label: string
          updated_at: string
        }
        Insert: {
          body?: string
          channel?: string
          created_at?: string
          id?: never
          label: string
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: never
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_page_config: {
        Row: {
          annee_active: string | null
          created_at: string | null
          id: number
          id_camp: number | null
          overlay_color: string | null
          overlay_opacity: number | null
          page: string
          theme_color: string | null
          updated_at: string | null
        }
        Insert: {
          annee_active?: string | null
          created_at?: string | null
          id?: number
          id_camp?: number | null
          overlay_color?: string | null
          overlay_opacity?: number | null
          page: string
          theme_color?: string | null
          updated_at?: string | null
        }
        Update: {
          annee_active?: string | null
          created_at?: string | null
          id?: number
          id_camp?: number | null
          overlay_color?: string | null
          overlay_opacity?: number | null
          page?: string
          theme_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_paiement: {
        Row: {
          date_depot: string | null
          date_formulaire: string | null
          date_paiement: string | null
          depot: string | null
          id_facturation: number | null
          id_inscription: number | null
          id_paiement: number
          info: string | null
          montant: number | null
          numero: string | null
          porteur: string | null
          type: string | null
        }
        Insert: {
          date_depot?: string | null
          date_formulaire?: string | null
          date_paiement?: string | null
          depot?: string | null
          id_facturation?: number | null
          id_inscription?: number | null
          id_paiement: number
          info?: string | null
          montant?: number | null
          numero?: string | null
          porteur?: string | null
          type?: string | null
        }
        Update: {
          date_depot?: string | null
          date_formulaire?: string | null
          date_paiement?: string | null
          depot?: string | null
          id_facturation?: number | null
          id_inscription?: number | null
          id_paiement?: number
          info?: string | null
          montant?: number | null
          numero?: string | null
          porteur?: string | null
          type?: string | null
        }
        Relationships: []
      }
      data_paiements_salles: {
        Row: {
          beneficiaire: string | null
          created_at: string
          date_paiement: string
          id: number
          lieu_id: number | null
          mode: string
          montant: number
          note: string | null
          updated_at: string
        }
        Insert: {
          beneficiaire?: string | null
          created_at?: string
          date_paiement: string
          id?: never
          lieu_id?: number | null
          mode?: string
          montant: number
          note?: string | null
          updated_at?: string
        }
        Update: {
          beneficiaire?: string | null
          created_at?: string
          date_paiement?: string
          id?: never
          lieu_id?: number | null
          mode?: string
          montant?: number
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_paiements_salles_lieu_id_fkey"
            columns: ["lieu_id"]
            isOneToOne: false
            referencedRelation: "data_lieux"
            referencedColumns: ["id"]
          },
        ]
      }
      data_participation: {
        Row: {
          code: string | null
          date_formulaire: string | null
          formule: number | null
          id_agenda: number | null
          id_inscription: number | null
          id_participation: number
          inscrit: number | null
          ordinateur: number | null
        }
        Insert: {
          code?: string | null
          date_formulaire?: string | null
          formule?: number | null
          id_agenda?: number | null
          id_inscription?: number | null
          id_participation?: number
          inscrit?: number | null
          ordinateur?: number | null
        }
        Update: {
          code?: string | null
          date_formulaire?: string | null
          formule?: number | null
          id_agenda?: number | null
          id_inscription?: number | null
          id_participation?: number
          inscrit?: number | null
          ordinateur?: number | null
        }
        Relationships: []
      }
      data_presence: {
        Row: {
          created_at: string
          date_seance: string
          heures: number | null
          id_agenda: number
          id_inscription: number
          id_presence: number
          remarque: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_seance: string
          heures?: number | null
          id_agenda: number
          id_inscription: number
          id_presence?: never
          remarque?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_seance?: string
          heures?: number | null
          id_agenda?: number
          id_inscription?: number
          id_presence?: never
          remarque?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_prof_ecole: {
        Row: {
          id_ecole: number | null
          id_prof_ecole: number
          id_professeur: number | null
        }
        Insert: {
          id_ecole?: number | null
          id_prof_ecole: number
          id_professeur?: number | null
        }
        Update: {
          id_ecole?: number | null
          id_prof_ecole?: number
          id_professeur?: number | null
        }
        Relationships: []
      }
      data_professeurs: {
        Row: {
          actif: number | null
          adresse: string | null
          code_postal: string | null
          date_creation: string | null
          date_naissance: string | null
          email: string | null
          id_professeur: number
          lieu_naissance: string | null
          loginn: string | null
          mdpp: string | null
          nationalite: string | null
          nom: string | null
          pays: string | null
          portable: string | null
          prenom: string | null
          remarque: string | null
          sexe: string | null
          siret: string | null
          statut: number | null
          tarif: number | null
          unique_id: string | null
          ville: string | null
        }
        Insert: {
          actif?: number | null
          adresse?: string | null
          code_postal?: string | null
          date_creation?: string | null
          date_naissance?: string | null
          email?: string | null
          id_professeur: number
          lieu_naissance?: string | null
          loginn?: string | null
          mdpp?: string | null
          nationalite?: string | null
          nom?: string | null
          pays?: string | null
          portable?: string | null
          prenom?: string | null
          remarque?: string | null
          sexe?: string | null
          siret?: string | null
          statut?: number | null
          tarif?: number | null
          unique_id?: string | null
          ville?: string | null
        }
        Update: {
          actif?: number | null
          adresse?: string | null
          code_postal?: string | null
          date_creation?: string | null
          date_naissance?: string | null
          email?: string | null
          id_professeur?: number
          lieu_naissance?: string | null
          loginn?: string | null
          mdpp?: string | null
          nationalite?: string | null
          nom?: string | null
          pays?: string | null
          portable?: string | null
          prenom?: string | null
          remarque?: string | null
          sexe?: string | null
          siret?: string | null
          statut?: number | null
          tarif?: number | null
          unique_id?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      data_reglements: {
        Row: {
          date_maj: string | null
          id_reglement: number
          reglement: string | null
          titre: string | null
        }
        Insert: {
          date_maj?: string | null
          id_reglement: number
          reglement?: string | null
          titre?: string | null
        }
        Update: {
          date_maj?: string | null
          id_reglement?: number
          reglement?: string | null
          titre?: string | null
        }
        Relationships: []
      }
      data_salles: {
        Row: {
          id_ecole: number | null
          id_salle: number
          nom: string | null
        }
        Insert: {
          id_ecole?: number | null
          id_salle: number
          nom?: string | null
        }
        Update: {
          id_ecole?: number | null
          id_salle?: number
          nom?: string | null
        }
        Relationships: []
      }
      data_timelines: {
        Row: {
          commentaire: string | null
          date_creation: string | null
          date_modification: string | null
          id_ecole: number | null
          id_ecole_redac: number | null
          id_professeur: number | null
          id_statut: number | null
          id_timeline: number
          titre: string | null
        }
        Insert: {
          commentaire?: string | null
          date_creation?: string | null
          date_modification?: string | null
          id_ecole?: number | null
          id_ecole_redac?: number | null
          id_professeur?: number | null
          id_statut?: number | null
          id_timeline: number
          titre?: string | null
        }
        Update: {
          commentaire?: string | null
          date_creation?: string | null
          date_modification?: string | null
          id_ecole?: number | null
          id_ecole_redac?: number | null
          id_professeur?: number | null
          id_statut?: number | null
          id_timeline?: number
          titre?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "readonly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "readonly"],
    },
  },
} as const
