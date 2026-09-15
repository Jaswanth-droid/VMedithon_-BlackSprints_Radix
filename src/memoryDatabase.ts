import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ProgressionRecord, INITIAL_PROGRESSION_HISTORY } from './diseaseAnalytics';
import { BehaviorIncident, INITIAL_BEHAVIOR_INCIDENTS } from './behaviorMentalHealth';

export interface CaregiverNote {
    id: string;
    timestamp: Date | string;
    author: string;
    role: string;
    category: 'observation' | 'medication' | 'doctor_visit' | 'safety_alert';
    title: string;
    note: string;
}

// Database schema definition
interface MemoryDB extends DBSchema {
    dates: {
        key: string;
        value: ImportantDate;
        indexes: { 'by-date': string };
    };
    conversations: {
        key: string;
        value: ConversationRecord;
        indexes: { 'by-timestamp': number };
    };
    people: {
        key: string;
        value: PersonRecord;
        indexes: { 'by-name': string; 'by-lastSeen': number };
    };
    progression: {
        key: string;
        value: ProgressionRecord;
        indexes: { 'by-timestamp': number };
    };
    behavior: {
        key: string;
        value: BehaviorIncident;
        indexes: { 'by-type': string };
    };
    caregiverNotes: {
        key: string;
        value: CaregiverNote;
        indexes: { 'by-category': string };
    };
}

export interface ImportantDate {
    id: string;
    date: string;
    event: string;
    type: 'meeting' | 'appointment' | 'reminder';
    createdAt: Date;
}

export interface ConversationEntry {
    speaker: string;
    text: string;
    timestamp: Date;
}

export interface ConversationRecord {
    id: string;
    timestamp: Date;
    participants: string[];
    summary: string;
    fullTranscript: ConversationEntry[];
}

export interface PersonRecord {
    id: string;
    name: string;
    relation: string;
    faceImage: string; // Base64
    faceEmbedding?: number[];
    firstSeen: Date;
    lastSeen: Date;
    conversationContext: string;
}

const DB_NAME = 'mnemosync-memory-v2';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<MemoryDB> | null = null;

// Initialize database
export async function initDatabase(): Promise<IDBPDatabase<MemoryDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<MemoryDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Dates store
            if (!db.objectStoreNames.contains('dates')) {
                const datesStore = db.createObjectStore('dates', { keyPath: 'id' });
                datesStore.createIndex('by-date', 'date');
            }

            // Conversations store
            if (!db.objectStoreNames.contains('conversations')) {
                const convoStore = db.createObjectStore('conversations', { keyPath: 'id' });
                convoStore.createIndex('by-timestamp', 'timestamp');
            }

            // People store
            if (!db.objectStoreNames.contains('people')) {
                const peopleStore = db.createObjectStore('people', { keyPath: 'id' });
                peopleStore.createIndex('by-name', 'name');
                peopleStore.createIndex('by-lastSeen', 'lastSeen');
            }

            // Progression store
            if (!db.objectStoreNames.contains('progression')) {
                const progStore = db.createObjectStore('progression', { keyPath: 'id' });
                progStore.createIndex('by-timestamp', 'timestamp');
            }

            // Behavior store
            if (!db.objectStoreNames.contains('behavior')) {
                const behStore = db.createObjectStore('behavior', { keyPath: 'id' });
                behStore.createIndex('by-type', 'type');
            }

            // Caregiver Notes store
            if (!db.objectStoreNames.contains('caregiverNotes')) {
                const notesStore = db.createObjectStore('caregiverNotes', { keyPath: 'id' });
                notesStore.createIndex('by-category', 'category');
            }
        },
    });

    return dbInstance;
}

// ===== DATES OPERATIONS =====
export async function addDate(date: ImportantDate): Promise<void> {
    const db = await initDatabase();
    await db.add('dates', date);
}

export async function getAllDates(): Promise<ImportantDate[]> {
    const db = await initDatabase();
    return db.getAll('dates');
}

export async function deleteDate(id: string): Promise<void> {
    const db = await initDatabase();
    await db.delete('dates', id);
}

// ===== CONVERSATIONS OPERATIONS =====
export async function addConversation(conversation: ConversationRecord): Promise<void> {
    const db = await initDatabase();
    await db.add('conversations', conversation);
}

export async function getAllConversations(): Promise<ConversationRecord[]> {
    const db = await initDatabase();
    const convos = await db.getAll('conversations');
    return convos.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getConversation(id: string): Promise<ConversationRecord | undefined> {
    const db = await initDatabase();
    return db.get('conversations', id);
}

export async function deleteConversation(id: string): Promise<void> {
    const db = await initDatabase();
    await db.delete('conversations', id);
}

// ===== PEOPLE OPERATIONS =====
export async function addPerson(person: PersonRecord): Promise<void> {
    const db = await initDatabase();
    await db.add('people', person);
}

export async function updatePerson(person: PersonRecord): Promise<void> {
    const db = await initDatabase();
    await db.put('people', person);
}

export async function getAllPeople(): Promise<PersonRecord[]> {
    const db = await initDatabase();
    const people = await db.getAll('people');
    return people.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
}

export async function getPerson(id: string): Promise<PersonRecord | undefined> {
    const db = await initDatabase();
    return db.get('people', id);
}

export async function getPersonByName(name: string): Promise<PersonRecord | undefined> {
    const db = await initDatabase();
    const index = db.transaction('people').objectStore('people').index('by-name');
    return index.get(name);
}

export async function deletePerson(id: string): Promise<void> {
    const db = await initDatabase();
    await db.delete('people', id);
}

// ===== DISEASE PROGRESSION OPERATIONS =====
export async function getProgressionHistory(): Promise<ProgressionRecord[]> {
    const db = await initDatabase();
    let records = await db.getAll('progression');
    if (records.length === 0) {
        // Seed initial 6-month clinical baseline
        for (const item of INITIAL_PROGRESSION_HISTORY) {
            await db.put('progression', item);
        }
        records = await db.getAll('progression');
    }
    return records.sort((a, b) => a.timestamp - b.timestamp);
}

export async function addProgressionRecord(record: ProgressionRecord): Promise<void> {
    const db = await initDatabase();
    await db.put('progression', record);
}

// ===== BEHAVIOR OPERATIONS =====
export async function getBehaviorIncidents(): Promise<BehaviorIncident[]> {
    const db = await initDatabase();
    let records = await db.getAll('behavior');
    if (records.length === 0) {
        for (const item of INITIAL_BEHAVIOR_INCIDENTS) {
            await db.put('behavior', item);
        }
        records = await db.getAll('behavior');
    }
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addBehaviorIncident(incident: BehaviorIncident): Promise<void> {
    const db = await initDatabase();
    await db.put('behavior', incident);
}

// ===== CAREGIVER NOTES & REPORTS =====
export async function getCaregiverNotes(): Promise<CaregiverNote[]> {
    const db = await initDatabase();
    let notes = await db.getAll('caregiverNotes');
    if (notes.length === 0) {
        const seedNotes: CaregiverNote[] = [
            {
                id: 'note-1',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
                author: 'Dr. Sarah Jenkins',
                role: 'Neurologist / Memory Care Specialist',
                category: 'doctor_visit',
                title: 'Quarterly Neurocognitive Evaluation',
                note: 'Patient remains stable at CDR 1.0 (Mild Dementia). Advised continuing audio-visual familiarization and circadian lighting. Current Donepezil 10mg regimen retained.'
            },
            {
                id: 'note-2',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                author: 'Maya Sharma (Primary Caregiver)',
                role: 'Daughter / Family Caregiver',
                category: 'observation',
                title: 'Evening Calm Protocol Success',
                note: 'Played the 1970s acoustic playlist at 17:30 before sundowning onset. Patient was remarkably calm and enjoyed looking at old photo albums on the HUD.'
            },
            {
                id: 'note-3',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
                author: 'Nurse Robert Vance',
                role: 'Home Health Aide',
                category: 'medication',
                title: 'Medication Administration & Fluid Intake',
                note: 'Morning Donepezil and Memantine taken on time with breakfast. 1.8L water intake achieved throughout the day.'
            }
        ];
        for (const note of seedNotes) {
            await db.put('caregiverNotes', note);
        }
        notes = await db.getAll('caregiverNotes');
    }
    return notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addCaregiverNote(note: CaregiverNote): Promise<void> {
    const db = await initDatabase();
    await db.put('caregiverNotes', note);
}

// ===== UTILITY FUNCTIONS =====
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function clearAllData(): Promise<void> {
    const db = await initDatabase();
    await db.clear('dates');
    await db.clear('conversations');
    await db.clear('people');
    await db.clear('progression');
    await db.clear('behavior');
    await db.clear('caregiverNotes');
}
