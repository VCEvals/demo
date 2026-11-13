# MedRoute — Medical Courier Dispatch & Compliance (Mockup)

Interactive mockup of an AI-assisted dispatch and compliance system for a Virginia medical courier
(Category B specimens and regulated medical waste).

**Simulation only:** all names, clients, readings and compliance statuses are sample data.

## Screens
| Page | File |
|---|---|
| Dispatch board | `public/index.html` |
| Compliance center (Virginia) | `public/compliance.html` |
| Driver handheld | `public/driver.html` |
| Client portal: pickups & tracking | `public/portal.html` |
| Client portal: documents | `public/portal-documents.html` |
| Client portal: standing schedule | `public/portal-schedule.html` |
| Client portal: billing | `public/portal-billing.html` |
| Reports (staff) | `public/reports.html` |

## Deploy on Cloudflare Pages
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick this repository.
3. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: **`public`**.
4. **Save and Deploy**. Every push to `main` redeploys automatically.

## Google Maps on the dispatch board
Without a key, the dispatch board shows a plain Google map of the Richmond area.
To show sample routes, vehicles, the lab and the STAT pickup on the map:

1. In Google Cloud Console, create a project and attach a billing account (Google requires one; light usage typically stays in the free tier).
2. Enable **Maps JavaScript API**. Optionally enable **Routes API** so routes follow real roads (otherwise they are drawn as straight lines). Older projects can use the legacy Directions API instead.
3. Create an API key and restrict it: **Application restrictions → Websites**, add `https://<your-project>.pages.dev/*`; **API restrictions** → the APIs above.
4. Paste the key into `public/config.js` and push. Cloudflare redeploys automatically.

## Rebuilding from the design files
The screens are designed in `source/*.dc.html`. To regenerate the static site:

```
python3 tools/build.py source public
```
