# Eden — pohled ze sedadla

První neoficiální interaktivní prototyp stadionu Eden / Fortuna Areny. Obsahuje zjednodušený celý stadion a sektor 115 na východní tribuně s 768 ukázkovými sedadly (32 řad × 24 míst).

## Spuštění

Je potřeba Node.js 22 nebo novější, npm a aktuální prohlížeč s WebGL 2.

```sh
git clone https://github.com/kmudra/eden-seat-prototype.git
cd eden-seat-prototype
npm ci
npm run vendor
npm run dev
```

Otevřete **http://127.0.0.1:5173**. Příkaz `npm run vendor` zkopíruje Three.js a OrbitControls z nainstalovaného balíčku do `dist/vendor`. Tato složka se generuje a není verzovaná. Po přípravě model nepotřebuje externí CDN. Otevření `index.html` přímo přes `file://` není podporovaný způsob spuštění ES modulů.

Pro statický hosting lze po přípravě publikovat obsah složky `dist`. Specifická konfigurace původního hostingu Sites není součástí tohoto repozitáře.

## Ovládání

- Celý stadion: tažení otáčí kamerou, kolečko nebo tlačítka +/− přibližují.
- Sektor 115: vyberte sedadlo přímo v 3D modelu, v plánku nebo pomocí polí Řada a Sedadlo.
- Podívat se z místa: kamera se přesune do výšky očí. Tažením nebo šipkami se lze rozhlížet, kolečkem měnit zorný úhel.
- Escape / Zpět k výběru sedadla: návrat k sektoru.
- Střecha: lze ji zobrazit nebo skrýt. Při vstupu do pohledu ze sedadla se zobrazí automaticky.
- Na mobilu se panel s výběrem nachází pod modelem. Tlačítko pohledu posune stránku zpět k modelu.

## Přesnost a podklady

Převzaté skutečnosti: hřiště 105 × 68 m, východní poloha sektoru 115, orientace tribun, červená sedadla, zastřešení a odlišné členění hlavní tribuny. Veřejné reference byly prohlédnuty 21. 11. 2026:

- https://www.slavia.cz/cze/fortuna-arena
- https://www.slavia.cz/plan-stadionu
- https://www.slavia.cz/upload/media/2026/1785245574_cenovy-plan-fortuna-arena-cerven-2026-czweb.jpg
- https://www.vodafone.cz/nejen-pro-media/zajimave-cteni/pokryti-slavia-praha/

Odhadované: vnější rozměry, sklony a výšky tribun, členění VIP úrovní, tvar střechy, počet řad, počet a rozteč sedadel. Číslování 32 × 24 je vlastní demonstrační síť, nikoli skutečný seznam míst ze systému prodeje vstupenek. Rozměry lze upravit v `stadium-data.js` a `stadium.js`.

Výhled je pouze orientační. Nezahrnuje diváky ani všechny skutečné překážky a oplocení. Vzdálenost od postranní čáry je vodorovná vzdálenost v modelu; výška pohledu se počítá 1,18 m nad podlahou řady. Projekt neprovádí rezervace ani prodej vstupenek. Cizí fotografie nejsou distribuovány, sloužily jen jako reference pro vlastní programově vytvořenou geometrii.

## Soubory

| Soubor | Účel |
|---|---|
| `dist/index.html` | Česká stránka, panel výběru a informace o přesnosti |
| `dist/styles.css` | Vzhled a rozložení pro počítač a mobil |
| `dist/app.js` | Výběr míst, klikání, kamera, animace a ovládání |
| `dist/stadium.js` | Generování tribun, sedadel, hřiště, branek, střechy a VIP pásu |
| `dist/stadium-data.js` | Rozměry, data ukázkového sektoru, souřadnice sedadel a výpočty |
| `dist/favicon.svg` | Ikona prototypu |
| `dist/vendor/` | Generované soubory Three.js 0.180.0, OrbitControls a licence MIT; nejsou verzované |
| `preview.mjs` | Lokální statický HTTP server |
| `scripts/vendor.mjs` | Obnovení lokálních knihoven z nainstalovaného balíčku |
| `tests/stadium.test.mjs` | Testy rozměrů a integrity dat sedadel |
| `package.json`, `package-lock.json` | Jediná závislost Three.js a spouštěcí příkazy |

## Validace

- `npm test`: 4 testy — rozměry hřiště, unikátní sedadla a souřadnice, vzestup řad, odmítnutí neplatných čísel.
- `node --check dist/app.js` a `node --check dist/stadium.js`: kontrola syntaxe.
- V prohlížeči: načtení WebGL bez chyb, kliknutí na sedadlo přímo ve 3D, výběr v mapě a polích, první a poslední řada, přechod do výhledu a návrat Escape, informace o modelu.
- Mobilní rozložení při šířce 390 px: bez vodorovného přesahu, změna sedadla a automatický návrat k modelu.

Výkon nebyl měřen na fyzickém telefonu; mobilní kontrola ověřuje rozložení a chování v prohlížeči. Model není stavební dokumentací ani ověřeným podkladem pro nákup konkrétní vstupenky.

## Úpravy závislosti

Po `npm ci` obnovte knihovny příkazem `npm run vendor`. Distribuované soubory knihovny neupravujte ručně. Three.js vykresluje opakovaná sedadla společně pomocí instancí; interaktivní sedadla jsou oddělená pro rychlejší výběr.
