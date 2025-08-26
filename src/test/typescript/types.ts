import { Address } from '@ton/ton';
import { OpenedContract, TonClient, WalletContractV4 } from '@ton/ton';
import { KeyPair } from '@ton/crypto';

export interface CollectionDataInterface {
	ownerAddress: Address;
	royaltyPercent: number;
	royaltyAddress: Address;
	nextItemIndex: number;
	collectionContentUrl: string;
	commonContentUrl: string;
}

export type mintParams = {
	queryId: number | null;
	itemOwnerAddress: Address;
	itemIndex: number;
	amount: number | string;
	commonContentUrl: string;
};

export interface createNftInterface {
	itemOwnerAddress: string;
	amount: string | number;
	commonContentUrl: string;
	collectionAddress: string;
	nftAddress: string | null;
	type: string;
	nftItemID: number | string;
	status: number;
}

export type OpenedWallet = {
	contract: OpenedContract<WalletContractV4>;
	keyPair: KeyPair;
	client: TonClient;
};

export interface ISaleExample {
	address: string;
	price: number;
}
