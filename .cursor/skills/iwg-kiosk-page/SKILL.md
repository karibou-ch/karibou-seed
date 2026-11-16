---
name: iwg-kiosk-page
description: >-
  Rebuild the Regus IWG kiosk page at docs/pages/iwg/index.html from the
  karibou product catalog. Use when editing that page, the hub
  regus-signature-spaces offer, kiosk prices, or card items and notes.
---

# Page kiosk IWG

Source unique : `karibou-seed/docs/pages/iwg/index.html`. Ne pas recréer `docs/pages/main`.

Le tarif affiché est le tarif kiosk. Priorité : prix imposé hors catalogue, puis prix déjà publié, puis prix Karibou × 1,30 arrondi au centime. Ne jamais écrire « +30 % », « Karibou » ni « Nouveau » sur la carte. Pas de bordure spéciale pour les formules ajoutées.

## Carte

- Le titre est le nom commercial. La référence (`BF-01`, `LU-03`, `AP-01`, `DE-01`) est une pastille au-dessus du titre, fond inversé par rapport à la carte, pas dans le titre.
- Une ligne est une finalité, trois au plus. Les variantes vont dans la note du bas, précédée de « À choix ».
- Une composition fixe (les pièces sont toutes livrées) reste en lignes. Ce n'est pas un choix.
- Une longue description sans liste reçoit les pièces qui distinguent l'offre, pas le paragraphe entier.
- Sous le dernier item, un padding sépare la note (`mt-auto pt-8` autour de la note). La note reste en bas de carte.
- Le délai se lit dans `attributes.timelimit` (heures). S'il est supérieur à 24, l'afficher en badge sur la carte, hors de la note. À 24 h ou en dessous, il reste une mention ordinaire de la note.

## Éléments imposés hors catalogue

Textes et prix qu'on ne déduit pas du catalogue. Un prix de cette liste gagne sur le prix publié et sur le fallback × 1,30.

Haut de page, titre : Le Kiosk - Regus · Signature · Spaces. Aucune mention de karibou.ch dans l'en-tête.

Pied de page : « Karibou.ch, le premium durable compétitif : nous sélectionnons pour vous des produits artisanaux des marchés de Genève, pour vous offrir une expérience gourmande, locale et de qualité. » Cette occurrence est du texte, pas un lien. Pas d'autre karibou.ch dans le pied, pas de « Nos produits », pas de « Contact ». Chaque bundle ajoute « Prix hors frais de livraison ».

| Code | Imposé |
|---|---|
| LU-03 | note : « À choix. Salade : César, végétarienne, ou saumon et écrevisses. Sandwich : pain au lait (jambon, fromage ou salami) ou pain complet (poulet curry, thon, jambon cru, roast beef ou viande séchée). Quiche : lorraine, patate douce, ou saumon et courgette. Sans boisson. Délai 48h. Minimum 2 personnes. » |
| LU-04 | une seule ligne « Sandwich », 14 CHF |
| LU-05 | 25 CHF |
| LU-06 | « lentilles, truite fumée, légumes croquants », 14 CHF |
| Fromages & charcuterie | code AP-02. Ligne : « Charcuterie artisanale du terroir & suisse / sans sel nitrité, sans conservateurs de synthèse » |
| BF-05 | 75 CHF |
| AP-01 | 99 CHF |
| AP-03 | 139 CHF |
| AP-04 | 89 CHF |
| DE-01 | 65 CHF |

## Fromages

Si la description mentionne une proportion de type: pates molle, dure, fromage frais, sans explication c'est 100% pâtes dures.
