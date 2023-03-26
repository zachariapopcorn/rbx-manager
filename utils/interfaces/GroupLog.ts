export default interface GroupLog {
    userID: number,
    cooldownExpires: number,
    action: "Rank" | "Exile",
    amount: number
}