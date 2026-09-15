/**
 * Occasion extraction for Mnemosync.
 *
 * The previous approach grabbed a broad slice of the sentence around a date word
 * (e.g. "I need to go to the doctor appointment on Friday" became a long,
 * noisy task string). This module instead isolates a *concise occasion*: a short
 * event noun phrase plus the specific time it should happen, so the reminder the
 * patient sees reads like "Doctor appointment — Friday" rather than a whole
 * sentence.
 */

export interface Occasion {
    title: string;                       // concise event, e.g. "Doctor appointment"
    when: string;                        // normalised temporal phrase, e.g. "on Friday"
    date?: Date;                         // resolved date when possible
    type: 'appointment' | 'reminder' | 'event';
}

const MONTHS = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
const DAYS = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday';

// A "when" phrase we can act on. Ordered longest-first so greedy alternation
// prefers the most specific match.
const TEMPORAL_RE = new RegExp(
    `(?:` +
    `\\b(?:day\\s+after\\s+tomorrow|tomorrow|today|tonight)\\b` +
    `|\\bthis\\s+(?:morning|afternoon|evening|week|month|weekend|${DAYS})\\b` +
    `|\\bnext\\s+(?:week|month|weekend|${DAYS})\\b` +
    `|\\b(?:on|by|before|after|until|at)\\s+(?:${DAYS})\\b` +
    `|\\b(?:on|by|before|after|until)?\\s*(?:${MONTHS})\\s+\\d{1,2}(?:st|nd|rd|th)?\\b` +
    `|\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${MONTHS})\\b` +
    `|\\b(?:${DAYS})\\b` +
    `|\\bat\\s+\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|a\\.m\\.|p\\.m\\.)\\b` +
    `|\\bin\\s+the\\s+(?:morning|afternoon|evening)\\b` +
    `)`,
    'gi'
);

// Leading words/phrases that are conversational filler, not the event itself.
const FILLER_LEAD = new RegExp(
    `^(?:` +
    `i\\s+(?:need|have|want|would|will|am|m|'\w+|gotta|must|should)` +
    `|we\\s+(?:need|have|will|are|'\w+|should|must|can)` +
    `|you\\s+(?:need|have|should|must|can|will)` +
    `|they\\s+(?:need|have|will|are)` +
    `|remind\\s+me\\s+to|remember\\s+to|don'?t\\s+forget\\s+to|do\\s+not\\s+forget\\s+to` +
    `|make\\s+sure\\s+to|need\\s+to|have\\s+to|has\\s+to|got\\s+to|gotta` +
    `|going\\s+to|gonna|plan(?:ning)?\\s+to|supposed\\s+to|about\\s+to` +
    `|there\\s+(?:is|are|'\''s)|it\\s+is|its|i\\s+think|let'?s` +
    `|and|then|also|so|but|the|a|an|to|my|me|for|that|of` +
    `)\\b[\\s,]*`,
    'i'
);

// Trailing connective prepositions left dangling after removing the time phrase.
const TRAILING_PREP = /\b(?:on|at|by|for|this|next|in|during|until|before|after|to|a|an|the|my)\b[\s,]*$/i;

const STOPWORD_ONLY = /^(?:to|the|a|an|for|on|at|my|me|i|we|it|is|am|are|and|then|go|going|do|some|thing|something|stuff)$/i;

function titleCase(phrase: string): string {
    return phrase
        .split(/\s+/)
        .map((w, i) => {
            if (i !== 0 && /^(?:to|the|a|an|for|on|at|of|in|with|and)$/i.test(w)) return w.toLowerCase();
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        })
        .join(' ');
}

function stripFiller(phrase: string): string {
    let out = phrase.trim();
    let changed = true;
    let guard = 0;
    while (changed && guard < 8) {
        changed = false;
        guard++;
        const next = out.replace(FILLER_LEAD, '').replace(TRAILING_PREP, '');
        if (next !== out) {
            out = next.trim();
            changed = true;
        }
    }
    return out.replace(/\s{2,}/g, ' ').replace(/^[\s,.-]+|[\s,.-]+$/g, '').trim();
}

/** Parse a resolved Date from a natural phrase (moved here so it's shared). */
export function parseDateFromText(text: string): Date {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lower = text.toLowerCase();

    const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6,
        aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
    };

    if (lower.includes('day after tomorrow')) return addDays(now, 2);
    if (lower.includes('tomorrow')) return addDays(now, 1);
    if (lower.includes('today') || lower.includes('tonight')) return now;
    if (lower.includes('next week')) return addDays(now, 7);
    if (lower.includes('next month')) { const d = new Date(now); d.setMonth(d.getMonth() + 1); return d; }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < dayNames.length; i++) {
        if (lower.includes(dayNames[i])) {
            const d = new Date(now);
            let daysUntil = i - d.getDay();
            if (daysUntil <= 0) daysUntil += 7;
            return addDays(now, daysUntil);
        }
    }

    const monthDay = text.match(new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'));
    if (monthDay) {
        const month = monthMap[monthDay[1].toLowerCase().slice(0, 3)];
        const day = parseInt(monthDay[2], 10);
        if (month !== undefined && day >= 1 && day <= 31) {
            let year = currentYear;
            let target = new Date(year, month, day);
            if (target < now) { year++; target = new Date(year, month, day); }
            return target;
        }
    }

    const dayMonth = text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTHS})\\b`, 'i'));
    if (dayMonth) {
        const day = parseInt(dayMonth[1], 10);
        const month = monthMap[dayMonth[2].toLowerCase().slice(0, 3)];
        if (month !== undefined && day >= 1 && day <= 31) {
            let year = currentYear;
            let target = new Date(year, month, day);
            if (target < now) { year++; target = new Date(year, month, day); }
            return target;
        }
    }

    const standard = new Date(text);
    if (!isNaN(standard.getTime())) return standard;
    return now;
}

function addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}

function classify(clause: string): Occasion['type'] {
    const l = clause.toLowerCase();
    if (/(doctor|dentist|clinic|hospital|appointment|check-?up|therapy|physio|lab|test)/.test(l)) return 'appointment';
    if (/(remind|remember|don'?t forget|take your|medicine|medication|pill|call|pay|buy)/.test(l)) return 'reminder';
    return 'event';
}

function normaliseWhen(raw: string): string {
    return raw.replace(/\s{2,}/g, ' ').trim().replace(/^,/g, '').trim();
}

/**
 * Extract concise occasions from a transcript/sentence.
 * Returns [] when there is no actionable time reference.
 */
export function extractOccasions(input: string): Occasion[] {
    if (!input || !input.trim()) return [];
    const results: Occasion[] = [];
    const seen = new Set<string>();

    const clauses = input
        .split(/[,;.\n!?]|\band\b|\bthen\b|\balso\b|\bbut\b/i)
        .map(c => c.trim())
        .filter(Boolean);

    for (const clause of clauses) {
        TEMPORAL_RE.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = TEMPORAL_RE.exec(clause)) !== null) {
            const whenRaw = m[0];
            // Remove the time phrase; the remaining words are the event candidate.
            const withoutTime = (clause.slice(0, m.index) + ' ' + clause.slice(m.index + whenRaw.length))
                .replace(/\s{2,}/g, ' ');
            const eventPhrase = stripFiller(withoutTime);
            if (!eventPhrase || STOPWORD_ONLY.test(eventPhrase)) continue;

            // Cap the event phrase to a readable length (max ~6 words).
            const words = eventPhrase.split(/\s+/).slice(0, 6).join(' ');
            const title = titleCase(words);
            const when = normaliseWhen(whenRaw);
            const key = `${title}|${when}`.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);

            results.push({
                title,
                when,
                date: parseDateFromText(when),
                type: classify(clause),
            });
        }
    }

    return results;
}
