#  TontineApp — Système de Gestion de Tontines Numériques

> **Cours :** SEN3244 — Software Architecture  
> **Instructeur :** Engr. TEKOH PALMA  
> **Session :** Spring 2026  
> **Équipe :** Groupe [N°]

---

## Table des Matières

1. [Présentation du Projet]
2. [Problématique]
3. [Objectifs]
4. [Architecture du Système]
5. [Stack Technologique]
6. [Structure du Projet]
7. [Infrastructure Setup]
8. [Application de Scrum]
9. [Pipeline CI/CD avec Jenkins]
10. [Monitoring avec Prometheus & Grafana]
11. [Infrastructure as Code avec Ansible]
12. [Tests]
13. [Conteneurisation & Orchestration Kubernetes]
14. [Structures et Caractéristiques Architecturales]
15. [Innovation](
16. [Documentation]
17. [Installation & Lancement]
18. [Membres de l'équipe]

---

##  Présentation du Projet

TontineApp est une plateforme web moderne qui digitalise et automatise la gestion des tontines traditionnelles africaines. La tontine est une pratique d'épargne collective très répandue en Afrique centrale (notamment au Cameroun) où un groupe de personnes cotise régulièrement et, à tour de rôle, chaque membre reçoit la totalité de la cagnotte.

TontineApp transforme cette pratique informelle en un système transparent, traçable et sécurisé, accessible depuis n'importe quel navigateur web.

---

##  Problématique

La gestion manuelle des tontines présente plusieurs défis :

- Manque de transparence : les membres ne peuvent pas vérifier en temps réel l'état des cotisations
- Risques de fraude ou d'erreurs : calculs manuels, pertes de données
- Gestion du tour : litiges fréquents sur l'ordre de distribution
- Communication difficile: rappels de paiement informels, oublis fréquents
- Aucune historique fiable : impossible de retracer les transactions passées

---

## Objectifs

- Permettre la création et gestion de groupes de tontine en ligne
- Automatiser le suivi des cotisations et la rotation des bénéficiaires
- Envoyer des alertes et rappels automatiques aux membres
- Fournir un tableau de bord analytique avec historique complet
- Assurer la sécurité et l'intégrité des données financières

---

##  Architecture du Système

### Style Architectural : Architecture Microservices

TontineApp adopte une architecture microservices organisée en 3 services indépendants, communiquant via des APIs REST et des événements en temps réel.

```
                        ┌─────────────────────────────┐
                        │     UTILISATEURS (Browser)  │
                        └──────────────┬──────────────┘
                                       │ HTTPS
                        ┌──────────────▼──────────────┐
                        │     NGINX (Reverse Proxy)   │
                        │     + SSL Termination        │
                        └────┬──────────┬─────────────┘
                             │          │
               ┌─────────────▼──┐  ┌───▼──────────────┐
               │  React Frontend │  │   API Gateway    │
               │  (Port 3000)    │  │   (Port 8080)    │
               └─────────────────┘  └──┬───────────┬───┘
                                       │           │
                    ┌──────────────────▼──┐   ┌────▼─────────────────┐
                    │   Auth Service      │   │   Tontine Service    │
                    │   (Node.js :3001)   │   │   (Node.js :3002)    │
                    │                     │   │                      │
                    │ - Inscription       │   │ - Groupes            │
                    │ - Connexion JWT     │   │ - Cotisations        │
                    │ - Profil utilisateur│   │ - Rotation tours     │
                    └──────────┬──────────┘   └────────┬─────────────┘
                               │                       │
                    ┌──────────▼──────────────────────▼──────────────┐
                    │              Notification Service               │
                    │              (Node.js :3003)                    │
                    │                                                 │
                    │  - Alertes de paiement (Socket.io)             │
                    │  - Rappels automatiques (cron jobs)            │
                    │  - Historique des notifications                │
                    └────────────────────────────────────────────────┘
                               │                       │
               ┌───────────────▼──┐        ┌──────────▼───────────┐
               │   PostgreSQL     │        │       Redis           │
               │   (Port 5432)    │        │       (Port 6379)     │
               │                  │        │                       │
               │ - Utilisateurs   │        │ - Sessions JWT        │
               │ - Groupes        │        │ - Cache temps réel    │
               │ - Transactions   │        │ - Files de notifs     │
               └──────────────────┘        └───────────────────────┘
```

### Vue des Composants (Component View)

| Composant | Rôle | Technologies |
|---|---|---|
| Frontend SPA | Interface utilisateur | React 18, TailwindCSS, Chart.js |
| API Gateway| Routage, authentification, rate limiting | Nginx, Express |
| Auth Service | Gestion identités et sessions | Node.js, JWT, bcrypt |
| Tontine Service | Logique métier principale | Node.js, Express, Sequelize |
| Notification Service | Alertes temps réel et rappels | Node.js, Socket.io, node-cron |
| PostgreSQL | Persistance des données | PostgreSQL 15 |
| Redis| Cache et sessions | Redis 7 |

### Vue de Déploiement (Deployment View)

```
┌─────────────────────── VPS (Ubuntu 22.04) ───────────────────────────┐
│                                                                        │
│  ┌──────────────── Kubernetes Cluster ──────────────────────────────┐ │
│  │                                                                    │ │
│  │  Namespace: tontineapp                                            │ │
│  │                                                                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐             │ │
│  │  │ frontend    │  │auth-service │  │tontine-svc   │             │ │
│  │  │ Deployment  │  │ Deployment  │  │ Deployment   │             │ │
│  │  │ replicas: 2 │  │ replicas: 2 │  │ replicas: 2  │             │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘             │ │
│  │         │                │                 │                      │ │
│  │  ┌──────▼────────────────▼─────────────────▼───────┐             │ │
│  │  │              Kubernetes Services                 │             │ │
│  │  │         (ClusterIP + LoadBalancer)               │             │ │
│  │  └──────────────────────────────────────────────────┘             │ │
│  │                                                                    │ │
│  │  ┌────────────────────┐   ┌──────────────────────┐               │ │
│  │  │  PostgreSQL StatefulSet│   │  Redis StatefulSet   │               │ │
│  │  │  + PersistentVolume │   │  + PersistentVolume  │               │ │
│  │  └────────────────────┘   └──────────────────────┘               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌───────────────────┐   ┌────────────────────────────────────────┐  │
│  │  Prometheus       │   │   Grafana Dashboard                    │  │
│  │  (Port 9090)      │   │   (Port 3000)                          │  │
│  └───────────────────┘   └────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Stack Technologique

| Domaine | Technologie | Rôle |
|---|---|---|
| **Frontend** | React 18 + TailwindCSS | Interface utilisateur |
| **Backend** | Node.js + Express.js | Services API REST |
| **Temps réel** | Socket.io | Notifications live |
| **Base de données** | PostgreSQL 15 | Données persistantes |
| **Cache** | Redis 7 | Sessions & cache |
| **Conteneurisation** | Docker + Docker Compose | Isolation des services |
| **Orchestration** | Kubernetes (K3s) | Déploiement en prod |
| **CI/CD** | Jenkins | Pipeline automatisé |
| **Monitoring** | Prometheus + Grafana | Métriques & alertes |
| **IaC** | Ansible | Provisionnement infra |
| **Tests** | Jest + Supertest | Tests unitaires & intégration |
| **API Docs** | Swagger (swagger-ui-express) | Documentation API |
| **Authentification** | JWT + bcrypt | Sécurité |
| **Reverse Proxy** | Nginx | Routage & SSL |
| **Gestion Agile** | Trello | Scrum / Sprints |

---

## Structure du Projet

```
tontineapp/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/          # Composants UI réutilisables
│   │   ├── pages/               # Pages (Dashboard, Groupes, Profil)
│   │   ├── hooks/               # Custom hooks React
│   │   ├── services/            # Appels API
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
│
├── services/
│   ├── auth-service/            # Service d'authentification
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── middleware/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── tontine-service/         # Service logique métier
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── algorithms/      # Algorithme rotation + prédiction
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── notification-service/   # Service de notifications
│       ├── src/
│       │   ├── socket/
│       │   └── cron/
│       ├── Dockerfile
│       └── package.json
│
├── infrastructure/
│   ├── k8s/                     # Manifests Kubernetes
│   │   ├── deployments/
│   │   ├── services/
│   │   ├── configmaps/
│   │   └── persistentvolumes/
│   ├── ansible/                 # Playbooks Ansible
│   │   ├── playbook-install.yml
│   │   └── playbook-services.yml
│   └── monitoring/              # Configs Prometheus & Grafana
│       ├── prometheus.yml
│       └── grafana-dashboard.json
│
├── docker-compose.yml           # Dev local
├── Jenkinsfile                  # Pipeline CI/CD
├── nginx.conf                   # Config reverse proxy
└── README.md
```

---

## 1. Infrastructure Setup — 15 pts

### Ce qu'on fait
Nous déployons l'application sur un VPS  (ex: DigitalOcean, OVH, ou Contabo) configuré avec :

- **Nginx** comme reverse proxy avec SSL (Let's Encrypt)
- **Docker Engine** pour exécuter les conteneurs
- **K3s** (distribution légère de Kubernetes) pour l'orchestration
- Règles de **firewall UFW** : ports 80, 443, 22 uniquement

### Livrables
- [ ] Diagramme d'infrastructure (draw.io)
- [ ] Scripts Bash de configuration initiale du VPS
- [ ] Screenshots du VPS opérationnel et des services running
- [ ] Fichier `nginx.conf` documenté

---

## 2. Application de Scrum — 5 pts

### Organisation de l'équipe

| Rôle | Membre |
|---|---|
| Product Owner | Membre 1 |
| Scrum Master | Membre 2 |

### Sprints planifiés

**Sprint 1 (Semaines 1–2) :** Auth + structure de base  
→ Création des comptes, login/logout, modèles de données

**Sprint 2 (Semaines 3–4) :** Logique tontine  
→ Création de groupes, cotisations, algorithme de rotation

**Sprint 3 (Semaines 5–6) :** Notifications + DevOps  
→ Alertes temps réel, Jenkins, Docker, Kubernetes

**Sprint 4 (Semaines 7–8) :** Tests, Monitoring & Documentation  
→ Jest, Prometheus, Grafana, Swagger, rapport final

### Livrables
- [ ] Board Trello avec Product Backlog et Sprint Backlogs
- [ ] Burndown charts pour au moins 2 sprints
- [ ] Document de rétrospective par sprint

---

## 3. Pipeline CI/CD avec Jenkins — 10 pts

### Ce qu'on fait
Un pipeline Jenkins automatisé déclenché à chaque `git push` sur la branche `main` :

```groovy
// Jenkinsfile (extrait)
pipeline {
  agent any
  stages {
    stage('Checkout')   { /* Clone du repo GitHub */ }
    stage('Install')    { /* npm install sur chaque service */ }
    stage('Test')       { /* npm test -- Jest + coverage */ }
    stage('Build')      { /* docker build pour chaque service */ }
    stage('Push')       { /* Push images vers Docker Hub */ }
    stage('Deploy')     { /* kubectl apply sur le cluster K8s */ }
  }
}
```

### Étapes du pipeline
1. **Checkout** : récupération du code depuis GitHub
2. **Install** : installation des dépendances Node.js
3. **Test** : exécution des tests Jest avec rapport de couverture
4. **Build** : construction des images Docker pour chaque service
5. **Push** : envoi des images sur Docker Hub
6. **Deploy** : déploiement automatique sur Kubernetes

### Livrables
- [ ] `Jenkinsfile` complet à la racine du repo
- [ ] Screenshots des pipeline runs (succès et échec)
- [ ] Vidéo démo du pipeline en action

---

## 4. Monitoring avec Prometheus & Grafana — 2.5 pts

### Ce qu'on fait
Chaque service Node.js expose ses métriques via la librairie `prom-client`. Prometheus collecte ces métriques, Grafana les visualise.

### Métriques surveillées
- **Nombre de requêtes HTTP** par route et par statut
- **Durée des requêtes** (latence p95, p99)
- **Nombre de cotisations** enregistrées par heure
- **Connexions WebSocket actives** (notifications)
- **Utilisation CPU et mémoire** de chaque pod Kubernetes

### Livrables
- [ ] Screenshots du dashboard Grafana configuré
- [ ] Fichier `prometheus.yml` avec les scrape configs
- [ ] Alertes configurées (ex: latence > 500ms)

---

## 5. Infrastructure as Code avec Ansible — 2.5 pts

### Playbooks Ansible

**Playbook 1 — `playbook-install.yml`**  
Installe sur le VPS : Docker, Node.js, K3s, Nginx, et les dépendances système

**Playbook 2 — `playbook-services.yml`**  
Configure et démarre : Nginx (avec la config TontineApp), Prometheus, Grafana

### Livrables
- [ ] 2 fichiers YAML Ansible documentés
- [ ] Screenshots/logs d'exécution des playbooks

---

## 6. Tests de l'Application — 10 pts

### Stratégie de test

| Niveau | Outil | Cible | Couverture visée |
|---|---|---|---|
| **Tests Unitaires** | Jest | Algorithme de rotation, calculs de cotisation | > 80% |
| **Tests d'Intégration** | Supertest | Routes API REST | > 80% |
| **Tests E2E** *(bonus)* | Cypress | Parcours utilisateur complet | — |

### Cas de test clés
- ✅ Création d'un groupe de tontine
- ✅ Enregistrement d'une cotisation
- ✅ Calcul correct de l'ordre de rotation
- ✅ Authentification (token valide / invalide)
- ✅ Alerte déclenchée si cotisation en retard

### Livrables
- [ ] Rapport de couverture Jest (>80%)
- [ ] Scripts de tests automatisés
- [ ] Résultats de test en CI (Jenkins)

---

## 7. Conteneurisation & Orchestration Kubernetes — 15 pts

### Dockerfiles
Chaque service dispose de son propre `Dockerfile` multi-stage optimisé pour la production.

### Manifests Kubernetes

```
k8s/
├── deployments/
│   ├── frontend-deployment.yaml       # 2 réplicas
│   ├── auth-service-deployment.yaml   # 2 réplicas
│   ├── tontine-service-deployment.yaml# 2 réplicas
│   └── notification-service-deployment.yaml
├── services/
│   ├── frontend-service.yaml          # LoadBalancer
│   └── ...                            # ClusterIP pour les autres
├── configmaps/
│   └── app-config.yaml                # Variables d'environnement
└── persistentvolumes/
    ├── postgres-pv.yaml
    └── redis-pv.yaml
```

### Fonctionnalités K8s démontrées
- **Scaling horizontal** : `kubectl scale deployment tontine-service --replicas=4`
- **Rolling updates** : mise à jour sans downtime
- **Service discovery** : communication inter-services par nom DNS interne
- **HPA** (Horizontal Pod Autoscaler) : scaling automatique selon la charge CPU

### Livrables
- [ ] Dockerfiles pour chaque service
- [ ] Tous les manifests Kubernetes YAML
- [ ] Screenshots du dashboard K8s / sortie kubectl
- [ ] Démonstration du rolling update

---

## 8. Structures et Caractéristiques Architecturales — 20 pts

### Style Architectural choisi : Microservices

**Justification :**  
L'architecture microservices a été choisie car elle permet une séparation claire des responsabilités entre l'authentification, la logique métier de la tontine, et les notifications. Chaque service peut évoluer, être déployé et scalé indépendamment.

### Trade-offs
 Avantages |  Inconvénients |
|---|---|---|
| **Scalabilité** | Chaque service scale indépendamment | Complexité de gestion accrue |
| **Maintenabilité** | Code isolé et focalisé | Duplication possible de logique |
| **Résilience** | La panne d'un service n'affecte pas les autres | Gestion des pannes distribuées complexe |
| **Déploiement** | CI/CD indépendant par service | Orchestration nécessaire (K8s) |

### Attributs Qualité (Quality Attributes)

- **Performance** : Redis en cache pour les requêtes fréquentes, réponse < 200ms
- **Scalabilité** : HPA Kubernetes, scale jusqu'à 10 réplicas automatiquement
- **Sécurité** : JWT, bcrypt, HTTPS, règles firewall strictes
- **Disponibilité** : 2 réplicas minimum par service, rolling updates sans downtime
- **Observabilité** : Prometheus + Grafana, logs centralisés

### Livrables
- [ ] Document d'architecture avec diagrammes UML (composants, déploiement, séquence)
- [ ] Rapport détaillé du processus de conception architecturale
- [ ] Analyse des trade-offs documentée

---

## 9. Innovation — 10 pts

### Module de Prédiction Intelligente

TontineApp intègre un **algorithme prédictif** qui analyse le comportement de paiement des membres pour :

1. **Prédire les retards de paiement** : basé sur l'historique des 3 derniers mois, l'algorithme calcule un score de fiabilité pour chaque membre
2. **Recommander l'ordre de rotation optimal** : les membres avec un score de fiabilité élevé peuvent être proposés en priorité pour recevoir le premier tour
3. **Alertes préventives** : si un membre a un historique de retard, une alerte est envoyée 3 jours avant la date limite de cotisation

```javascript
// Algorithme de score de fiabilité (extrait)
function calculateReliabilityScore(member) {
  const payments = member.paymentHistory;  // 3 derniers mois
  const onTime = payments.filter(p => p.daysLate === 0).length;
  const avgDelay = payments.reduce((acc, p) => acc + p.daysLate, 0) / payments.length;
  return (onTime / payments.length) * 100 - avgDelay * 5;
}
```

### Livrables
- [ ] Description détaillée de l'algorithme
- [ ] Vidéo démo ou screenshots de la fonctionnalité en action

---

## 10. Documentation — 15 pts

- **README** : ce fichier (setup, usage, contribution)
- **API Swagger** : documentation interactive de tous les endpoints REST
- **Guide utilisateur** : manuel d'utilisation avec screenshots
- **Rapport de projet** : suivant le template fourni par l'instructeur

### Endpoints API principaux (Swagger)

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription d'un utilisateur |
| POST | `/api/auth/login` | Connexion, retourne JWT |
| GET | `/api/groups` | Liste des groupes de l'utilisateur |
| POST | `/api/groups` | Créer un nouveau groupe de tontine |
| POST | `/api/groups/:id/contribute` | Enregistrer une cotisation |
| GET | `/api/groups/:id/rotation` | Voir l'ordre de rotation du groupe |
| GET | `/api/groups/:id/history` | Historique des transactions |

### Livrables
- [ ] Swagger UI accessible sur `/api-docs`
- [ ] Collection Postman exportée
- [ ] Guide utilisateur PDF

---

## 🚀 Installation & Lancement

### Prérequis
- Docker & Docker Compose installés
- Node.js 18+
- Git

### Lancement en développement (local)

```bash
# 1. Cloner le repo
git clone https://github.com/[votre-username]/tontineapp.git
cd tontineapp

# 2. Copier les variables d'environnement
cp .env.example .env

# 3. Lancer tous les services
docker-compose up --build

# 4. L'application est disponible sur
# Frontend  → http://localhost:3000
# API Docs  → http://localhost:8080/api-docs
# Grafana   → http://localhost:3001 (admin/admin)
```

### Lancement en production (Kubernetes)

```bash
# Appliquer les manifests Kubernetes
kubectl apply -f infrastructure/k8s/

# Vérifier le déploiement
kubectl get pods -n tontineapp

# Accéder à l'application
kubectl get service frontend-service -n tontineapp
```

---


*Projet réalisé dans le cadre du cours SEN3244 — Software Architecture, ICT University, Spring 2026.*
