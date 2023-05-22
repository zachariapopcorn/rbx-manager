export default interface RewardEntry {
    rewardID: string,
    rank: {
        groupId: number,
        rankName: string
    },
    xpNeeded: number
}