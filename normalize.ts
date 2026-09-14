/**
 * Normalize a text testdata file without changing its line content.
 *
 * The final newline is intentionally added for an empty file as well: an
 * empty file has no newline at its end and the script's contract requires
 * every file to end with one.
 */
export function normalizeTestdata(content: string): string {
    const normalized = content
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t]+(?=\n|$)/g, '');
    return normalized.endsWith('\n') ? normalized : `${normalized}\n`;
}
