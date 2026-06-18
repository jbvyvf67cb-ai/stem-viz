# STEM Visualizations

Interactive, feature-rich visualizations for learning science & technology by
**changing things** — not by memorizing facts. The aim is for students to learn how
each system works well enough to tweak and optimize it.

**▶ Open `index.html`** for the landing page that links to every visualization.

## Live now

- **[Atomic Structure Builder](visualizations/atomic-structure/index.html)** —
  add/remove protons, neutrons, electrons and watch element identity, charge, mass
  number, isotope notation, and electron shells update live. Includes a challenge mode.

## Where this is going

See **[ROADMAP.md](ROADMAP.md)** for the full curriculum tree (atomic structure →
electron configuration → periodic table → bonding, then forking into stoichiometry
and qualitative solid-state physics) and the rationale for the parallel paths.

## Running locally

It's a static site with no build step. Open `index.html` directly, or serve the
folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Project layout

```
index.html                         landing page
ROADMAP.md                         curriculum design & build order
assets/css/main.css                shared styles
visualizations/<topic>/            one self-contained visualization per folder
```
</content>
