# SmartClub

Monorepo du site SmartClub (soutien scolaire à Tahiti), dérivé de Polykids.

| Dossier | Rôle | Projet Vercel (Root Directory) |
|---|---|---|
| `site/`  | Site public (Vite + React + Tailwind, design SmartClub) | `site` |
| `admin/` | Back-office (Vite + React + shadcn, base Polykids Manager) | `admin` |
| `supabase/migrations/` | Schéma de la base (déjà appliqué sur le projet Supabase) | — |

## Développement
```
cd site  && npm install && npm run dev    # http://localhost:8080
cd admin && npm install && npm run dev    # http://localhost:8081
```

## Variables d'environnement (Vercel, les deux projets)
- `VITE_SUPABASE_URL` = https://imxkbglxawydfojuyfjt.supabase.co
- `VITE_SUPABASE_PUBLISHABLE_KEY` = clé publishable du projet

Admin uniquement (envoi d'emails via Brevo, `admin/api/send-email.ts`) :
- `BREVO_API_KEY`, `MAIL_FROM`, `MAIL_REPLY_TO`

## Donner l'accès admin à un compte
1. Supabase → Authentication → Users → Add user (email + mot de passe).
2. SQL Editor :
   `insert into user_roles (user_id, role) select id, 'admin' from auth.users where email = 'EMAIL';`
