export default interface ModerationData {
    banData: {
        isBanned: boolean,
        reason: string
    },
    muteData: {
        isMuted: boolean,
        reason: string
    }
}