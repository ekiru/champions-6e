import * as round from "../../util/round.js";
export function calculateActiveCost({ base, adders = 0, advantages = 0, limitations = 0, }) {
    return round.favouringLower((base + adders) * (1 + advantages));
}
export function calculateRealCost(info) {
    return round.favouringLower(calculateActiveCost(info) / (1 + (info.limitations ?? 0)));
}
