# Investment Memory — Homepage & Company Page

Definitieve product-, UX-, UI- en frontend-specificatie voor Claude Code
*(bijgewerkte versie — 3 beslissingen verwerkt t.o.v. het eerdere concept, zie changelog onderaan)*

Je bouwt een mobiele-first webapplicatie genaamd **Investment Memory**.

De app is een persoonlijk conviction-dagboek voor beleggers.

Het is nadrukkelijk géén trading-app, géén portfolio tracker en géén financieel dashboard.

De kern van het product:

> *"Remember what you thought.*
> *De markt onthoudt wat er met de koers gebeurde.*
> *Investment Memory onthoudt wat jij dacht toen het gebeurde."*

De app moet gebruikers helpen om:

- bewuster na te denken voordat ze investeren;
- hun beleggingsredenen vast te leggen;
- hun eigen overtuiging door de tijd heen te volgen;
- later terug te kijken wat ze dachten;
- hun eigen denkfouten en goede inschattingen te herkennen;
- minder vanuit impuls en meer vanuit overtuiging te handelen.

De app moet de gebruiker niet vertellen of een investering goed of slecht was.
De app verzamelt de context zodat de gebruiker dat later zelf kan beoordelen.

---

## 1. BELANGRIJKSTE PRODUCTPRINCIPES

Deze principes zijn belangrijker dan individuele componenten.

**1.1 Gedrag boven data**

De app moet gedrag beïnvloeden: Stop → Denk → Leg vast → Kijk later terug.
Niet: Open → Check koers → Reageer → Handel.

De interface mag daarom niet aanvoelen als een trading-app.
Vermijd visuele patronen die gebruikers uitnodigen om continu koersen te controleren.

**1.2 De app is een geheugen**

Een opgeslagen notitie is geen datapunt voor een analytics-dashboard.
Het is een moment uit de beleggingsreis. Bijvoorbeeld:

> *"Ik denk dat de markt de impact van AI op ASML onderschat."*

De app moet later kunnen laten zien: *"Je schreef dit toen ASML €742,50 noteerde."*
Daardoor ontstaat retrospectief inzicht.

**1.3 Geen oordeel**

De applicatie mag nooit automatisch zeggen: "Je had gelijk" / "Je had ongelijk" /
"Goede investering" / "Slechte investering" / "Je overtuiging was fout" /
"Je timing was slecht". De app laat alleen zien: *Wat dacht ik toen?*
De gebruiker trekt zelf de conclusie.

**1.4 Eenvoud boven volledigheid**

De gebruiker wil geen lange formulieren. Elke interactie moet zo weinig mogelijk
mentale belasting hebben. Een gebruiker moet binnen enkele seconden een nieuwe
herinnering kunnen toevoegen. Niet ieder moment hoeft uitgebreid geanalyseerd te worden.

---

## 2. MVP-SCOPE — WAT NU BEWUST BUITEN SCOPE VALT

> Toegevoegd in deze versie, zodat dit expliciet is voor wie de app bouwt.

- **Geen aparte "koop/verkoop-check"-flow.** Er is geen apart moment-type voor een
  voorgenomen aan- of verkoop met bijbehorende reflectievragen. Voor de MVP volstaan
  de twee bestaande toevoeg-opties (Notitie, Bron) plus de conviction-edit uit
  hoofdstuk 21. Dit kan in een latere versie alsnog worden toegevoegd als een derde
  toevoeg-optie, maar bouw er nu niets voor voor.
- **Geen thesis-geschiedenis.** De these is persistent en enkelvoudig (zie hoofdstuk 24).

---

## 3. TECHNISCHE CONTEXT

Gebruik de bestaande stack van het project:

- Next.js — App Router — React — TypeScript — Tailwind CSS
- Supabase — Supabase Auth — PostgreSQL — Row Level Security
- Vercel

Gebruik bestaande dependencies en architectuur wanneer deze al aanwezig zijn.
Niet onnodig de stack vervangen. Gebruik componenten die herbruikbaar zijn.
Maak geen monolithische page components.

---

## 4. DESIGN SYSTEM

**4.1 Algemene stijl**

De app moet voelen als: rustig, premium, modern, persoonlijk, betrouwbaar,
minimalistisch, editorial, Apple-achtig, mobiel, niet-financieel-dashboardachtig.

Denk eerder aan: *persoonlijk digitaal dagboek + moderne financiële context*
dan aan: *Bloomberg / TradingView / broker-app.*

**4.2 Kleurgebruik**

Basis: witte / zeer lichtgrijze achtergrond, donkerblauwe/donkergrijze tekst,
één duidelijke blauwe accentkleur.

Blauw wordt gebruikt voor: actieve elementen, interactieve punten, links,
primaire buttons, geselecteerde timeline-items, belangrijke interactieve states.

Gebruik groen/oranje/rood zeer terughoudend. Deze kleuren mogen niet de
primaire identiteit van de app worden.

**4.3 Cards**

Subtiele border, lichte radius, zeer zachte shadow waar nodig, veel witruimte,
geen zware gradients, geen glassmorphism, geen overdadige floating cards.
Cards moeten functioneel zijn. Niet iedere sectie hoeft in een card.

**4.4 Typografie**

Moderne sans-serif. Rustig en duidelijk. Kleine uppercase labels mogen gebruikt
worden voor context; grote headings zijn relatief bescheiden; bodytekst moet
comfortabel leesbaar zijn; geschreven notities mogen iets editorialer aanvoelen
dan interface-tekst. Vermijd overdreven grote headings.

---

## 5. MOBIEL IS DE PRIMARY DESIGN TARGET

Ontwerp eerst voor ongeveer 375–430 px viewport width. Daarna responsive
uitbreiden naar tablet/desktop. Op desktop mag de content maximaal een
comfortabele leesbreedte hebben. Maak geen desktop-dashboard dat toevallig
responsive wordt. De mobiele ervaring is leidend.

---

## 6. HOMEPAGE

Route: `/`

De homepage moet voelen als het persoonlijke startpunt van de gebruiker,
bijvoorbeeld: *Welkom Stef*.

De homepage moet in één oogopslag antwoord geven op:
1. Wat leeft er momenteel in mijn beleggingen?
2. Wat heb ik recent toegevoegd?
3. Zijn er oude momenten die ik opnieuw moet zien?
4. Welke bedrijven volg ik?

Maar de homepage mag geen analytics-dashboard worden.

---

## 7. HOMEPAGE STRUCTUUR

Header → Memories/Throwbacks → Portfolio → Watchlist → Floating +

Er hoeft géén grote aparte sectie "Laatste toevoegingen" te komen — die is al
zichtbaar binnen Portfolio en Watchlist. Dit houdt de homepage rustig.

---

## 8. HOMEPAGE HEADER

*Welkom Stef* — [avatar]

De avatar is klein. Klikken op avatar opent profiel (naam, profielfoto,
account, instellingen, lessen, uitloggen — later uit te breiden). Maak profiel
niet prominent op de homepage. De homepage draait om de beleggingsreis.

---

## 9. MEMORIES / THROWBACKS

Een van de belangrijkste onderdelen van de homepage. Doel: herinnering, geen
notificatie. Voorbeelden:

> **3 MAANDEN GELEDEN** — Je schreef over ASML — *"De markt onderschat volgens
> mij..."* — Bekijk moment →

> **6 MAANDEN GELEDEN** — Je voegde Microsoft toe aan je watchlist. — Bekijk
> moment →

**9.1 Horizontale cards** — Gebruik horizontale scroll. Laat een klein gedeelte
van de volgende card zien om dit duidelijk te maken.

**9.2 Belangrijk** — De datum/terugblik is belangrijker dan de historische
koers. Dus niet "€742,50 · 12 oktober" maar "3 MAANDEN GELEDEN". De prijs mag
eventueel subtiel in het geopende moment verschijnen.

**9.3 MVP** — Alleen eenvoudige tijdsgebaseerde herinneringen (3 mnd / 6 mnd /
1 jaar). Geen complexe AI-selectie, geen "smart memories" — dat kan later.

---

## 10. PORTFOLIO

*Portfolio* — *+ Bedrijf toevoegen*

Compacte lijst, bijvoorbeeld:

> **ASML** — ASML Holding · Euronext Amsterdam
> Laatste toevoeging — 12 oktober · *"Ik denk dat..."*
> ▪ ▪ ▪ ▪ ▪ ▫ ▪ ▪

---

## 11. COMPANY LIST ITEM

Compacte row, geen gigantische card:

[logo] **ASML** — ASML Holding · Euronext Amsterdam
Laatste toevoeging · 12 okt — *"Ik denk dat de markt..."*
▪ ▪ ▪ ▫ ▪ ▪

Logo klein houden. Company name is het belangrijkste, ticker/exchange is
secundaire context.

---

## 12. ATTENTION HEATMAP

Kleine reeks blokjes per bedrijf, tonen aandacht/herinneringen door de tijd.
Gevuld = een moment vastgelegd in die periode, leeg = geen moment.

Dit is GEEN score, GEEN performance-indicator, GEEN conviction-score. Noem het
intern eventueel "memory activity", maar presenteer het niet als analytics.
De gebruiker moet intuïtief begrijpen: *"Hier heb ik veel/weinig over
nagedacht."*

---

## 13. GEEN APARTE ANALYTICS

Op de homepage NIET tonen: rendement, winst/verlies, portefeuillewaarde,
procentuele performance, Sharpe ratio, beta, volatility, P/E, RSI, technische
analyse, koersdoelen, ranking, "beste investering", conviction leaderboard.

---

## 14. WATCHLIST

Zelfde principe als Portfolio. *Watchlist* — *+ Voeg toe*. Portfolio en
Watchlist moeten visueel duidelijk dezelfde familie zijn — het verschil zit in
de status, niet in een compleet ander design.

---

## 15. COMPANY TOEVOEGEN

Bij klikken op "Bedrijf toevoegen": simpele zoekinterface (bedrijf + beurs om
tickerambiguïteit te voorkomen). Na selectie: kies Portfolio of Watchlist, en
optioneel — niet verplicht — een korte these ("Waarom wil je dit bedrijf
volgen?").

---

## 16. WATCHLIST → PORTFOLIO

Een bedrijf mag later van Watchlist naar Portfolio. Dit mag GEEN nieuw bedrijf
creëren — hetzelfde dossier en dezelfde timeline blijven bestaan, alleen de
status verandert. Belangrijk voor het concept van één doorlopende
beleggingsreis.

---

## 17. FLOATING ACTION BUTTON

Rechtsonder, subtiel, niet gigantisch. Bij klikken: *Nieuwe toevoeging* —
[Notitie] [Bron]. Geen lange lijst met acties.

---

## 18. COMPANY PAGE

Route: `/companies/[id]`

Het belangrijkste scherm van de app. **De company page is één geïntegreerde
ervaring, in één doorlopende scroll — geen tabs, geen aparte "Koersverloop"-
pagina, geen aparte "Tijdlijn"-pagina, en ook geen tab-switcher tussen deze
twee bovenaan het scherm.** De koersgrafiek en de eigen momenten vormen samen
één continue sectie op dezelfde pagina.

Hiërarchie: Header → Jouw these → Koersverloop + Mijn momenten (één sectie) → Floating +

Dit is bewust. De gebruiker wordt eerst herinnerd aan zijn/haar oorspronkelijke
overtuiging. Daarna ziet de gebruiker wat de markt deed. Daarna ziet de
gebruiker wat hij/zij onderweg dacht. Dit is het gedragsmatige hart van de app.

---

## 19. COMPANY HEADER

← [logo] **ASML** — ASML Holding · Euronext Amsterdam

**Overtuiging** — Hoog ● ● ● ● ○ ✎

De conviction moet zichtbaar zijn (Laag / Gemiddeld / Hoog, intern eventueel
numeriek 1–5). De interface moet niet voelen als een gamified score.

---

## 20. CURRENT PRICE

*(Bijgewerkt: koers blijft zichtbaar, maar minimaal.)*

Toon de actuele koers **klein en rustig** in de company header — bijvoorbeeld
gewoon het bedrag, in een neutrale kleur, zonder nadruk.

**Toon GEEN stijging/daling-indicator en GEEN procentuele verandering** (dus
geen "+1,48%", geen groene/rode pijl, geen kleurcodering op basis van
performance). Reden: dat trekt aandacht, maakt de app trading-achtiger, en
nodigt uit tot vergelijken/reageren — precies wat de app wil vermijden.

De relevante historische prijs (het "market context"-moment) staat bij de
eigen momenten in de tijdlijn, zoals in hoofdstuk 33 beschreven.

---

## 21. CONVICTION EDIT

Naast conviction: ✎. Bij klikken kan de gebruiker de conviction aanpassen:

> Overtuiging aanpassen — ○ Laag ○ Gemiddeld ● Hoog
> Waarom verandert je overtuiging? [......]
> Opslaan

De verandering wordt automatisch als timeline-event opgeslagen, bijvoorbeeld:

> 12 OKTOBER — Overtuiging verhoogd — Gemiddeld → Hoog
> *"De nieuwe cijfers bevestigen mijn these."*

De conviction change is daarmee onderdeel van de beleggingsgeschiedenis.

---

## 22. THESIS

Direct onder header:

> **JOUW THESE**
> Waarom dit, waarom nu?
> *"ASML heeft volgens mij een sterke structurele positie door EUV en de
> toenemende vraag naar AI-chips."*
>
> Wat zou bewijzen dat je ongelijk hebt?
> *"Als de vraag structureel afneemt of concurrenten een technologische
> doorbraak realiseren."*

Compact, geen gigantische card. De thesis moet altijd zichtbaar zijn, ook als
hij leeg is.

---

## 23. LEGE THESIS

> **JOUW THESE** — Waarom dit, waarom nu?
> Nog geen these toegevoegd. Wat maakt dit bedrijf interessant voor jou?
> + These toevoegen
>
> Wat zou bewijzen dat je ongelijk hebt? — Nog niet ingevuld.

Niet verbergen — de leegte moet zichtbaar blijven, maar wel uitnodigen om hem
in te vullen.

---

## 24. THESIS IS GEEN TIMELINE EVENT

De thesis is persistent, niet "12 oktober — Thesis toegevoegd". De huidige
thesis staat bovenaan. Thesis-history is geen MVP-onderdeel (zie hoofdstuk 2).

---

## 25. KOERSVERLOOP

Sectietitel: **Koersverloop**. Subtekst: *"Jouw momenten staan op de
koerslijn."* — de belangrijkste conceptuele uitleg van de grafiek.

---

## 26. GRAFIEK

Gebruik historische marktdata uit een API. De grafiek toont de historische
koerslijn plus de momenten waarop de gebruiker een eigen notitie/memory heeft
opgeslagen. Compact: op mobiel ongeveer 180–240 px hoog, niet groter. Het mag
niet voelen als TradingView.

---

## 27. GRAFIEK VISUEEL

De koerslijn: licht, rustig, dun. De eigen momenten: blauw, klein,
interactief. Een geselecteerd moment: wordt groter, krijgt duidelijkere blauwe
nadruk, eventueel subtiele halo.

---

## 28. BELANGRIJK CONCEPT

De gebruiker moet direct begrijpen: *de lijn = wat de markt deed, de punten =
wat ik dacht.* Niet: de punten = koop/verkoop-signalen. Geen pijlen
omhoog/omlaag, geen buy/sell badges, geen winstlabels, geen groene/rode punten
afhankelijk van performance. Alle eigen momenten krijgen dezelfde visuele
behandeling — dit voorkomt hindsight bias.

---

## 29. RANGE SELECTOR

Eventueel: 1J · 3J · 5J · Alles, als subtiele segmented control. Default een
bereik dat voldoende context geeft voor de beschikbare momenten; pas dit
logisch aan als een company pas kort gevolgd wordt.

---

## 30. GEEN TECHNISCHE ANALYSE

Geen candlesticks, volume, RSI, moving averages, MACD, Bollinger Bands,
technische indicatoren, koersdoelen, resistance/support, buy/sell signals.
Dit is een geheugencontext, geen trading chart.

---

## 31. MIJN MOMENTEN

Onder de grafiek — in dezelfde doorlopende sectie, niet als apart scherm of
tab: **Mijn momenten**. Bewust niet "Tijdlijn" genoemd, want de hele
company page is al een tijdlijn; "Mijn momenten" benadrukt dat het om de eigen
gedachten gaat.

---

## 32. TIMELINE

Verticale timeline, meest recente moment bovenaan. Bijvoorbeeld:

> ● 12 OKTOBER 2026 — €742,50
> Ik denk dat de markt de impact van AI op ASML onderschat.
> *Notitie*
>
> ● 4 SEPTEMBER 2026 — €711,20
> De nieuwe cijfers veranderen mijn beeld niet.
> *Notitie*
>
> ● 18 AUGUSTUS 2026 — €685,10
> Overtuiging verhoogd — Gemiddeld → Hoog
> *"De fundamentele ontwikkeling bevestigt mijn these."*

---

## 33. TIMELINE ITEMS

Een standaard note toont: datum, opgeslagen historische koers, inhoud, type.
De koers moet duidelijk gelabeld worden als historische context — bijvoorbeeld
*"Koers op dat moment"* of *"Marktcontext"*, nooit *"Huidige koers"*.

---

## 34. PRICE SNAPSHOT

Bij het opslaan van een note: fetch de actuele marktprijs, sla deze op
(`price_at_time = 742.50`), en die waarde verandert daarna nooit. De gebruiker
moet later exact kunnen zien welke koers gold toen de gedachte werd
opgeschreven — de prijs mag niet later opnieuw worden berekend.

---

## 35. NOTE TOEVOEGEN

Via floating "+": *Nieuwe toevoeging* — [Notitie] [Bron]. Bij Notitie:

> **ASML** — Wat denk je nu?
> [Schrijf op wat er door je hoofd gaat...]
> Je koers wordt automatisch opgeslagen als marktcontext.
> Opslaan

Geen verplicht formulier met tien vragen, geen sentiment dropdown, geen
verplichte "Waarom? / Wat betekent dit? / Wat verwacht je? / Wat is je
target?"-velden. Vrije tekst is de kern.

---

## 36. AUTOMATISCH BIJ EEN NOTITIE

Automatisch vastleggen: company_id, user_id, timestamp, price_at_time, note
content, type = "note". Deze gegevens hoeven niet allemaal zichtbaar te zijn
in het formulier.

---

## 37. BRON TOEVOEGEN

> **Bron toevoegen**
> URL [......]
> Titel [......]
> Wat betekent dit voor jou? (optioneel) [......]
> Opslaan

Een bron is ondersteunend — de eigen gedachte blijft belangrijker. Een bron
moet visueel duidelijk onderscheiden worden van een eigen notitie.

---

## 38. BRONNEN NIET OP DE KOERSGRAFIEK

Een externe bron wordt NIET automatisch als punt op de koerslijn gezet. De
grafiek draait om *"wat dacht ik toen de koers daar stond?"* — een artikel is
geen automatisch persoonlijk denk-moment. Alleen eigen notities en relevante
conviction changes komen als interactieve punten op de koerslijn.

---

## 39. GRAFIEK ↔ TIMELINE INTERACTIE

Zeer belangrijke interactie. Wanneer de gebruiker een punt op de grafiek
aantikt: het punt wordt groter en duidelijk blauw, de bijbehorende timeline-
entry wordt geselecteerd, de timeline scrollt eventueel naar dat moment, en de
note krijgt visuele nadruk. De gebruiker voelt: *"Dit was mijn gedachte op dit
moment in de koers."*

---

## 40. TIMELINE → GRAFIEK

Werkt ook andersom: bij het scrollen door de timeline wordt het actieve item
gemarkeerd, het corresponderende chart point wordt gemarkeerd en groter, en
eventueel wordt de grafiek subtiel naar het punt gebracht. Hierdoor ontstaat
een gevoel van *door je eigen beleggingsgeschiedenis lopen.*

---

## 41. SCROLL EXPERIENCE

De pagina moet niet aanvoelen als losse onderdelen. De flow:
Jouw these → Wat deed de markt? → Wat dacht ik toen? → Wat dacht ik daarna? →
Hoe veranderde mijn overtuiging? Dat is de kernervaring — vandaar dat dit één
doorlopende scroll is, niet meerdere tabs of pagina's (zie ook hoofdstuk 18).

---

## 42. GEDRAGSONTWERP

Het scherm moet de gebruiker subtiel vertragen — niet blokkeren, niet
moralistisch, wel uitnodigen tot reflectie. Taalgebruik moet menselijk zijn:
"Wat denk je nu?" i.p.v. "Voer je analyse in"; "Jouw momenten staan op de
koerslijn" i.p.v. "Historische transactiemomenten"; "Wat zou bewijzen dat je
ongelijk hebt?" i.p.v. "Risicofactoren".

---

## 43. BELANGRIJKE GEDRAGSPRINCIPES

**Geen dopamine-dashboard** — geen streaks, badges, scores, rankings,
achievements, groene "winning"-indicators, confetti, gamification.

**Geen FOMO** — geen "ASML stijgt vandaag 5%", "Je moet nu opletten",
"Koopkans", "Trending", "Breaking", "Alert". De app moet juist rust creëren.

**Geen hindsight bias** — toon alle eigen momenten gelijkwaardig. Een gedachte
die achteraf fout bleek, moet niet visueel slechter behandeld worden. Dat
maakt de geschiedenis waardevoller.

---

## 44. EMPTY STATES

> **Portfolio leeg** — Nog geen bedrijven. Begin met een bedrijf waar je een
> overtuiging over hebt. + Bedrijf toevoegen

> **Watchlist leeg** — Je watchlist is nog leeg. Bewaar bedrijven waar je
> later verder over wilt nadenken. + Voeg toe aan watchlist

> **Geen momenten** — Nog geen moment vastgelegd voor dit bedrijf.

---

## CHANGELOG t.o.v. de vorige versie

1. **§20 Current price** — koers blijft zichtbaar in de header, maar nu
   expliciet klein/rustig en zonder %-verandering of stijging/daling-pijl
   (was eerder inconsistent: tekst zei "niet tonen", een eerder visueel
   concept toonde 'm juist groot mét groene pijl).
2. **§18 en §41** — expliciet vastgelegd dat Koersverloop en Mijn momenten
   in één doorlopende scroll staan, zonder tab-navigatie ertussen (een eerder
   visueel concept toonde per ongeluk een "Tijdlijn / Koersverloop"-tab-
   switcher).
3. **Nieuw §2 (MVP-scope)** — de koop/verkoop-reflectiemoment ("check"-flow)
   is expliciet uit de MVP-scope gehaald.