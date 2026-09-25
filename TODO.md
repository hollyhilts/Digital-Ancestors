# To do

- [ ] **Analytics** — choose a tool and add page-view tracking; gate it on cookie consent.
- [ ] **First-visit pop-up (cookies)** — show a cookie/consent notice the first time someone visits the site, and remember their choice.
- [ ] **Quiz logic**
  - [x] Audit the old quiz and rebalance it (results were ~37/37/15/11%, now ~23/27/27/23%).
  - [x] New quiz map replaces the old one: answers steer a line across a dotted map, and the quadrants and a "you are here" dot are revealed at the end.
  - [x] Settings in `src/config/site.ts` (question counts, optional questions).
  - [ ] Try it on a real desktop and phone; tune spacing (`PLOT_UNIT` in `src/hooks/useQuizTrail.ts`) and colours (top of the "Quiz map" block in `src/global.css`).
  - [ ] Decide on the 2 optional extra questions (`includeOptionalQuestions`).
  - [ ] Delete the old fixed-tree map code once you're happy (`MapSection`, `usePathwayMap`, `ConnectionLayer`, `connectionAnchors`, `MapViewport`, `MapControls`, `layoutPathwayNodes`). `quizNodes.json` is still used for the result cards.
  - [ ] Save each finished quiz anonymously (needs a small server function + database).
  - [ ] "See where participants landed" map, with a setting to turn it on/off and a minimum number of results before it shows.
