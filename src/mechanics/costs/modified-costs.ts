import * as round from "../../util/round.js";

type CostInformation = {
  base: number;
  adders?: number;
  advantages?: number;
  limitations?: number;
};

export function calculateActiveCost({
  base,
  adders = 0,
  advantages = 0,
  limitations = 0,
}: CostInformation): number {
  return round.favouringLower((base + adders) * (1 + advantages));
}

export function calculateRealCost(info: CostInformation): number {
  return round.favouringLower(
    calculateActiveCost(info) / (1 + (info.limitations ?? 0))
  );
}
