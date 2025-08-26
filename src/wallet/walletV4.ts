// Конфигурация

import { KeyPair, mnemonicToPrivateKey } from '@ton/crypto';
import { OpenedContract, TonClient, WalletContractV5R1, WalletContractV4, WalletContractV2R2 } from '@ton/ton';
import axios from 'axios';
import { tonapiUrl, toncenter } from './wallet';

export const apiKey = '8e8bf83509ff6144f25bca4a3ab926a7f8ba5e8683e314201bf8672a15d8a760';

export interface openedWallet {
	contract: OpenedContract<WalletContractV4>;
	keyPair: KeyPair;
	client: TonClient;
}


// Открываем кошелек единожды при запуске демона. Далее экспортируем только готовый к работе инстанс кошелька
export async function openWalletV4(mnemonic: string | string[]) {
	const keyPair = await mnemonicToPrivateKey(typeof mnemonic === 'string' ? [mnemonic] : mnemonic);
	const client = new TonClient({
		endpoint: `${toncenter}/api/v2/jsonRPC`,
		apiKey,
	});

	const wallet = WalletContractV4.create({
		workchain: 0,
		publicKey: keyPair.publicKey,
	});

	const contract = client.open(wallet);
	return { contract, keyPair, client };
}
export const toncenterApi = axios.create({
	baseURL: `${toncenter}/api/`,
	params: {
		api_key: apiKey,
	},
});
export const tonapi = axios.create({
	baseURL: `${tonapiUrl}/v2/nfts`,
});

export async function waitSeqno(seqno: number, wallet: openedWallet) {
	let seqnoAfter;
	for (let attempt = 0; attempt < 100; attempt++) {
		await sleep(1000);
		seqnoAfter = await wallet.contract.getSeqno();
		console.log('seqno check: ' + seqnoAfter)
		if (seqnoAfter == seqno + 1) break;
	}

	if (seqnoAfter) return seqnoAfter;
	else return 0;
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}