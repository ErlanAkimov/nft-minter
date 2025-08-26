import { Address } from '@ton/ton';
import { openWallet } from './configs/network';
import { SaleContract } from './contracts/SaleContract';
import { deployCollection } from './contracts/DeployCollection';
import { sleep } from './utils/delay';
import { NftCollection } from './contracts/NftCollection';
import { BatchMint, IBatchMintItem } from './contracts/Batch';
import { ISaleExample } from './typescript/types';

export const collection = new NftCollection({
	ownerAddress: Address.parse('UQB_o2Ps2_wActUaQRBuYhE4bQX6-i34_nlbDKfoqX1eguj1'), // Указываем будущего владельца коллекции
	royaltyPercent: 0.1, // 0.1 = 10%
	royaltyAddress: Address.parse('UQB_o2Ps2_wActUaQRBuYhE4bQX6-i34_nlbDKfoqX1eguj1'), // Указываем кто будет получать royalty с продаж
	nextItemIndex: 0,
	collectionContentUrl: 'https://ahiles.strideton.com/static/json/collection.json', // Вставляем полную ссылку до collection.json (можно попробовать открыть в браузере - если открылся нужный файл, значит все ок)
	commonContentUrl: 'https://ahiles.strideton.com/static/json/', // Указываем просто хранение по протоколу ipfs без CID
});

// DeployCollection();
// createMintMessages(batchExample);
// sale(collection.address.toString(), saleExample);

async function DeployCollection() {
	await deployCollection(collection);
}

async function createMintMessages(items: IBatchMintItem[]) {
	const wallet = await openWallet();
	await BatchMint(collection.address, items, wallet.contract.address);
}

async function sale(collectionAddress: string, nftsToSale: ISaleExample[]) {
	const wallet = await openWallet();
	let seqno = await wallet.contract.getSeqno();
	console.log(`Начинаем выставление на продажу. seqno = ${seqno}`);

	for (let i = 0; i < nftsToSale.length; i += 4) {
		const batch = nftsToSale.slice(i, i + 4);

		seqno = await SaleContract(batch, wallet, seqno);
		await sleep(3000);
	}
}
