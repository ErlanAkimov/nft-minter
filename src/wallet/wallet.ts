// Конфигурация

import { KeyPair, mnemonicToPrivateKey } from '@ton/crypto';
import { OpenedContract, TonClient, WalletContractV5R1, WalletContractV2R2 } from '@ton/ton';
import axios from 'axios';
import dotenv from 'dotenv'

dotenv.config();

export const apiKey = 'c21c38e2cad78072beb7303787b1876828b554f12785a8d7a664d47547e00162';

export interface IWallet {
	contract: OpenedContract<WalletContractV5R1>;
	keyPair: KeyPair;
	client: TonClient;
}

export const toncenter = 'https://toncenter.com';
export const tonapiUrl = 'https://tonapi.io';

// Открываем кошелек единожды при запуске демона. Далее экспортируем только готовый к работе инстанс кошелька
export async function openWallet(testnet?: boolean) {
	console.log(process.env.MNEMONIC)
	const keyPair = await mnemonicToPrivateKey([process.env.MNEMONIC!]);
	const client = new TonClient({
		endpoint: testnet ? "https://testnet.toncenter.com/api/v2/jsonRPC" : `${toncenter}/api/v2/jsonRPC`,
		apiKey
	});

	const wallet = WalletContractV5R1.create({
		workchain: 0,
		publicKey: keyPair.publicKey,
	});

	const contract = client.open(wallet);
	return { contract, keyPair, client };
}

export async function waitSeqno(seqno: number, wallet: IWallet) {
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