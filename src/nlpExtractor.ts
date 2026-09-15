import nlp from 'compromise';

export interface ExtractedTask {
    rawText: string;
    event: string;        // Clean event name (e.g. "Birthday", "Doctor Appointment")
    dateText: string;     // Extracted date string (e.g. "16th of Jan", "Tomorrow")
    parsedDate: Date;     // Computed JS Date
    type: 'date' | 'action';
    formattedEvent: string; // e.g. "Birthday on Jan 16"
}

// Month name mapping
const MONTHS_MAP: Record<string, number> = {
    'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
    'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6,
    'aug': 7, 'august': 7, 'sep': 8, 'sept': 8, 'september': 8,
    'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
};

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Clean leading conversational filler phrases, pronouns, and verbs
 * e.g. "I have a Birthday" -> "Birthday"
 * "We are going to a dinner" -> "Dinner"
 * "There is a meeting" -> "Meeting"
 */
export function cleanEventTitle(raw: string): string {
    let clean = raw.trim();

    // Remove markdown or icon prefixes
    clean = clean.replace(/^[📅✅⏰•\-\*\s]+/, '');

    // List of conversational prefixes to strip
    const fillerPatterns = [
        /^(?:i|we|you|they|he|she)\s+(?:have|has|had|got|have\s+got)\s+(?:a|an|the|my|our|some)?\s+/i,
        /^(?:i'm|i\s+am|we're|we\s+are|they're|they\s+are)\s+(?:having|going\s+to|planning|attending)\s+(?:a|an|the|my|our)?\s+/i,
        /^(?:there\s+is|there's|there\s+will\s+be|it\s+is|it's)\s+(?:a|an|the)?\s+/i,
        /^(?:going\s+for|going\s+to|planning\s+for|attending|scheduled\s+for)\s+(?:a|an|the)?\s+/i,
        /^(?:don't\s+forget\s+to|remember\s+to|remind\s+me\s+to|please\s+remind\s+me\s+to|please\s+remember\s+to|make\s+sure\s+to|need\s+to|have\s+to)\s+/i,
        /^(?:i\s+want\s+to|i\s+need\s+to|we\s+need\s+to|you\s+need\s+to)\s+/i,
        /^(?:a|an|the)\s+/i
    ];

    let changed = true;
    while (changed) {
        changed = false;
        for (const pattern of fillerPatterns) {
            if (pattern.test(clean)) {
                clean = clean.replace(pattern, '').trim();
                changed = true;
            }
        }
    }

    // Remove trailing prepositions if left hanging (e.g. "Birthday on" -> "Birthday")
    clean = clean.replace(/\s+(?:on|at|by|for|this|during|in|from)\s*$/i, '').trim();

    // Capitalize first letter
    if (clean.length > 0) {
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    return clean || 'Event';
}

/**
 * Robust date parser supporting all conversational & numerical formats
 */
export function parseDateFromText(text: string): Date {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lower = text.toLowerCase().trim();

    // 1. Relative keywords
    if (lower.includes('today') || lower.includes('tonight')) return now;
    if (lower.includes('day after tomorrow')) {
        const d = new Date(now);
        d.setDate(d.getDate() + 2);
        return d;
    }
    if (lower.includes('tomorrow')) {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        return d;
    }
    if (lower.includes('next week')) {
        const d = new Date(now);
        d.setDate(d.getDate() + 7);
        return d;
    }
    if (lower.includes('next month')) {
        const d = new Date(now);
        d.setMonth(d.getMonth() + 1);
        return d;
    }

    // 2. Day names (e.g., "next Friday", "this Sunday", "Monday")
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < dayNames.length; i++) {
        if (lower.includes(dayNames[i])) {
            const d = new Date(now);
            const currentDay = d.getDay();
            let daysUntil = i - currentDay;
            if (daysUntil <= 0) daysUntil += 7;
            if (lower.includes('next') && daysUntil < 7) daysUntil += 7;
            d.setDate(d.getDate() + daysUntil);
            return d;
        }
    }

    // 3. Format: "16th of Jan", "16th of January", "16 Jan", "16th January"
    const dayOfMonMatch = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);
    if (dayOfMonMatch) {
        const day = parseInt(dayOfMonMatch[1]);
        const monthKey = dayOfMonMatch[2].substring(0, 3).toLowerCase();
        const month = MONTHS_MAP[monthKey];
        if (month !== undefined && day >= 1 && day <= 31) {
            let year = currentYear;
            const targetDate = new Date(year, month, day);
            if (targetDate < now) {
                year++;
            }
            return new Date(year, month, day);
        }
    }

    // 4. Format: "Jan 16", "January 16th", "Jan 16th"
    const monDayMatch = lower.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
    if (monDayMatch) {
        const monthKey = monDayMatch[1].substring(0, 3).toLowerCase();
        const day = parseInt(monDayMatch[2]);
        const month = MONTHS_MAP[monthKey];
        if (month !== undefined && day >= 1 && day <= 31) {
            let year = currentYear;
            const targetDate = new Date(year, month, day);
            if (targetDate < now) {
                year++;
            }
            return new Date(year, month, day);
        }
    }

    // 5. Standard date object fallback
    const std = new Date(text);
    if (!isNaN(std.getTime()) && std.getFullYear() > 2000) {
        return std;
    }

    return now;
}

/**
 * Format a Date object into clean human-readable date e.g. "Jan 16"
 */
export function formatHumanDate(date: Date): string {
    const month = MONTH_NAMES[date.getMonth()].substring(0, 3);
    const day = date.getDate();
    return `${month} ${day}`;
}

/**
 * Main NLP Extractor: Takes raw speech transcript and extracts structured tasks/events
 * Handles cases like: "I have a Birthday on 16th of Jan" -> Event: "Birthday", on "Jan 16"
 */
export function extractTasksAndDatesNLP(transcript: string): ExtractedTask[] {
    const results: ExtractedTask[] = [];
    if (!transcript || !transcript.trim()) return results;

    // Split compound sentences into segments
    const segments = transcript.split(/\b(?:and\s+also|and\s+then|and|then|also|plus|but)\b/i);

    // Regex components for date phrases
    const monthTerms = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
    const dayTerms = '(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)';
    const relTerms = '(?:today|tonight|tomorrow|day\\s+after\\s+tomorrow|next\\s+week|next\\s+month)';

    // Date Pattern 1: "... on/for 16th of Jan" or "... on 16th January"
    // e.g. "I have a Birthday on 16th of Jan"
    const pattern1 = new RegExp(
        `(.+?)\\s+(?:on|for|at|by|this)\\s+(?:the\\s+)?(\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthTerms}|${monthTerms}\\s+\\d{1,2}(?:st|nd|rd|th)?|${relTerms}|(?:next\\s+)?${dayTerms})`,
        'i'
    );

    // Action Pattern 2: "Remember to / Don't forget to take medicine"
    const actionPattern = /\b(?:remember\s+to|don't\s+forget\s+to|remind\s+me\s+to|make\s+sure\s+to|need\s+to)\s+([^,.\n]+)/i;

    segments.forEach(seg => {
        const cleanSeg = seg.trim();
        if (!cleanSeg || cleanSeg.length < 4) return;

        // Try Pattern 1 (Event with Date)
        const match1 = cleanSeg.match(pattern1);
        if (match1) {
            const rawEventPart = match1[1].trim();
            const rawDatePart = match1[2].trim();

            const cleanEvent = cleanEventTitle(rawEventPart);
            const parsedDate = parseDateFromText(rawDatePart);
            const humanDate = formatHumanDate(parsedDate);

            // Filter out junk questions like "What", "How", "Why"
            if (cleanEvent.length >= 2 && !['What', 'When', 'How', 'Where', 'Why', 'Who'].includes(cleanEvent)) {
                results.push({
                    rawText: cleanSeg,
                    event: cleanEvent,
                    dateText: rawDatePart,
                    parsedDate,
                    type: 'date',
                    formattedEvent: `${cleanEvent} on ${humanDate}`
                });
                return;
            }
        }

        // Try Action Pattern (Direct Reminders)
        const matchAction = cleanSeg.match(actionPattern);
        if (matchAction) {
            const actionText = matchAction[1].trim();
            const cleanAction = cleanEventTitle(actionText);
            const parsedDate = parseDateFromText(actionText);

            if (cleanAction.length >= 2) {
                results.push({
                    rawText: cleanSeg,
                    event: cleanAction,
                    dateText: 'Today',
                    parsedDate,
                    type: 'action',
                    formattedEvent: cleanAction
                });
                return;
            }
        }

        // Try Compromise NLP Entity & Date detection as a fallback
        try {
            const doc = nlp(cleanSeg) as any;
            const dates = doc.dates ? doc.dates().out('array') : [];
            const nouns = doc.nouns ? doc.nouns().out('array') : [];

            if (dates.length > 0 && nouns.length > 0) {
                const dateText = dates[0];
                // Remove dateText from segment to isolate the noun phrase
                const eventWithoutDate = cleanSeg.replace(new RegExp(dateText, 'gi'), '');
                const cleanEvent = cleanEventTitle(eventWithoutDate);
                const parsedDate = parseDateFromText(dateText);
                const humanDate = formatHumanDate(parsedDate);

                if (cleanEvent.length >= 2 && cleanEvent.toLowerCase() !== 'event') {
                    results.push({
                        rawText: cleanSeg,
                        event: cleanEvent,
                        dateText,
                        parsedDate,
                        type: 'date',
                        formattedEvent: `${cleanEvent} on ${humanDate}`
                    });
                }
            }
        } catch (nlpErr) {
            console.warn('[NLP Extractor] Compromise fallback notice:', nlpErr);
        }
    });

    return results;
}
