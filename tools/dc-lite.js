/* dc-lite: tiny runtime that renders MedRoute screens as a static site.
   Supports {{ path }} holes, data-for / data-as / data-if, and on* event bindings. */
(function () {
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(p) {
      const patch = typeof p === 'function' ? p(this.state, this.props) : p;
      this.state = Object.assign({}, this.state, patch);
      if (this.__render) this.__render();
    }
    forceUpdate() { if (this.__render) this.__render(); }
  }
  window.DCLogic = DCLogic;

  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^'.*'$|^".*"$/.test(path)) return path.slice(1, -1);
    let cur = scope;
    for (const part of path.split('.')) {
      if (cur == null) return undefined;
      cur = cur[part];
    }
    return cur;
  }
  function interp(str, scope) {
    return str.replace(HOLE, (_, p) => { const v = lookup(p, scope); return v == null ? '' : String(v); });
  }

  function renderNode(node, scope, out) {
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(node.nodeValue.indexOf('{{') >= 0 ? interp(node.nodeValue, scope) : node.nodeValue));
      return;
    }
    if (node.nodeType !== 1) return;
    const forExpr = node.getAttribute('data-for');
    if (forExpr) {
      const list = lookup(forExpr, scope) || [];
      const as = node.getAttribute('data-as') || 'item';
      list.forEach((item, i) => {
        const s = Object.create(scope); s[as] = item; s.$index = i;
        renderEl(node, s, out, true);
      });
      return;
    }
    renderEl(node, scope, out, false);
  }

  function renderEl(node, scope, out, skipFor) {
    const ifExpr = node.getAttribute('data-if');
    if (ifExpr && !lookup(ifExpr, scope)) return;
    const el = document.createElement(node.tagName.toLowerCase());
    for (const a of Array.from(node.attributes)) {
      const name = a.name;
      if (name === 'data-for' || name === 'data-as' || name === 'data-if') continue;
      const v = a.value;
      if (name.startsWith('on')) {
        const m = v.match(WHOLE);
        if (m) {
          const fn = lookup(m[1], scope);
          if (typeof fn === 'function') el.addEventListener(name.slice(2), fn);
        }
        continue;
      }
      if (v.indexOf('{{') >= 0) {
        const m = v.match(WHOLE);
        const val = m ? lookup(m[1], scope) : interp(v, scope);
        if (val === false || val == null) { if (name.startsWith('aria-')) el.setAttribute(name, 'false'); continue; }
        el.setAttribute(name, val === true ? (name.startsWith('aria-') ? 'true' : '') : String(val));
      } else {
        el.setAttribute(name, v);
      }
    }
    const kids = node.tagName === 'TEMPLATE' ? node.content.childNodes : node.childNodes;
    for (const c of Array.from(kids)) renderNode(c, scope, el);
    out.appendChild(el);
  }

  function mount() {
    const tpl = document.getElementById('dc-template');
    const src = document.getElementById('dc-logic').textContent;
    const Component = new Function('DCLogic', src + '\nreturn Component;')(DCLogic);
    const root = document.getElementById('dc-root');
    const comp = new Component({});
    comp.__render = function () {
      const fields = Array.from(root.querySelectorAll('input,select,textarea')).map(f => f.value);
      const vals = comp.renderVals();
      const frag = document.createDocumentFragment();
      for (const c of Array.from(tpl.content.childNodes)) renderNode(c, vals, frag);
      root.replaceChildren(frag);
      const now = root.querySelectorAll('input,select,textarea');
      if (now.length === fields.length) {
        now.forEach((f, i) => {
          if (f.tagName === 'SELECT' && !Array.from(f.options).some(o => o.value === fields[i])) return;
          f.value = fields[i];
        });
      }
    };
    comp.__render();
    if (comp.componentDidMount) comp.componentDidMount();
  }
  if (document.getElementById('dc-logic')) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
