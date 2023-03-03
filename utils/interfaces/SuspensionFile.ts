export default interface SuspensionFile {
    users: {
        userId: number,
        reason: string,
        oldRoleID: number,
        timeToRelease: number
    }[]
}