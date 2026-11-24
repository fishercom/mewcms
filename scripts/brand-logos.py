"""
Builds the MewCMS logo files in public/brand/ (and public/favicon.svg) from the "code cat" mark and the Sora font
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
HEAD = 'M13 27L14.3 14Q15 7 20.3 11.6L29 19H35L43.7 11.6Q49 7 49.7 14L51 27C55 31 56 36 56 41C56 51 46 58 32 58C18 58 8 51 8 41C8 36 9 31 13 27Z'
FACE = 'M10.5 40A21.5 14.5 0 0 1 53.5 40A21.5 14.5 0 0 1 10.5 40Z'
EYES = (
    'M25.481 36.221L22.203 39.5L25.481 42.779A3 3 0 0 1 21.239 47.021L15.839 41.621A3 3 0 0 1 15.839 37.379L21.239 31.979A3 3 0 0 1 25.481 36.221Z'
    'M38.519 36.221L41.797 39.5L38.519 42.779A3 3 0 0 0 42.761 47.021L48.161 41.621A3 3 0 0 0 48.161 37.379L42.761 31.979A3 3 0 0 0 38.519 36.221Z'
)
# With evenodd the face is cut out of the head and the eyes sit inside it: the mark in one colour
MARK = HEAD + FACE + EYES
MARK_TOP, MARK_BOTTOM, MARK_LEFT, MARK_RIGHT = 9.8, 58, 8, 56
FACE_FILL = '#FFFFFF'

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


def mark(fill, dx=0):
    """The cat: a white face under the one-colour mark, or only the mark for mono (the face stays transparent)"""
    move = f' transform="translate({dx:.2f} 0)"' if dx else ''
    face = '' if fill == 'currentColor' else f'<path fill="{FACE_FILL}"{move} d="{FACE}"/>'
    return f'{face}<path {paint(fill)} fill-rule="evenodd"{move} d="{MARK}"/>'


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
            mark(mark_fill) +
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
            mark(mark_fill, mark_x) +
            f'<path {paint(ink)} d="{mew}"/><path {paint(ink)} fill-opacity="{CMS_OPACITY}" d="{cms}"/>'))

    # The mark alone, and the favicon (the lighter purple when the browser is in dark mode)
    write('mark.svg', svg(64, 64, mark(IRIS)))
    write('mark-dark.svg', svg(64, 64, mark(IRIS_DARK)))
    write('mark-mono.svg', svg(64, 64, mark('currentColor')))
    favicon = (f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">'
               f'<style>.m{{fill:{IRIS}}}@media (prefers-color-scheme:dark){{.m{{fill:{IRIS_DARK}}}}}</style>'
               f'<path fill="{FACE_FILL}" d="{FACE}"/><path class="m" fill-rule="evenodd" d="{MARK}"/></svg>\n')
    with open(os.path.join(ROOT, 'public/favicon.svg'), 'w') as f:
        f.write(favicon)
    print('wrote public/favicon.svg')


if __name__ == '__main__':
    main()
