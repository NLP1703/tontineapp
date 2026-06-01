# Guide Utilisateur — TontineApp

Ce guide explique comment utiliser TontineApp, de la création de compte à la gestion d'une tontine.

---

## 1. Accès à l'application

Ouvrez votre navigateur sur l'adresse fournie :
- **Développement local :** http://localhost:8080
- **Production :** l'URL de votre déploiement

---

## 2. Créer un compte

1. Depuis la page d'accueil, cliquez sur **Créer un compte**.
2. Renseignez votre **nom**, votre **email** et un **mot de passe** (8 caractères minimum).
3. Validez : vous êtes automatiquement connecté et redirigé vers le tableau de bord.

---

## 3. Se connecter

1. Cliquez sur **Connexion**.
2. Saisissez votre email et mot de passe.
3. En cas d'oubli, cliquez sur **Mot de passe oublié** :
   - Saisissez votre email → un **code OTP** vous est transmis.
   - Entrez le code sur la page de vérification pour récupérer l'accès.

> En environnement de développement, l'OTP est affiché directement à l'écran (pas d'envoi d'email réel).

---

## 4. Le tableau de bord

Le tableau de bord affiche :
- **Total des cotisations** cumulées de vos groupes.
- **Nombre de tontines actives** et de groupes.
- **Graphique d'évolution** des cotisations dans le temps.
- La **liste de vos groupes**.

---

## 5. Gérer les groupes de tontine

### Créer un groupe
1. Allez dans **Groupes**.
2. Cliquez sur **Créer un groupe**.
3. Renseignez le **nom**, le **montant de cotisation** et la **fréquence** (mensuelle, bi-mensuelle, hebdomadaire).
4. Validez : vous devenez automatiquement le premier membre.

### Consulter un groupe
Cliquez sur **Voir le groupe** pour accéder au détail :
- **Membres & ordre de rotation** : chaque membre est listé avec son rang et son **score de fiabilité**.
- Le **prochain bénéficiaire** de la cagnotte est mis en évidence.
- **Historique des cotisations** du groupe.

### Cotiser
1. Sur la page du groupe, saisissez le **montant** dans le champ de cotisation.
2. Cliquez sur **Cotiser**.
3. Votre cotisation est enregistrée et votre **score de fiabilité** est recalculé automatiquement.

---

## 6. Le score de fiabilité (fonctionnalité intelligente)

TontineApp calcule un **score de fiabilité** (0 à 100) pour chaque membre, basé sur la ponctualité de ses paiements :
- Un membre qui paie toujours à temps approche de **100**.
- Les retards font baisser le score.
- Les membres les plus fiables sont recommandés en priorité dans l'ordre de rotation.
- Un membre dont le score passe sous **60** est considéré « à risque » et reçoit des **alertes préventives** avant l'échéance.

---

## 7. Notifications

Les notifications temps réel (cotisation enregistrée, rappel d'échéance) apparaissent automatiquement grâce à une connexion WebSocket. Les rappels d'échéance sont envoyés **3 jours avant** la date limite.

---

## 8. Se déconnecter

Votre session est conservée tant que vous ne vous déconnectez pas. En cas d'expiration du jeton, vous êtes automatiquement redirigé vers la page de connexion.
