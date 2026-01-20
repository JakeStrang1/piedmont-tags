/**
 * Parses a tag number string into an array of expanded lot numbers.
 *
 * Rules:
 * - Lot numbers are always 4 numbers.
 * - They can be in a list combining ranges and comma separated values
 * - The first number is always the full 4 digit number. Subsequent ranges and lists are always the last 2 digits.
 * - Lot numbers are always listed in increasing order. So 2099,01 always means 2099 then 2101.
 * - A lot number may end in a "A" or "B". These lot numbers will never appear in a range or list with other lot numbers.
 *
 * Examples:
 * - "2045-47,54,56-59" => ["2045","2046","2047","2054","2056","2057","2058","2059"]
 * - "6197,03-05" => ["6197","6203","6204","6205"]
 * - "1998-01,99-03" => ["1998","1999","2000","2001","2099","2100","2101","2102","2103"]
 * - "4056A" => ["4056A"]
 * - "7790B" => ["7790B"]
 */
export function parseLotNumbers(input: string): string[] {
    const trimmed = input.trim().toUpperCase()
    if (!trimmed) return []

    // Special-case: single lot with A/B suffix (never mixed with ranges/lists)
    if (/^\d{4}[AB]$/.test(trimmed)) return [trimmed]

    const tokens = trimmed.split(',').map((t) => t.trim()).filter(Boolean)
    if (tokens.length === 0) return []

    const results: string[] = []
    let prevFull: number | null = null

    const pad4 = (n: number) => String(n).padStart(4, '0')

    // Given previous full lot number, choose the smallest full number > prev with last2 == suffix
    const nextFullForSuffix = (prev: number, suffix: number) => {
        const base = prev - (prev % 100)
        let candidate = base + suffix
        if (candidate <= prev) candidate += 100
        return candidate
    }

    // Given a start full and an end suffix (00-99), choose the smallest end full >= start with last2 == endSuffix
    const endFullForSuffixFromStart = (startFull: number, endSuffix: number) => {
        const base = startFull - (startFull % 100)
        let candidate = base + endSuffix
        while (candidate < startFull) candidate += 100
        return candidate
    }

    const parseFullOrSuffix = (raw: string) => {
        if (/^\d{4}$/.test(raw)) return { kind: 'full' as const, value: parseInt(raw, 10) }
        if (/^\d{2}$/.test(raw)) return { kind: 'suffix' as const, value: parseInt(raw, 10) }
        return { kind: 'invalid' as const, value: NaN }
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        // A/B lot inside list: treat as standalone
        if (/^\d{4}[AB]$/.test(token)) {
            results.push(token)
            // Keep prevFull unchanged; but per rules, this shouldn't be mixed anyway.
            continue
        }

        const rangeMatch = token.match(/^(\d{4}|\d{2})-(\d{4}|\d{2})$/)
        if (rangeMatch) {
            const left = parseFullOrSuffix(rangeMatch[1])
            const right = parseFullOrSuffix(rangeMatch[2])
            if (left.kind === 'invalid' || right.kind === 'invalid') continue

            let startFull: number
            if (left.kind === 'full') {
                startFull = left.value
            } else {
                if (prevFull === null) continue
                startFull = nextFullForSuffix(prevFull, left.value)
            }

            let endFull: number
            if (right.kind === 'full') {
                endFull = right.value
            } else {
                endFull = endFullForSuffixFromStart(startFull, right.value)
            }

            if (endFull < startFull) continue

            for (let n = startFull; n <= endFull; n++) {
                results.push(pad4(n))
            }
            prevFull = endFull
            continue
        }

        // Single token: full or suffix
        const single = parseFullOrSuffix(token)
        if (single.kind === 'full') {
            results.push(pad4(single.value))
            prevFull = single.value
            continue
        }
        if (single.kind === 'suffix') {
            if (prevFull === null) continue
            const full = nextFullForSuffix(prevFull, single.value)
            results.push(pad4(full))
            prevFull = full
            continue
        }
    }

    return results
}
