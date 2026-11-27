import { SVGAttributes } from 'react';

// The "code cat" mark: a solid cat head with soft ears and white "< >" eyes.
// Keep in sync with scripts/brand-logos.py (which builds public/brand/*.svg and public/favicon.svg).
export const HEAD_PATH =
    'M13 27L14.3 14Q15 7 20.3 11.6L29 19H35L43.7 11.6Q49 7 49.7 14L51 27C55 31 56 36 56 41C56 51 46 58 32 58C18 58 8 51 8 41C8 36 9 31 13 27Z';
export const EYES_PATH =
    'M25.481 36.221L22.203 39.5L25.481 42.779A3 3 0 0 1 21.239 47.021L15.839 41.621A3 3 0 0 1 15.839 37.379L21.239 31.979A3 3 0 0 1 25.481 36.221Z' +
    'M38.519 36.221L41.797 39.5L38.519 42.779A3 3 0 0 0 42.761 47.021L48.161 41.621A3 3 0 0 0 48.161 37.379L42.761 31.979A3 3 0 0 0 38.519 36.221Z';
/** The mark in one colour: with evenodd the eyes are cut out of the head */
export const MARK_PATH = HEAD_PATH + EYES_PATH;

type Props = SVGAttributes<SVGElement> & {
    /** One colour only, with the eyes left transparent (for engraving-like uses); by default the eyes are white */
    mono?: boolean;
};

export default function AppLogoIcon({ mono = false, ...props }: Props) {
    return (
        <svg aria-hidden="true" {...props} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            {!mono && <path fill="#FFFFFF" d={EYES_PATH} />}
            <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
        </svg>
    );
}
