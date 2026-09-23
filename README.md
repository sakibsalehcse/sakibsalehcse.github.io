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
