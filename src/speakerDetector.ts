import * as tf from '@tensorflow/tfjs';
export interface IdentifiedPerson {
    name: string;
    relation: string;
}

/**
 * SpeakerDetector uses a combination of face identification data and optional
 * TensorFlow.js voice‑print analysis to determine who is currently speaking.
 *
 * For the MVP we implement a lightweight heuristic that switches to the
 * identified visitor when the face recognition reports a name different from the
 * primary (patient) speaker. If the identified person matches the primary
 * speaker, we treat the audio as coming from the patient. When no reliable
 * identification is available we return `null` indicating no speaker change.
 *
 * The class is designed to be extensible – a future TensorFlow.js model can be
 * loaded in the constructor and used inside `detectSpeaker` without changing the
 * public API.
 */
export class SpeakerDetector {
    // Placeholder for a future voice‑print model instance.
    // private model: any = null;

    constructor() {
        // In a full implementation we would asynchronously load a TensorFlow.js
        // model here (e.g., a speaker‑verification model). For now we rely solely
        // on the identifiedPerson information passed from the UI.
    }

    /**
     * Detects the current speaker.
     *
     * @param transcript          The latest speech transcript (unused for the
     *                            heuristic but kept for future model use).
     * @param identifiedPerson    The person identified by the face‑recognition
     *                            pipeline, or `null` if unknown.
     * @param primarySpeakerName  The name of the primary user (patient). This is
     *                            set once when the user is first identified.
     * @returns 'You' | 'Visitor' | null – the speaker label or `null` if the
     *          detector cannot decide.
     */
    public detectSpeaker(
        transcript: string,
        identifiedPerson: IdentifiedPerson | null,
        primarySpeakerName: string | null
    ): 'You' | 'Visitor' | null {
        // If we have a confident identification that differs from the primary
        // speaker, treat this as the visitor speaking.
        if (identifiedPerson && primarySpeakerName) {
            if (identifiedPerson.name !== primarySpeakerName) {
                return 'Visitor';
            }
            // Identified person matches the primary user.
            return 'You';
        }

        // Future enhancement: run the TensorFlow.js voice‑print model on the
        // audio buffer and compare embeddings against stored profiles.
        // For now we cannot make a decision.
        return null;
    }
}
