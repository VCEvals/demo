/* Google Maps for the MedRoute dispatch board (sample routes, simulation data). */
(function () {
  const cfg = window.MEDROUTE_CONFIG || {};
  const key = (cfg.googleMapsApiKey || '').trim();
  const holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;inset:0';

  // Keep the map alive across screen re-renders: move the same element into the new slot.
  const prev = window.dcAfterRender;
  window.dcAfterRender = function (root) {
    if (prev) prev(root);
    const slot = root.querySelector('#gmap-slot');
    if (slot && holder.parentNode !== slot) slot.appendChild(holder);
  };

  const ROUTES = [
    { name: 'Rte 03 · Alvarez, M. · Specimen (Cat B)', color: '#1A5A96', dashed: false,
      path: [[37.6510, -77.6110], [37.6006, -77.5600], [37.5800, -77.5000], [37.5385, -77.4300]], vehicleAt: 2, unit: 'Van 3' },
    { name: 'Rte 07 · Nguyen, T. · Regulated medical waste', color: '#8A4B00', dashed: true,
      path: [[37.4180, -77.6400], [37.5060, -77.6490], [37.5240, -77.5580], [37.5000, -77.3500]], vehicleAt: 2, unit: 'Truck 7' },
    { name: 'Rte 02 · Kim, S. · General', color: '#5A6878', dashed: false,
      path: [[37.6090, -77.3730], [37.5460, -77.3280], [37.5300, -77.4180]], vehicleAt: 1, unit: 'Car 2' }
  ];
  const LAB = { pos: [37.5385, -77.4300], label: 'James River Reference Lab (sample)' };
  const FACILITY = { pos: [37.5000, -77.3500], label: 'RMW treatment facility (sample)' };
  const STAT = { pos: [37.6006, -77.5600], label: 'STAT pickup · Westpark Family Medicine (sample)' };

  if (!key) {
    const f = document.createElement('iframe');
    f.title = 'Map of the Richmond, Virginia service area';
    f.src = 'https://maps.google.com/maps?q=Richmond%2C%20VA&z=10&output=embed';
    f.style.cssText = 'border:0;width:100%;height:100%';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    const note = document.createElement('div');
    note.textContent = 'Add a Google Maps API key in config.js to show live routes and vehicles.';
    note.style.cssText = 'position:absolute;left:8px;top:8px;background:#FFF4DC;border:1px solid #E0B45C;color:#5C3300;font:600 12px "Source Sans 3",Arial,sans-serif;padding:4px 8px';
    holder.appendChild(f);
    holder.appendChild(note);
    return;
  }

  window.initMedrouteMap = function () {
    const g = google.maps;
    const ll = p => ({ lat: p[0], lng: p[1] });
    const map = new g.Map(holder, {
      center: { lat: 37.54, lng: -77.48 }, zoom: 10, mapTypeControl: false, streetViewControl: false,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }]
    });
    const info = new g.InfoWindow();
    const marker = (pos, label, fill, shape, text) => {
      const m = new g.Marker({
        map, position: ll(pos), title: label,
        icon: { path: shape, fillColor: fill, fillOpacity: 1, strokeColor: '#FFFFFF', strokeWeight: 2, scale: shape === g.SymbolPath.CIRCLE ? 9 : 1, anchor: new g.Point(shape === g.SymbolPath.CIRCLE ? 0 : 8, shape === g.SymbolPath.CIRCLE ? 0 : 8) },
        label: text ? { text, color: '#FFFFFF', fontSize: '10px', fontWeight: '700' } : undefined
      });
      m.addListener('click', () => { info.setContent(label); info.open({ map, anchor: m }); });
      return m;
    };
    const SQUARE = 'M0 0 H16 V16 H0 Z';
    const lineOpts = r => r.dashed
      ? { strokeOpacity: 0, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: r.color, scale: 3 }, offset: '0', repeat: '14px' }] }
      : { strokeColor: r.color, strokeOpacity: 0.9, strokeWeight: 4 };
    const ds = new g.DirectionsService();

    ROUTES.forEach(r => {
      const pts = r.path.map(ll);
      const fallback = () => new g.Polyline(Object.assign({ map, path: pts }, lineOpts(r)));
      ds.route({
        origin: pts[0], destination: pts[pts.length - 1],
        waypoints: pts.slice(1, -1).map(p => ({ location: p, stopover: true })),
        travelMode: g.TravelMode.DRIVING
      }).then(res => {
        new g.DirectionsRenderer({ map, directions: res, suppressMarkers: true, preserveViewport: true, polylineOptions: lineOpts(r) });
      }).catch(fallback); // Directions API not enabled on the key: draw straight lines instead
      marker(r.path[r.vehicleAt], r.unit + ' · ' + r.name, r.color, SQUARE);
    });
    marker(LAB.pos, LAB.label, '#1B2430', SQUARE);
    marker(FACILITY.pos, FACILITY.label, '#8A4B00', SQUARE);
    marker(STAT.pos, STAT.label, '#A4161A', g.SymbolPath.CIRCLE, '!');
  };

  const s = document.createElement('script');
  s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&callback=initMedrouteMap&loading=async';
  s.async = true;
  document.head.appendChild(s);
})();
