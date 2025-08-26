import { Address, Cell, Dictionary, beginCell, internal, SendMode, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';
import { openedWallet, openWallet } from '../configs/network';

export interface IBatchMintItem {
	url: string; // Продолжение commonContentUrl, например 1.json | nftItem.json (т.к. commonContent уже содержит в себе https://domain.com/metadata/);
	owner?: string; // Адрес стартового владельца. Если не указан будет sender
}

export async function BatchMint(collectionAddress: Address, items: IBatchMintItem[], sender: Address) {
	const wallet = await openWallet();
	const nftMinStorage = '0.03';

	const getMethodResult = await wallet.client.runMethod(collectionAddress, 'get_collection_data');

	let nextItemIndex = getMethodResult.stack.readNumber();

	let counter = 0;
	const nftDict = Dictionary.empty<number, Cell>();

	for (let index = 0; index < items.length; index++) {
		const item = items[index];
		const metaCell = beginCell()
			.storeStringTail(item.url)
			.endCell();

		let newOwner: Address = sender;

		if (item.owner) {
			newOwner = Address.parse(item.owner)
		}

		const nftContent = beginCell().storeAddress(newOwner).storeRef(metaCell).endCell();
		nftDict.set(nextItemIndex, nftContent);
		nextItemIndex++;
		counter++;
	}

	const messageBody = beginCell()
		.storeUint(2, 32)
		.storeUint(0, 64)
		.storeDict(nftDict, Dictionary.Keys.Uint(64), {
			serialize: (src, builder) => {
				builder.storeCoins(toNano(nftMinStorage));
				builder.storeRef(src);
			},
			parse: (src) => {
				return beginCell().storeCoins(src.loadCoins()).storeRef(src.loadRef()).endCell();
			},
		})
		.endCell();

	const totalValue = String((counter * parseFloat(nftMinStorage) + 0.01 * counter).toFixed(6));

	const internalMessage = internal({
		to: collectionAddress,
		value: totalValue,
		bounce: true,
		body: messageBody,
	});

	const seqno = await wallet.contract.getSeqno();

	await wallet.contract.sendTransfer({
		seqno,
		secretKey: wallet.keyPair.secretKey,
		messages: [internalMessage],
		sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
	});
}
