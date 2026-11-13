/* Google Maps for MedRoute: the dispatch board and the driver app (sample data).
   The page picks a view with window.MEDROUTE_MAP_VIEW ('dispatch' by default, or 'driver'). */
(function () {
  const cfg = window.MEDROUTE_CONFIG || {};
  const key = (cfg.googleMapsApiKey || '').trim();
  const viewName = window.MEDROUTE_MAP_VIEW || 'dispatch';

  const VIEWS = {
    dispatch: {
      slot: '#gmap-slot',
      center: [37.54, -77.48], zoom: 10,
      embed: 'https://maps.google.com/maps?q=Richmond%2C%20VA&z=10&output=embed',
      embedTitle: 'Map of the Richmond, Virginia service area',
      routes: [
        { name: 'Rte 03 · Alvarez, M. · Specimen (Cat B)', color: '#1A5A96', dashed: false,
          path: [[37.6510, -77.6110], [37.6006, -77.5600], [37.5800, -77.5000], [37.5385, -77.4300]] },
        { name: 'Rte 07 · Nguyen, T. · Regulated medical waste', color: '#8A4B00', dashed: true,
          path: [[37.4180, -77.6400], [37.5060, -77.6490], [37.5240, -77.5580], [37.5000, -77.3500]] },
        { name: 'Rte 02 · Kim, S. · General', color: '#5A6878', dashed: false,
          path: [[37.6090, -77.3730], [37.5460, -77.3280], [37.5300, -77.4180]] }
      ],
      markers: [
        { pos: [37.5800, -77.5000], label: 'Van 3 · Rte 03 · Alvarez, M.', fill: '#1A5A96', shape: 'square' },
        { pos: [37.5240, -77.5580], label: 'Truck 7 · Rte 07 · Nguyen, T.', fill: '#8A4B00', shape: 'square' },
        { pos: [37.5460, -77.3280], label: 'Car 2 · Rte 02 · Kim, S.', fill: '#5A6878', shape: 'square' },
        { pos: [37.5385, -77.4300], label: 'James River Reference Lab (sample)', fill: '#1B2430', shape: 'square' },
        { pos: [37.5000, -77.3500], label: 'RMW treatment facility (sample)', fill: '#8A4B00', shape: 'square' },
        { pos: [37.6006, -77.5600], label: 'STAT pickup · Westpark Family Medicine (sample)', fill: '#A4161A', shape: 'circle', text: '!' }
      ]
    },
    driver: {
      slot: '#gmap-driver-slot',
      center: [37.565, -77.52], zoom: 11,
      embed: 'https://maps.google.com/maps?saddr=37.5950,-77.5350&daddr=37.6006,-77.5600+to:37.5385,-77.4300+to:37.5900,-77.4970+to:37.5240,-77.5580&output=embed',
      embedTitle: 'Driving route for route 3',
      routes: [
        { name: 'Rte 03 · remaining stops', color: '#1A5A96', dashed: false,
          path: [[37.5950, -77.5350], [37.6006, -77.5600], [37.5385, -77.4300], [37.5900, -77.4970], [37.5240, -77.5580]] }
      ],
      markers: [
        { pos: [37.5950, -77.5350], label: 'You · Van 3', fill: '#1B2430', shape: 'square' },
        { pos: [37.6006, -77.5600], label: 'Stop 7 · Westpark Family Medicine · STAT pickup', fill: '#A4161A', shape: 'circle', text: '7' },
        { pos: [37.5385, -77.4300], label: 'Stop 8 · James River Reference Lab · drop off', fill: '#1A5A96', shape: 'circle', text: '8' },
        { pos: [37.5900, -77.4970], label: 'Stop 9 · Henrico Urgent Care · pickup', fill: '#1A5A96', shape: 'circle', text: '9' },
        { pos: [37.5240, -77.5580], label: 'Stop 10 · Bon Air Dialysis Center · pickup', fill: '#1A5A96', shape: 'circle', text: '10' }
      ]
    }
  };
  const view = VIEWS[viewName] || VIEWS.dispatch;

  const holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;inset:0';

  // Keep the map alive across screen re-renders: move the same element into the new slot.
  const prev = window.dcAfterRender;
  window.dcAfterRender = function (root) {
    if (prev) prev(root);
    const slot = root.querySelector(view.slot);
    if (slot && holder.parentNode !== slot) slot.appendChild(holder);
  };

  // Plain Google map (no key needed). Also used when Google rejects the key.
  function showEmbed(message) {
    holder.replaceChildren();
    const f = document.createElement('iframe');
    f.title = view.embedTitle;
    f.src = view.embed;
    f.style.cssText = 'border:0;width:100%;height:100%';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    holder.appendChild(f);
    if (message) {
      const note = document.createElement('div');
      note.textContent = message;
      note.style.cssText = 'position:absolute;left:8px;right:8px;top:8px;width:fit-content;max-width:calc(100% - 16px);background:#FFF4DC;border:1px solid #E0B45C;color:#5C3300;font:600 12px "Source Sans 3",Arial,sans-serif;padding:4px 8px';
      holder.appendChild(note);
    }
  }

  if (!key) {
    showEmbed(viewName === 'dispatch' ? 'Add a Google Maps API key in config.js to show live routes and vehicles.' : '');
    return;
  }

  // Google calls this when it rejects the key (wrong website restriction, API off, no billing...).
  window.gm_authFailure = function () {
    console.warn('MedRoute map: Google rejected the API key. See the Google Maps error above for the reason.');
    showEmbed('Live map unavailable (API key problem). Showing basic map.');
  };

  window.initMedrouteMap = function () {
    const g = google.maps;
    const ll = p => ({ lat: p[0], lng: p[1] });
    const mapDiv = document.createElement('div');
    mapDiv.style.cssText = 'position:absolute;inset:0';
    holder.replaceChildren(mapDiv);
    const map = new g.Map(mapDiv, {
      center: ll(view.center), zoom: view.zoom, mapTypeControl: false, streetViewControl: false,
      fullscreenControl: viewName !== 'driver',
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }]
    });
    const info = new g.InfoWindow();
    const SQUARE = 'M0 0 H16 V16 H0 Z';
    view.markers.forEach(mk => {
      const circle = mk.shape === 'circle';
      const m = new g.Marker({
        map, position: ll(mk.pos), title: mk.label,
        icon: { path: circle ? g.SymbolPath.CIRCLE : SQUARE, fillColor: mk.fill, fillOpacity: 1, strokeColor: '#FFFFFF', strokeWeight: 2, scale: circle ? 11 : 1, anchor: circle ? new g.Point(0, 0) : new g.Point(8, 8) },
        label: mk.text ? { text: mk.text, color: '#FFFFFF', fontSize: '11px', fontWeight: '700' } : undefined
      });
      m.addListener('click', () => { info.setContent(mk.label); info.open({ map, anchor: m }); });
    });

    const lineOpts = r => r.dashed
      ? { strokeOpacity: 0, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: r.color, scale: 3 }, offset: '0', repeat: '14px' }] }
      : { strokeColor: r.color, strokeOpacity: 0.9, strokeWeight: viewName === 'driver' ? 5 : 4 };
    const num = v => (typeof v === 'function' ? v() : v);
    const toLL = p => ({ lat: num(p.lat), lng: num(p.lng) });

    // Road-following path: Routes API first (new projects), then the legacy
    // Directions service (older projects), else straight lines between stops.
    async function roadPath(pts) {
      try {
        const { Route } = await g.importLibrary('routes');
        const base = { origin: pts[0], destination: pts[pts.length - 1], travelMode: 'DRIVING', fields: ['path'] };
        const mids = pts.slice(1, -1);
        let res;
        try { res = await Route.computeRoutes(Object.assign({ intermediates: mids }, base)); }
        catch (e) { res = await Route.computeRoutes(Object.assign({ intermediates: mids.map(p => ({ location: p })) }, base)); }
        const path = res && res.routes && res.routes[0] && res.routes[0].path;
        if (path && path.length) return path.map(toLL);
      } catch (e) { console.info('MedRoute map: Routes API unavailable', e && e.message); }
      try {
        const res = await new g.DirectionsService().route({
          origin: pts[0], destination: pts[pts.length - 1],
          waypoints: pts.slice(1, -1).map(p => ({ location: p, stopover: true })),
          travelMode: g.TravelMode.DRIVING
        });
        return res.routes[0].overview_path.map(toLL);
      } catch (e) { console.info('MedRoute map: Directions API unavailable, drawing straight lines'); }
      return pts;
    }

    view.routes.forEach(r => {
      roadPath(r.path.map(ll)).then(path => new g.Polyline(Object.assign({ map, path }, lineOpts(r))));
    });
    if (viewName === 'driver') {
      const b = new g.LatLngBounds();
      view.markers.forEach(mk => b.extend(ll(mk.pos)));
      map.fitBounds(b, 32);
    }
  };

  const s = document.createElement('script');
  s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&callback=initMedrouteMap&loading=async';
  s.async = true;
  document.head.appendChild(s);
})();
