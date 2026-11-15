# surprise!

Un site despre cuvântul **surpriză** — de unde vine, ce face cu noi și de ce nu le place tuturor.
Proiect pentru cursul de web design · © by Ștefania Dobra · 2026

## Capitole (meniu numerotat, câte un capitol pe pagină)

| # | Pagina | Ce conține |
| --- | --- | --- |
| 00 | Start | cuvântul mare, întrebarea „îți plac surprizele?”, prăjitura cu răvaș, capitolele, cadourile ascunse |
| 01 | Cuvântul | etimologia în EN / DE / RO / HU și cuvântul în alte 12 limbi |
| 02 | Știința | fața surprinsă, ce se întâmplă pas cu pas, ce face creierul |
| 03 | Două fețe | cele două opinii lungi ca două cadouri, cele două drumuri emoționale, linia speranței cu trei finaluri |
| 04 | Voci | toate opiniile pe aceeași linie + răspunsul vizitatorului |
| 05 | Fă o surpriză | cinci principii și un generator de idei |
| 06 | Joacă | nouă cutii amestecate |
| ⓘ | Despre site | logica site-ului, ce înseamnă fiecare culoare și „ce spune culoarea preferată despre tine” |

## Cerințele

- **Adaptiv**: un singur layout, de la 320 px la ecran lat. Meniul stă pe un rând cât timp încape lângă logo;
  când nu mai încape (ecran îngust sau o limbă cu cuvinte mai lungi), devine un ecran întreg.
- **Temă**: luminoasă / sistem / întunecată, din Setări (se ține minte alegerea).
- **Limbi**: engleză, germană, română, maghiară. La prima vizită se ia limba browserului.
- **Mișcare doar cu acord**: site-ul întreabă „îți plac surprizele?”. Până la răspuns nu se mișcă nimic.
  Cu „da” apar animații și confetti; cu „nu” rămâne nemișcat și se schimbă chiar conținutul
  (prăjitura e deja deschisă și anunță ce fel de răvaș urmează, butonul din subsol spune dinainte ce face).
- **Opiniile** nu sunt o listă de citate: sunt cadourile din „Două fețe”, punctele de pe linia din „Voci”
  și răvașele din prăjitură.
- HTML, CSS și JavaScript simplu, fără framework-uri și fără pas de build.

## Fișiere

| Fișier | Ce conține |
| --- | --- |
| `index.html` | structura paginilor |
| `css/style.css` | culori (tokens pentru ambele teme), tipografie, layout, animații |
| `js/i18n.js` | toate textele, în cele patru limbi |
| `js/voices.js` | lista opiniilor și poziția lor pe linie — aici se adaugă una nouă |
| `js/main.js` | limbă, temă, mișcare, meniu, capitole, interacțiuni |

## Publicare pe GitHub Pages

1. Creează un repository **public** pe GitHub și urcă aceste fișiere în rădăcina lui (cu tot cu `css/` și `js/`).
2. În repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Alege branch-ul `main` și folderul `/ (root)`, apoi **Save**.
4. După un minut-două, site-ul e la `https://<utilizator>.github.io/<nume-repo>/`.

Local: dezarhivează tot folderul și deschide `index.html` în browser.
