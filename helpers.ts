export const clean = (string = '') => {
    if (containsNumbers(string)) return null
    if (string.includes('://')) return null

    const result = string
        .split(/,|'|;|\(/g)[0]
    if (!result) return null
    return result.trim()
}

function containsNumbers(str: string) {
    return /\d/.test(str);
}
