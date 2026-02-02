# Journal de Conception Pédagogique

Ce document explique les choix techniques et l'ordre des actions entreprises pour construire le projet `montaigu-leads`.

## Phase 1 : Acquisition de la Donnée (Scraping)

**Action** : Création d'un script de "scraping" (extraction de données) pour récupérer la liste des entreprises depuis l'annuaire de Terres de Montaigu.

**Pourquoi (Nécessité)** : 
Avant de construire une belle interface (le dashboard), nous avons besoin de "matière première". Sans données réelles, nous ne pouvons que faire des suppositions sur le design. Avoir les vraies données dès le début permet de :
1.  Concevoir le modèle de données (Data Model) exact (quels champs existent vraiment ?).
2.  Tester l'interface avec du contenu réaliste (noms longs, champs manquants, etc.).

**Bonne Pratique (Technique)** : 
Nous utilisons des outils comme `axios` (pour faire la requête HTTP) et `cheerio` (pour lire le HTML, comme jQuery côté serveur). C'est plus léger et rapide qu'un navigateur complet (comme Playwright) lorsque le site est statique.

**Ordre des opérations** :
1.  Installer les dépendances (`npm install`).
2.  Écrire le script `scripts/scrape-leads.ts`.
3.  Exécuter le script pour générer un fichier JSON `data/leads.json`.
4.  Utiliser ce fichier JSON comme "base de données" pour notre MVP.
