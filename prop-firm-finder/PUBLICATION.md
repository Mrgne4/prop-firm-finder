# Publier gratuitement sur GitHub Pages — instructions simples (à faire seulement après ton feu vert)
1. Crée un compte sur github.com (gratuit), puis un dépôt **public** nommé `prop-firm-finder`.
2. Dézippe le projet. Sur la page du dépôt : « Add file › Upload files », glisse **tout le contenu** du dossier (sauf `node_modules` et `dist` s'ils existent). Le dossier caché `.github` doit être inclus ; si ton ordinateur le cache, active « afficher les fichiers cachés ». Clique « Commit changes » sur la branche `main`.
3. Dépôt › **Settings › Pages › Build and deployment › Source : « GitHub Actions »**.
4. Onglet **Actions** : « Déploiement GitHub Pages » démarre seul (tests, validation des données, build, publication). Attends la coche verte (quelques minutes). Si c'est rouge, rien n'est publié : ouvre l'étape en échec et envoie-moi le message.
5. Ton site : `https://TON-UTILISATEUR.github.io/prop-firm-finder/` — partage ce lien sur Discord.
6. Vérifie sur ton téléphone : aucune mention « DÉMO », « Prix à vérifier » sur les prix, l'avertissement avant les boutons « Site officiel ».
7. Mise à jour : modifie un fichier JSON dans `data/` (« Edit » sur GitHub), commit sur `main` : le site se redéploie seul. Relis les prix et dates avant le 14 janvier 2027 (60 jours après le 15 novembre 2026).
Rappels : le site est public (toute personne avec le lien peut l'ouvrir) ; ne règle jamais `VITE_SHOW_DEMO=true` en production.
