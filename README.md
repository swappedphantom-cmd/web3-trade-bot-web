# web3-trade-bot-web

Site web (Next.js) qui affiche le classement des **bots de trading web3/DEX** analysés par
[`web3-trade-bot-analyzer`](https://github.com/swappedphantom-cmd/web3-trade-bot-analyzer).

**100 % statique (SSG)** : les données sont figées dans `data/bots.json` au build → aucun backend,
aucune base, déploiement instantané sur **Vercel** (gratuit).

## Fonctionnalités
- Classement par score (qualité · capacités · sécurité)
- Recherche plein texte + filtres chaîne / DEX / stratégie
- Badge sécurité (✓ clean / ⚠ red flags) et marqueur 💰 pour les stratégies orientées profit
- Liens directs vers les repos GitHub

## Développement local
```bash
npm install
npm run dev          # http://localhost:3000
```

## Rafraîchir les données
Lance l'analyzer (`web3-trade-bot-analyzer`, `npm run dev`) puis :
```bash
ANALYZER_URL=http://localhost:3000 npm run sync   # régénère data/bots.json
git commit -am "data: refresh bots" && git push   # Vercel redéploie automatiquement
```

## Déployer sur Vercel
1. Pousser ce repo sur GitHub (fait).
2. Sur https://vercel.com/new → **Import** ce dépôt (Vercel est déjà connecté à ton GitHub).
3. Framework détecté : **Next.js** — laisser les réglages par défaut → **Deploy**.
4. Chaque `git push` sur `main` redéploie automatiquement.

Aucune variable d'environnement requise (le site lit `data/bots.json` au build).
