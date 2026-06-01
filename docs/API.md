# Référence API — TontineApp

Toutes les requêtes passent par l'**API Gateway** (`http://localhost:8080`), qui route vers les microservices.
La documentation interactive **Swagger** est disponible par service :
- auth-service : http://localhost:3001/api-docs
- tontine-service : http://localhost:3002/api-docs

L'authentification utilise un **JWT** transmis dans l'en-tête `Authorization: Bearer <token>`.

---

## Auth Service (`/api/auth`)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Inscription. Body : `{ fullName, email, password }` → `201 { user }` |
| POST | `/api/auth/login` | — | Connexion. Body : `{ email, password }` → `200 { token, user }` |
| POST | `/api/auth/password/forgot` | — | Demande d'OTP. Body : `{ email }` → `200 { ok, debugOtp? }` |
| POST | `/api/auth/otp/verify` | — | Vérifie l'OTP. Body : `{ email, otp }` → `200 { token, user }` |
| GET | `/api/auth/me` | ✅ | Profil de l'utilisateur connecté → `200 { user }` |

## Tontine Service (`/api/groups`)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/groups` | ✅ | Liste des groupes de l'utilisateur |
| POST | `/api/groups` | ✅ | Créer un groupe. Body : `{ name, description?, contributionAmount, frequency }` |
| GET | `/api/groups/:id` | ✅ | Détail d'un groupe + membres |
| POST | `/api/groups/:id/members` | ✅ | Ajouter un membre (propriétaire). Body : `{ userId }` |
| POST | `/api/groups/:id/contribute` | ✅ | Enregistrer une cotisation. Body : `{ amount, daysLate? }` |
| GET | `/api/groups/:id/rotation` | ✅ | Ordre courant, recommandé et prochain bénéficiaire |
| GET | `/api/groups/:id/history` | ✅ | Historique des transactions |

## Notification Service (`/api/notify`)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notify` | ✅ | Liste des notifications de l'utilisateur |
| POST | `/api/notify/:id/read` | ✅ | Marquer une notification comme lue |
| WS | `/socket.io` | ✅ (token au handshake) | Canal temps réel des notifications |

---

## Codes de réponse courants

| Code | Signification |
|---|---|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Données invalides (validation Zod) |
| 401 | Token manquant ou invalide |
| 403 | Action non autorisée |
| 404 | Ressource introuvable |
| 409 | Conflit (ex : email déjà utilisé) |

---

## Observabilité

Chaque service expose ses métriques Prometheus sur `/metrics` et un endpoint de santé sur `/health`.
