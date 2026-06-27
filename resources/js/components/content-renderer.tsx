import React from 'react';
import FrontForm from '@/components/front-form';

interface Props {
    html: string;
    className?: string;
}

// Regex that matches [form alias="..."] or [form alias='...']
const FORM_SHORTCODE_REGEX = /\[form\s+alias=["']([^"']+)["']\s*\/?]/gi;

/**
 * ContentRenderer parses article/page content HTML and replaces
 * recognised shortcodes with live React components.
 *
 * Currently supported shortcodes:
 *   [form alias="my-form"]   – renders the <FrontForm /> component
 */
export default function ContentRenderer({ html, className = '' }: Props) {
    // Split the HTML into alternating plain-html / shortcode segments
    const segments: Array<{ type: 'html'; content: string } | { type: 'form'; alias: string }> = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset regex state before iterating
    FORM_SHORTCODE_REGEX.lastIndex = 0;

    while ((match = FORM_SHORTCODE_REGEX.exec(html)) !== null) {
        // Push the HTML before this match
        if (match.index > lastIndex) {
            segments.push({ type: 'html', content: html.slice(lastIndex, match.index) });
        }
        // Push the form shortcode
        segments.push({ type: 'form', alias: match[1] });
        lastIndex = match.index + match[0].length;
    }

    // Push any trailing HTML after the last match
    if (lastIndex < html.length) {
        segments.push({ type: 'html', content: html.slice(lastIndex) });
    }

    // If there were no shortcodes at all, fall back to a single dangerouslySetInnerHTML block
    if (segments.length === 0) {
        return (
            <div
                className={`prose dark:prose-invert max-w-none ${className}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {segments.map((seg, i) => {
                if (seg.type === 'html') {
                    return seg.content.trim() ? (
                        <div
                            key={i}
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: seg.content }}
                        />
                    ) : null;
                }

                if (seg.type === 'form') {
                    return <FrontForm key={i} alias={seg.alias} />;
                }

                return null;
            })}
        </div>
    );
}
