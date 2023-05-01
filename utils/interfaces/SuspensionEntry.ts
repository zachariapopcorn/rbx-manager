interface SuspensionEntry {
    groupID: number,
    userId: number,
    reason: string,
    oldRoleID: number,
    timeToRelease: number
}

export default SuspensionEntry;