import { Address } from '@ton/ton';
import { openWallet, tonapiUrl } from '../configs/network';
import { CollectionDataInterface } from '../typescript/types';
import { NftCollection } from './NftCollection';
import axios from 'axios';
import { toncenterApiKey } from '../configs/environment';

export async function deployCollection(collection: NftCollection) {
	const wallet = await openWallet();
	await collection.deploy(wallet, '0.05');
}

export async function getAddressByIndex(collectionAddress: string, index: number) {
	return (
		await axios.get(
			`${tonapiUrl}/v2/blockchain/accounts/${collectionAddress}/methods/get_nft_address_by_index?api_key=${toncenterApiKey}&args=${index}`,
		)
	).data.decoded.address;
}
