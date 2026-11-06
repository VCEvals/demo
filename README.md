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
| Client portal | `public/portal.html` |

## Deploy on Cloudflare Pages
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick this repository.
3. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: **`public`**.
4. **Save and Deploy**. Every push to `main` redeploys automatically.

## Rebuilding from the design files
The screens are designed in `source/*.dc.html`. To regenerate the static site:

```
python3 tools/build.py source public
```
