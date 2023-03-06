/** Capitalizes the first character of a string. */
export function capitalizeFirst(s) {
    if (s.length > 0) {
        return s.charAt(0).toUpperCase() + s.substring(1);
    }
    else {
        return s;
    }
}
