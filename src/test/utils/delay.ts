import { OpenedWallet } from "../typescript/types";

export async function waitSeqno(seqno: number, wallet: OpenedWallet) {
  let seqnoAfter;
  for (let attempt = 0; attempt < 100; attempt++) {
    await sleep(2000);
    seqnoAfter = await wallet.contract.getSeqno();
    if (seqnoAfter == seqno + 1) break;
  }

  if (seqnoAfter) return seqnoAfter;
  else return 0;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
