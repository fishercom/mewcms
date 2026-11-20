<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Keeps only the drawing parts of an SVG: shapes, paths, text, gradients, clip paths and masks.
 * Scripts, event handlers, foreign content, external references and anything not listed
 * here are removed, so an uploaded logo cannot run code when opened from this site.
 */
class SvgSanitizer
{
    protected const ELEMENTS = [
        'svg', 'g', 'defs', 'title', 'desc', 'symbol', 'use',
        'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
        'text', 'tspan', 'textPath',
        'linearGradient', 'radialGradient', 'stop', 'pattern',
        'clipPath', 'mask', 'filter',
        'feGaussianBlur', 'feOffset', 'feBlend', 'feColorMatrix', 'feComposite', 'feFlood', 'feMerge', 'feMergeNode', 'feMorphology',
    ];

    protected const ATTRIBUTES = [
        'id', 'class', 'style', 'transform', 'viewBox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
        'cx', 'cy', 'r', 'rx', 'ry', 'fx', 'fy', 'd', 'points', 'pathLength', 'preserveAspectRatio', 'version', 'xmlns', 'role',
        'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
        'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'color', 'display', 'visibility',
        'clip-path', 'clip-rule', 'clipPathUnits', 'mask', 'maskUnits', 'maskContentUnits', 'filter', 'filterUnits',
        'gradientUnits', 'gradientTransform', 'spreadMethod', 'offset', 'stop-color', 'stop-opacity',
        'patternUnits', 'patternContentUnits', 'patternTransform',
        'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'text-anchor', 'dominant-baseline', 'dx', 'dy',
        'in', 'in2', 'result', 'stdDeviation', 'mode', 'type', 'values', 'operator', 'k1', 'k2', 'k3', 'k4', 'radius',
        'flood-color', 'flood-opacity', 'color-interpolation-filters', 'shape-rendering', 'vector-effect', 'mix-blend-mode',
        'href', 'xlink:href', 'xmlns:xlink',
    ];

    public static function clean(string $svg): ?string
    {
        // No DTD, entities or network: libxml loads nothing from outside
        if (preg_match('/<!DOCTYPE|<!ENTITY/i', $svg)) {
            return null;
        }

        $doc = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        $loaded = $doc->loadXML($svg, LIBXML_NONET);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $doc->documentElement;
        if (! $loaded || ! $root instanceof DOMElement || $root->localName !== 'svg') {
            return null;
        }

        self::cleanNode($root);

        return $doc->saveXML($root);
    }

    protected static function cleanNode(DOMElement $element): void
    {
        foreach (iterator_to_array($element->attributes ?? []) as $attribute) {
            $name = $attribute->nodeName;
            $value = trim($attribute->nodeValue ?? '');
            $keep = in_array($name, self::ATTRIBUTES, true);

            // Links only to parts of this same file
            if ($keep && in_array($name, ['href', 'xlink:href'], true) && ! str_starts_with($value, '#')) {
                $keep = false;
            }
            // No url() outside the file, no old IE expressions, no @import in inline styles
            if ($keep && preg_match('/url\s*\(\s*[\'"]?\s*(?!#)|expression\s*\(|@import|javascript:/i', $value)) {
                $keep = false;
            }

            if (! $keep) {
                $element->removeAttributeNode($attribute);
            }
        }

        foreach (iterator_to_array($element->childNodes) as $child) {
            /** @var DOMNode $child */
            if ($child instanceof DOMElement) {
                if (in_array($child->localName, self::ELEMENTS, true) && in_array($child->namespaceURI, [null, 'http://www.w3.org/2000/svg'], true)) {
                    self::cleanNode($child);
                } else {
                    $element->removeChild($child);
                }
            } elseif (! in_array($child->nodeType, [XML_TEXT_NODE, XML_CDATA_SECTION_NODE], true)) {
                // Comments and processing instructions go
                $element->removeChild($child);
            }
        }
    }
}
