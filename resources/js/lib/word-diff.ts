export interface DiffPart {
    type: 'same' | 'added' | 'removed';
    text: string;
}

/**
 * Plain text of an HTML fragment, with block boundaries kept as spaces.
 */
export function htmlToText(html: string | null | undefined): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html.replace(/<\/(p|div|h[1-6]|li|br)>/gi, ' $&'), 'text/html');
    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Word-level diff (longest common subsequence) from `before` to `after`.
 */
export function diffWords(before: string, after: string): DiffPart[] {
    const a = before.split(/(\s+)/).filter(Boolean);
    const b = after.split(/(\s+)/).filter(Boolean);

    // Very long texts would make the LCS table too big: compare them as a whole
    if (a.length * b.length > 4_000_000) {
        return before === after
            ? [{ type: 'same', text: before }]
            : [
                  { type: 'removed', text: before },
                  { type: 'added', text: after },
              ];
    }

    const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
    }

    const parts: DiffPart[] = [];
    const push = (type: DiffPart['type'], text: string) => {
        const last = parts[parts.length - 1];
        if (last?.type === type) last.text += text;
        else parts.push({ type, text });
    };

    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
            push('same', a[i]);
            i++;
            j++;
        } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
            push('removed', a[i++]);
        } else {
            push('added', b[j++]);
        }
    }
    while (i < a.length) push('removed', a[i++]);
    while (j < b.length) push('added', b[j++]);

    return parts;
}
