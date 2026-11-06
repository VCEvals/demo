"""Convert MedRoute .dc.html artboards into a standalone static site.

usage: python3 build.py <project_dir> <out_dir>
"""
import re, sys, shutil, pathlib

src_dir = pathlib.Path(sys.argv[1])
out_dir = pathlib.Path(sys.argv[2])
here = pathlib.Path(__file__).parent
out_dir.mkdir(parents=True, exist_ok=True)

PAGES = {
    "Main.dc.html": "index.html",
    "Compliance.dc.html": "compliance.html",
    "DriverApp.dc.html": "driver.html",
    "Portal.dc.html": "portal.html",
}

EXTRA_CSS = {
    "driver.html": "body{margin:0;min-height:100vh;display:flex;justify-content:center;align-items:flex-start;padding:24px 0;background:#C9D1DA}"
                   "#dc-root>div{box-shadow:0 2px 12px rgba(0,0,0,.18)}",
}

def unwrap(tag, attr_map, html):
    """Turn <tag a="{{ x }}" ...>ONE_CHILD</tag> into ONE_CHILD with data-* attributes."""
    pat = re.compile(r"<%s\b([^>]*)>\s*(<([a-zA-Z0-9-]+)\b)" % tag)
    while True:
        m = pat.search(html)
        if not m:
            return html
        attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        extra = ""
        for k, dk in attr_map.items():
            if k in attrs:
                v = attrs[k].strip()
                v = re.sub(r"^\{\{\s*|\s*\}\}$", "", v)
                extra += ' %s="%s"' % (dk, v)
        # find matching close for this wrapper (wrappers here never nest the same tag)
        close = html.find("</%s>" % tag, m.end())
        inner = html[m.start(2):close].rstrip()
        child_tag = m.group(3)
        inner = re.sub(r"^<%s\b" % child_tag, "<%s%s" % (child_tag, extra), inner, count=1)
        html = html[:m.start()] + inner + html[close + len("</%s>" % tag):]

for src_name, out_name in PAGES.items():
    s = (src_dir / src_name).read_text()
    title = re.search(r"<title>(.*?)</title>", s, re.S).group(1)
    body = re.search(r"<x-dc>(.*)</x-dc>", s, re.S).group(1)
    helmet = re.search(r"<helmet>(.*?)</helmet>", body, re.S)
    head_extra = helmet.group(1) if helmet else ""
    body = re.sub(r"<helmet>.*?</helmet>", "", body, flags=re.S)
    body = unwrap("sc-for", {"list": "data-for", "as": "data-as"}, body)
    body = unwrap("sc-if", {"value": "data-if"}, body)
    for a, b in PAGES.items():
        body = body.replace('href="%s"' % a, 'href="%s"' % b)
    scripts = '<script src="dc-lite.js"></script>'
    if out_name == "index.html":
        # Live Google map replaces the drawn illustration on the website.
        body, n = re.subn(r'<svg width="100%" height="220".*?</svg>', '<div id="gmap-slot" style="position: absolute; inset: 0"></div>', body, flags=re.S)
        assert n == 1, "route map svg not found"
        body = body.replace('position: relative; height: 220px; background: #F2F4F6', 'position: relative; height: 380px; background: #F2F4F6', 1)
        body = body.replace('position: absolute; right: 8px; bottom: 8px;', 'position: absolute; z-index: 2; right: 8px; bottom: 24px;', 1)
        scripts = '<script src="config.js"></script>\n<script src="maps.js"></script>\n' + scripts
    logic = re.search(r"<script type=\"text/x-dc\"[^>]*>(.*?)</script>", s, re.S).group(1)
    css = EXTRA_CSS.get(out_name, "")
    page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
{head_extra}
{('<style>' + css + '</style>') if css else ''}
</head>
<body>
<div id="dc-root"></div>
<template id="dc-template">{body}</template>
<script type="text/plain" id="dc-logic">{logic}</script>
{scripts}
</body>
</html>
"""
    (out_dir / out_name).write_text(page)
    print("built", out_name)

shutil.copy(here / "dc-lite.js", out_dir / "dc-lite.js")
shutil.copy(here / "maps.js", out_dir / "maps.js")
if not (out_dir / "config.js").exists():
    (out_dir / "config.js").write_text("window.MEDROUTE_CONFIG = { googleMapsApiKey: '' };\n")
