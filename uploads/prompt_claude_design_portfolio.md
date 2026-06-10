# Prompt pour Claude Design — Portfolio de Jassem (monteur vidéo)

> À coller dans Claude Design **avec la maquette annotée en pièce jointe**.

---

## CONTEXTE

Construis un site portfolio **mono-page** pour **Jassem**, monteur vidéo & motion designer. La maquette jointe sert de **référence visuelle de mise en page**, mais applique les modifications décrites plus bas (la maquette est un template "brand designer" que je détourne pour un monteur vidéo). Ignore tout le contenu textuel portugais du template : le site est **entièrement en anglais**.

## STACK & CONTRAINTES TECHNIQUES

- **Site statique** : HTML + CSS + JavaScript vanilla (pas de framework lourd, pas de build complexe). Objectif : facile à héberger (Netlify / Cloudflare Pages) et facile à éditer à la main.
- **Aucune base de données.** Toutes les vidéos sont décrites dans un seul fichier de config (voir "SYSTÈME VIDÉO").
- Code **propre et commenté**. Termine par un court **README** expliquant : (a) comment ajouter une vidéo, (b) comment déployer.
- Les médias réels (vidéos, posters, photos, logo) seront ajoutés par moi **après**. **N'utilise PAS de fichiers `.mp4` réels** (ils n'existent pas encore). À la place, chaque emplacement vidéo affiche une **image poster placeholder neutre** (bloc de couleur unie ou léger dégradé, au **ratio correct** 9:16 ou 16:9) avec une **icône play en overlay** + le titre factice. Le site doit donc avoir l'air **fini et jugeable** dès la première génération.
- **Pré-remplis `videos.js` avec exactement le nombre de cartes du template** (voir maquette) pour chaque zone, afin que le rendu soit **identique à la maquette** : bento "Highlighted work" complet, et chaque catégorie de la galerie remplie. Structure le code pour que **déposer mes vrais `.mp4` dans les dossiers + garder ces mêmes entrées** les rende live automatiquement (par convention de nommage, sans rien recâbler).

## IDENTITÉ VISUELLE

- **Positionnement : clean, premium, minimaliste.** Beaucoup d'air, hiérarchie typographique nette, rien de chargé.
- **Palette : fond blanc, accent `#066DE7` (bleu), neutres (noirs/gris).** L'accent s'utilise avec parcimonie (CTA, hovers, détails). PAS le multicolore du template.
- Typo **sans-serif** moderne et nette.
- **Vertical-first** : la majorité des vidéos sont au format **9:16**. Le site et la grille doivent être pensés mobile en priorité, et impeccables en responsive.

## STRUCTURE DE LA PAGE (dans cet ordre)

1. **Navbar** (sticky, sobre) : wordmark "Jassem" à gauche ; liens **About / Works / Contact** (ancres internes) ; bouton **"Get in touch"** à droite.

2. **Hero** : titre + sous-titre + 2 CTA + média showreel.
   - Titre : *Clean, premium edits that grow audiences and convert.*
   - Sous-titre : *I'm Jassem — video editor & from-scratch motion designer for brands and creators who want to look high-end.*
   - CTA : **"Get in touch"** (plein, accent) + **"View work"** (outline).
   - Média : un **showreel en autoplay, muet, en boucle** (placeholder vidéo). Bouton discret pour activer le son / agrandir.
   - Ajoute une **stat chip** bien visible : **"4K → 136K followers in 12 months"**.

3. **Showreel (section dédiée, pleine largeur)** : le showreel/VSL complet, **lecture au clic avec son**, grand format. Titre de section : *Showreel*. (Le hero est le teaser muet, cette section est la version complète.)

4. **Personal message + contact band** :
   - Message : *I love working with brands and founders. If you're ready to make your content look premium — and actually convert — let's talk.*
   - **Email** (placeholder : `hello@jassem.com`) + (optionnel) téléphone.
   - CTA **"Let's talk"**.
   - **Deux photos** placeholder à droite (comme le template).

5. **VRSS Case Study** (section dédiée — voir "VRSS CASE STUDY").

6. **Highlighted Work** (le bento — voir "SYSTÈME VIDÉO / Bento") : titre de section *Highlighted work*.

7. **Work by Category** : galerie de cartes 9:16 **filtrable** par onglets **All / Entertainment / Educational / Corporate**. Titre : *Work by category*.

8. **Testimonials** : 2-3 témoignages clients (placeholders : nom, rôle, logo/avatar, citation). Titre : *What clients say*.

9. **Footer / Contact** : email, liens réseaux (placeholders), CTA final, mention copyright.

## SYSTÈME VIDÉO (point central — implémente-le exactement)

### Fichier de config unique
Crée un fichier `videos.js` (ou `videos.json`) qui est la **source de vérité unique**. Le site génère **toutes** les cartes vidéo à partir de ce fichier. Chaque vidéo :

```js
{ cat: "educational", file: "edu_1", title: "Short title", client: "VRSS", instagram: "" }
```

- `cat` ∈ `entertainment` | `educational` | `corporate`
- Le code **déduit les chemins par convention** : `videos/<cat>/<file>.mp4` (vidéo) et `videos/<cat>/<file>.jpg` (poster). Donc je n'ai à taper que `cat`, `file`, `title` (et `client`/`instagram` optionnels).

### Emplacements "Highlighted" (résout le problème du nombre limité)
**N'utilise PAS de booléen `featured`.** Utilise un objet **`featuredLayout`** qui liste explicitement, dans l'ordre, ce qui occupe les emplacements fixes du bento :

```js
const featuredLayout = {
  bigCard: "vsl_1",                                 // grande carte HORIZONTALE 16:9 (showreel/VSL)
  verticalCards: ["ent_1", "edu_1", "cor_1", "ent_2"], // cartes 9:16
  statCards: [{ value: "4K → 136K", label: "Instagram followers · 12 months" }]
};
```

- Le bento reproduit **le nombre et la disposition exacts** du template (cf. maquette) : **1 grande carte horizontale** (showreel/VSL) + plusieurs **cartes 9:16** + **1-2 cartes statistiques**. Pré-remplis `featuredLayout` avec **autant d'IDs placeholder qu'il y a d'emplacements** dans la maquette (rien de vide).
- Si `verticalCards` contient plus d'IDs que d'emplacements, le code **ignore le surplus** et émet un `console.warn`. Le layout ne casse jamais.
- **Galerie par catégorie** : pré-remplis chaque catégorie (Entertainment / Educational / Corporate) avec ~4 entrées placeholder, comme les rangées du template.

### Comportement en mode placeholder (aucun .mp4 réel)
- Tant qu'aucun fichier vidéo n'existe, **chaque carte affiche son poster placeholder** (bloc neutre au bon ratio + icône play + titre) — **jamais de cadre vidéo cassé/noir**.
- Le hover (desktop) et le modal (clic) restent fonctionnels : en l'absence de `.mp4`, le hover ne fait que mettre en valeur le poster, et le modal affiche le poster agrandi. Dès qu'un `.mp4` est déposé au chemin attendu, la lecture s'active automatiquement.

### Cartes vidéo 9:16
- Ratio **légèrement plus haut que 9:16** pour réserver une **petite bande de texte** sous la vidéo (titre court + client), comme annoté sur la maquette.
- Affiche d'abord le **poster** (image). `preload="none"`, **lazy-load**.
- **Desktop** : lecture muette en autoplay **au survol**. **Mobile** : lecture **au tap**.
- **Clic** → ouvre un **modal / lightbox** avec lecteur plus grand, **son activé**, contrôles, et le titre/lien Instagram s'il existe.

### Cartes statistiques
Mêmes dimensions que les cartes du bento, fond accent ou neutre, affichant un grand chiffre (`value`) + label. Servent de preuve visuelle au milieu des vidéos.

### Performance
Lazy-load partout, posters légers, `preload="none"`, pas de lecture simultanée de plusieurs vidéos. Inclus dans le README ce one-liner ffmpeg pour générer les posters en lot :
`for f in *.mp4; do ffmpeg -i "$f" -vframes 1 "${f%.mp4}.jpg"; done`

## VRSS CASE STUDY (section dédiée)

Reprends le style général (clean, accent `#066DE7`). Contenu :
- **Logo VRSS** (placeholder).
- Titre : *Case study — VRSS Fightgear*.
- Court paragraphe (placeholder éditable) : marque d'équipement d'arts martiaux ; 15 vidéos courtes/mois pendant un an ; **Instagram passé de 4K à 136K abonnés**.
- **Carte statistique forte** : **4K → 136K** en 12 mois.
- **2 à 3 cartes vidéo** (format vertical, même comportement que les cartes 9:16).
- **Témoignage client** (placeholder de citation + nom).
- **Lien Instagram** : `https://www.instagram.com/vrss_fightgear/` (bouton/icône).

## DÉTAILS FINAUX

- Animations sobres (fade/slide légers au scroll), rien de tape-à-l'œil.
- Accessibilité de base (alt, focus visibles, contrastes ok, navigation clavier sur le modal).
- Tout le **texte et les chiffres en dur**, regroupés en haut des fichiers et clairement commentés pour que je puisse les modifier facilement.
- **README** final : structure des dossiers vidéo, comment ajouter une vidéo (déposer 2 fichiers + 1 ligne de config), comment changer les highlighted, comment déployer sur Netlify/Cloudflare Pages.

## LIVRABLE
Le site complet, responsive, avec `videos.js` commenté et un jeu de placeholders cohérent (posters au bon ratio, copie en anglais ci-dessus), prêt à recevoir mes vrais médias.
