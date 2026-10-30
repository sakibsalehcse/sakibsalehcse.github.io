# S. M. Sakib Saleh — Robotics & Programming Portfolio

A programming-led static portfolio with an animated code study and conceptual software workflow, a two-joint robotic-arm diagram in the projects section, full-viewport circuit animation, dark/graphite themes, three CV-sourced projects, skills, education, work history and a portrait extracted from the supplied CV.

## Run
Extract the ZIP and open index.html. Keep the assets folder beside it. No install or build is needed. For a local web server, run `python -m http.server 8000` inside this folder, then open http://localhost:8000.

## GitHub Pages
Upload the CONTENTS of this folder (index.html, assets, licenses and .nojekyll) at the repository root. Choose Settings > Pages > Deploy from a branch > main > /(root). Do not upload just the ZIP or nest index.html inside an extra folder.

## Source map
- index.html: profile, project descriptions, skills, education, work experience and contact links.
- assets/css/style.css: fonts, both palettes and responsive layout.
- assets/js/theme-init.js: restores the saved browser theme before display.
- assets/js/main.js: menu, theme, canvas circuits, two-link inverse kinematics, pause and reduced-motion handling.
- assets/images/sakib-saleh.png: unchanged portrait extracted from the user's CV (256 × 256, source resolution).
- assets/fonts: local font assets; no Google Fonts request is needed.
- licenses: font license texts.

## Content provenance
Professional facts were taken from sakibsaleh_cv (5).pdf. LinkedIn recent activity could not be retrieved; only the supplied profile URL is linked. The CV lists three projects, a 6th-place Rescue Robot Competition result at TechHunt 2017, and two online certificates. No project screenshots, repositories, metrics, client names or unverified outcomes were invented. The robotic-arm diagram is an illustrative mathematical motion study, not a depiction of a documented Sakib project. Work dates reproduce the supplied CV and should be confirmed before publishing. The personal street address, phone numbers and references' contact details were not included. The original CV is not bundled for public download.

## Editing
Change content and contact links in index.html. Set colors under :root and [data-theme=light] in style.css. Motion speeds and arm geometry are in main.js; keep the reachable target within the sum of both arm lengths. The project cards currently have no demo links because none were provided.

## Validation
JavaScript syntax, local asset references, image availability, unique IDs and anchor targets were checked. A mocked runtime checked theme, menu, pause, circuit canvas and arm coordinates. Actual browser visual/performance QA was not available in this environment; review both themes at desktop and mobile sizes before publishing.

## Assets
Cormorant Garamond and DM Sans are under the SIL Open Font License (licenses/). Portrait supplied in the user's CV. No general license is asserted over the subject's identity or portrait.

## Revised information hierarchy
The hero emphasizes programming, operational experience and the stated DevOps career goal. Experience and education come before skills and robotics projects. Graphite replaces paper mode, with stronger canvas contrast. The code study and Code/Test/Release/Observe animation are conceptual illustrations, not evidence of deployed CI/CD experience. Docker, Kubernetes, cloud platforms and other unlisted tools are not claimed.

## Sky bar (added)
The Sky page (sky.html) shows a live bar: Sylhet clock with seconds, English and Bangla dates, today's sunset or sunrise, the moon phase and the Bangla season. The "Sky details" button (or the Sky link in the menu) opens a panel with a sun and moon arc, a light-of-the-day bar, a place picker for eight Bangladesh cities, an alarm, and Sun, Moon and Season cards with Bangla labels.
- assets/css/sky.css: styling; it uses the site's theme variables, so Dark, Graphite and Neon all work.
- assets/js/sky.js: all calculations and rendering. Sun and moon positions are computed in the browser with no outside service, so it works offline.
- The hero greeting ("GOOD EVENING, I'M") follows the visitor's own local time. The clock shows Bangladesh time.
- The panel remembers its open or closed state, the chosen place and the alarms in the visitor's own browser (localStorage). Nothing is sent to a server.
- Alarms can only ring while the page is open.

## Pages (v6)
Home is now focused on the profile: hero, about, experience and education, skills, next direction and contact. Three areas moved to their own pages, kept together in the pages/ folder (like tools/), all linked from the header on every page:
- index.html: home.
- pages/projects.html: robotics and automation (motion study, three projects). Uses main.js only.
- pages/tools.html: the workbench hub with six tools.
- pages/sky.html: live clock, sun, moon, season, weather look and alarm. Loads sky.css and sky.js; the details panel opens by default here.
- tools/*.html: the individual tools. Their top bar links back to the tools hub and to each other.

## Black & white theme
A white page with black text. The round theme button in the header now cycles Dark, Graphite, Neon, then Black & white, and remembers the choice (localStorage key sakib-theme) on every page, including each tool.
- Site pages: palette under [data-theme=mono] at the end of assets/css/style.css, plus a grayscale filter on the html element so hard-coded colours (3D globe, portrait, sky art) also turn monochrome.
- Tools: :root[data-pf=mono] in tools/tools.css, same idea.
- Canvas circuit colours for this mode are in drawCircuits() in main.js.

## MikroTik Troubleshooting Desk
tools/mikrotik-troubleshooting-desk.html is a standalone command reference (130 commands, Bengali explanations, copy buttons, playbooks, export). It uses tools/tools.css and the --pf-* variables, so it follows all four themes. Its old separate Theme button was removed; use the site's theme button instead. To add a command, append a row to the data array near the top of its script.

## Additions (v8)
- assets/js/prayer.js: a Prayer times card on the Sky page (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha), a live "next prayer" countdown that follows the place picker, and a Ramadan / Eid al-Fitr countdown. Fajr and Isha at 18 degrees with Hanafi Asr (the setting commonly used in Bangladesh), calculated in the browser from each city's own coordinates. Local mosque timetables can differ by a few minutes; Ramadan and Eid follow moon sighting.
- assets/js/palette.js: a quick-jump menu. Press Ctrl+K (Cmd+K on Mac) or "/" on any main page, or use the "Quick jump" button. Edit the ITEMS list at the top of the file to add or rename entries.
- The Sky page header now shows the Arabic weekday and Hijri date with English month names, and the Season card shows progress, flower, taste and feel.
- assets/js/qibla-calendar.js: a Qibla compass (bearing and distance to the Kaaba from the chosen city) and a Hijri month calendar with Bangladesh-relevant dates (Shab-e-Barat, Shab-e-Qadr, Eid, and others). Use the arrows to browse months. The calendar is the tabular one; moon sighting can move a date by a day.
- Qibla card: a "Use phone compass" button turns the dial with the phone's compass sensor and tells you when you face the Qibla (phones only, https, motion access allowed).
- assets/js/moon-day.js: a Moon phases month calendar (phase icon, percent lit, and the times of New, First quarter, Full and Last quarter moon) and a Daylight chart for the chosen city (day length through the year, sunrise and sunset, change per day, next longest or shortest day). It reuses the moon maths exposed by sky.js as window.SkyAstro.

## Neon blue upgrade (v9)
- Dark and Black & white themes now carry neon blue: gradient accent words, glowing cards and buttons, a neon header hairline, a faint blueprint grid, portrait corner brackets, blue circuit lines and a blue-tinted white theme. The block is at the end of assets/css/style.css, marked "NEON BLUE UPGRADE". Delete it to go back.
- The Black & white theme no longer applies a grayscale filter, so its blue accents show. The circuit line colours are set in drawCircuits() in assets/js/main.js.
- Heading font: replace the two "Editorial" @font-face lines at the top of style.css with new font files (keep the family name Editorial). Open font-preview.html to compare options.
