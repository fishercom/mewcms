import { SVGAttributes } from 'react';

// The "code cat" mark: the eyes are cut out (evenodd), so it works in one colour on any background.
// Keep in sync with public/brand/*.svg and public/favicon.svg.
export const MARK_PATH =
    'M13 27L15 7L29 19H35L49 7L51 27C55 31 56 36 56 41C56 51 46 58 32 58C18 58 8 51 8 41C8 36 9 31 13 27Z' +
    'M25.414 35.414L21.828 39L25.414 42.586A2 2 0 0 1 22.586 45.414L17.586 40.414A2 2 0 0 1 17.586 37.586L22.586 32.586A2 2 0 0 1 25.414 35.414Z' +
    'M38.586 35.414L42.172 39L38.586 42.586A2 2 0 0 0 41.414 45.414L46.414 40.414A2 2 0 0 0 46.414 37.586L41.414 32.586A2 2 0 0 0 38.586 35.414Z';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg aria-hidden="true" {...props} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
        </svg>
    );
}
