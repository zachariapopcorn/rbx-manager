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
    }
}