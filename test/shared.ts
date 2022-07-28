import { BigNumber } from "ethers";
import { FakeContract } from "@defi-wonderland/smock";

export const errorHandler = (err: any) => {
  if (err) throw err;
};

export async function rateToPurchasePrice(
  mockParamsStore: FakeContract,
  rate: BigNumber
) {
  const perSecondFeeNumerator =
    await mockParamsStore.getPerSecondFeeNumerator();
  const perSecondFeeDenominator =
    await mockParamsStore.getPerSecondFeeDenominator();

  return rate.mul(perSecondFeeDenominator).div(perSecondFeeNumerator);
}

export function perYearToPerSecondRate(annualRate: number) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}
