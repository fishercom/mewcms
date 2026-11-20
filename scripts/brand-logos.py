"""
Builds the MewCMS logo files in public/brand/ from the "code cat" mark and the Sora font
(the same font the admin uses for the wordmark: "Mew" bold, "CMS" medium at 60% opacity).
The text is converted to paths, so the files look the same everywhere, with no font to load.

    pip install fonttools uharfbuzz
    python3 scripts/brand-logos.py      (after npm install, which brings @fontsource/sora)
"""

import io
import os
import re

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'node_modules/@fontsource/sora/files')
OUT = os.path.join(ROOT, 'public/brand')

# Keep in sync with resources/js/components/app-logo-icon.tsx
MARK = (
    'M13 27L15 7L29 19H35L49 7L51 27C55 31 56 36 56 41C56 51 46 58 32 58C18 58 8 51 8 41C8 36 9 31 13 27Z'
    'M25.414 35.414L21.828 39L25.414 42.586A2 2 0 0 1 22.586 45.414L17.586 40.414A2 2 0 0 1 17.586 37.586L22.586 32.586A2 2 0 0 1 25.414 35.414Z'
    'M38.586 35.414L42.172 39L38.586 42.586A2 2 0 0 0 41.414 45.414L46.414 40.414A2 2 0 0 0 46.414 37.586L41.414 32.586A2 2 0 0 0 38.586 35.414Z'
)
MARK_TOP, MARK_BOTTOM, MARK_LEFT, MARK_RIGHT = 7, 58, 8, 56

IRIS, IRIS_DARK = '#6447F0', '#8B74FF'
INK, INK_DARK = '#18142B', '#FFFFFF'
CMS_OPACITY = '0.6'

FONT_SIZE = 36
TRACKING = -0.025  # tracking-tight
GAP = 12  # from the mark's 64px box to the text


def load(weight):
    path = os.path.join(FONTS, f'sora-latin-{weight}-normal.woff')
    tt = TTFont(path)
    # HarfBuzz reads plain TrueType, not WOFF
    tt.flavor = None
    data = io.BytesIO()
    tt.save(data)
    return tt, hb.Font(hb.Face(data.getvalue()))


def shape(text, weight, x, baseline):
    """Path data for the text, starting at x on the baseline, and the x where it ends."""
    tt, font = load(weight)
    upem = tt['head'].unitsPerEm
    scale = FONT_SIZE / upem
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {'kern': True, 'liga': True})
    glyphs = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    d = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(glyphs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
        glyphs[order[info.codepoint]].draw(TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, baseline)))
        d.append(pen.getCommands())
        x += pos.x_advance * scale + TRACKING * FONT_SIZE
    return ''.join(d), x - TRACKING * FONT_SIZE


def cap_height(weight):
    tt, _ = load(weight)
    return tt['OS/2'].sCapHeight * FONT_SIZE / tt['head'].unitsPerEm


def wordmark(x, baseline):
    mew, end = shape('Mew', 700, x, baseline)
    cms, end = shape('CMS', 500, end + TRACKING * FONT_SIZE, baseline)
    return mew, cms, end


def svg(width, height, body, title='MewCMS'):
    w = f'{width:.2f}'.rstrip('0').rstrip('.')
    h = f'{height:.2f}'.rstrip('0').rstrip('.')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img">'
            f'<title>{title}</title>{body}</svg>\n')


def paint(fill):
    return f'fill="{fill}"' if fill != 'currentColor' else 'fill="currentColor"'


def write(name, content):
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(content)
    print('wrote public/brand/' + name)


def main():
    cap = cap_height(700)
    themes = {'light': (IRIS, INK), 'dark': (IRIS_DARK, INK_DARK), 'mono': ('currentColor', 'currentColor')}

    # Horizontal lockup: the cap height centred on the cat's head
    baseline = (MARK_TOP + MARK_BOTTOM) / 2 + cap / 2
    mew, cms, end = wordmark(64 + GAP, baseline)
    width = end + MARK_LEFT  # the same margin on the right as the mark has on the left
    for theme, (mark_fill, ink) in themes.items():
        write(f'lockup-{theme}.svg', svg(width, 64,
            f'<path {paint(mark_fill)} fill-rule="evenodd" d="{MARK}"/>'
            f'<path {paint(ink)} d="{mew}"/><path {paint(ink)} fill-opacity="{CMS_OPACITY}" d="{cms}"/>'))

    # Wordmark alone, trimmed to the letters (cap height + a little room for the descender-less text)
    mew, cms, end = wordmark(0, cap)
    for theme, (_, ink) in themes.items():
        write(f'wordmark-{theme}.svg', svg(end, cap,
            f'<path {paint(ink)} d="{mew}"/><path {paint(ink)} fill-opacity="{CMS_OPACITY}" d="{cms}"/>'))

    # Stacked lockup (the login screen): the mark above, the wordmark centred below it
    _, _, text_width = wordmark(0, 0)
    width = max(text_width, 64) + 16
    mark_x = (width - 64) / 2
    baseline = MARK_BOTTOM + 20 + cap
    mew, cms, _ = wordmark((width - text_width) / 2, baseline)
    height = baseline + 8
    for theme, (mark_fill, ink) in themes.items():
        write(f'lockup-stacked-{theme}.svg', svg(width, height,
            f'<path {paint(mark_fill)} fill-rule="evenodd" transform="translate({mark_x:.2f} 0)" d="{MARK}"/>'
            f'<path {paint(ink)} d="{mew}"/><path {paint(ink)} fill-opacity="{CMS_OPACITY}" d="{cms}"/>'))


if __name__ == '__main__':
    main()
