# King County Youth Soccer Equity Lab

Static research prototype for GitHub Pages.

This project now uses real data for King County census tracts and soccer facilities.

## What this app does

- Displays all King County census tracts (real geometry)
- Colors tracts by SES, facility access, or children-per-pitch pressure
- Plots SES vs access relationship on a scatter chart
- Shows real OSM soccer facilities as overlay

## Run locally

Because browsers block `fetch()` from local `file://` origin, use a simple local server:

```bash
cd soccer
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Refresh real data

Run:

```bash
node scripts/update_real_data.mjs
```

The script rebuilds:

- `data/tracts.geojson` (King County tract geometry + computed indicators)
- `data/facilities.geojson` (soccer facilities from OSM Overpass)

## Publish with GitHub Pages

1. Push this folder to a GitHub repository.
2. In repo settings, open Pages.
3. Set source to `Deploy from a branch`.
4. Choose branch `main` and folder `/ (root)`.
5. Save; GitHub will provide a public URL.

## Data sources

- Census Reporter (ACS 2023 5-year + tract geometry)
- OpenStreetMap Overpass (soccer pitch facilities)

## Computed fields in `data/tracts.geojson`

- `ses_index`: composite index from median income and poverty rate
- `access_index`: composite index from facility supply and nearest-facility distance
- `kids_per_pitch`: children age 5-17 per in-tract soccer facility
- `median_income`, `poverty_rate`, `kids_5_17`, `facility_count`, `nearest_facility_km`
