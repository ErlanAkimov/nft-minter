// Конфигурация

import { KeyPair, mnemonicToPrivateKey } from '@ton/crypto';
import { toncenterApiKey, walletMnemonic } from './environment';
import { OpenedContract, TonClient, WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import axios from 'axios';

export interface openedWallet {
	contract: OpenedContract<WalletContractV4>;
	keyPair: KeyPair;
	client: TonClient;
}

export const testnet = true;

// При работе в тестовой сети переключаем на testnet = true.

export const toncenter = testnet ? 'https://testnet.toncenter.com' : 'https://toncenter.com';
export const tonapiUrl = testnet ? 'https://testnet.tonapi.io' : 'https://tonapi.io';

// Открываем кошелек единожды при запуске демона. Далее экспортируем только готовый к работе инстанс кошелька
export async function openWallet() {
	const keyPair = await mnemonicToPrivateKey([walletMnemonic]);
	const client = new TonClient({
		endpoint: `${toncenter}/api/v2/jsonRPC`,
		apiKey: toncenterApiKey,
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
		api_key: toncenterApiKey,
	},
});
export const tonapi = axios.create({
	baseURL: `${tonapiUrl}/v2/nfts`,
});
