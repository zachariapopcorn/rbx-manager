import WarnEntry from "./WarnEntry"

export default interface ModerationData {
    banData: {
        isBanned: boolean,
        reason: string,
        releaseTime?: number
    },
    muteData: {
        isMuted: boolean,
        reason: string,
        releaseTime?: number
    },
    warns: WarnEntry[] // We should check if this exists because this is a new feature and not all database entries might have it
}