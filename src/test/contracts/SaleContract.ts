import { internal, beginCell, Cell, Address, toNano, storeStateInit, SendMode } from '@ton/ton';
import { openedWallet, testnet } from '../configs/network';
import { waitSeqno } from '../utils/delay';
import { type ISaleExample } from '../typescript/types';

// Эта функция используется для выставления нфт-контрактов на продажу
// Можно передать до 4 нфт адресов за раз, иначе будет получена ошибка при отправке транзакции
export const marketplaceAddress = testnet
	? Address.parse('kQBZp2tZ9WUZQP8AgL2gUHkdJQe-8NyAcFksn3L7dcZxYJkN')
	: Address.parse('EQBYTuYbLf8INxFtD8tQeNk5ZLy-nAX9ahQbG_yl1qQ-GEMS');
export const marketplaceFeeAddress = testnet
	? Address.parse('0QD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6xti')
	: Address.parse('EQCjk1hh952vWaE9bRguFkAhDAL5jj3xj9p0uPWrFBq_GEMS');
export const destinationAddress = testnet
	? Address.parse('kQDZwUjVjK__PvChXCvtCMshBT1hrPKMwzRhyTAtonUbL9i9')
	: Address.parse('EQAIFunALREOeQ99syMbO6sSzM_Fa1RsPD5TBoS0qVeKQ-AR');

export const NftFixPriceSaleV3R3CodeBoc =
	'te6ccgECDwEAA5MAART/APSkE/S88sgLAQIBYgIDAgLNBAUCASANDgL30A6GmBgLjYSS+CcH0gGHaiaGmAaY/9IH0gfSB9AGppj+mfmBg4KYVjgGAASpiFaY+F7xDhgEoYBWmfxwjFsxsLcxsrZBZjgsk5mW8oBfEV4ADJL4dwEuuk4QEWQIEV3RXgAJFZ2Ngp5OOC2HGBFWAA+WjKFkEINjYQQF1AYHAdFmCEAX14QBSYKBSML7y4cIk0PpA+gD6QPoAMFOSoSGhUIehFqBSkCH6RFtwgBDIywVQA88WAfoCy2rJcfsAJcIAJddJwgKwjhtQRSH6RFtwgBDIywVQA88WAfoCy2rJcfsAECOSNDTiWoMAGQwMWyy1DDQ0wchgCCw8tGVIsMAjhSBAlj4I1NBobwE+CMCoLkTsPLRlpEy4gHUMAH7AATwU8fHBbCOXRNfAzI3Nzc3BPoA+gD6ADBTIaEhocEB8tGYBdD6QPoA+kD6ADAwyDICzxZY+gIBzxZQBPoCyXAgEEgQNxBFEDQIyMsAF8sfUAXPFlADzxYBzxYB+gLMyx/LP8ntVOCz4wIwMTcowAPjAijAAOMCCMACCAkKCwCGNTs7U3THBZJfC+BRc8cF8uH0ghAFE42RGLry4fX6QDAQSBA3VTIIyMsAF8sfUAXPFlADzxYBzxYB+gLMyx/LP8ntVADiODmCEAX14QAYvvLhyVNGxwVRUscFFbHy4cpwIIIQX8w9FCGAEMjLBSjPFiH6Astqyx8Vyz8nzxYnzxYUygAj+gITygDJgwb7AHFwVBcAXjMQNBAjCMjLABfLH1AFzxZQA88WAc8WAfoCzMsfyz/J7VQAGDY3EDhHZRRDMHDwBQAgmFVEECQQI/AF4F8KhA/y8ADsIfpEW3CAEMjLBVADzxYB+gLLaslx+wBwIIIQX8w9FMjLH1Iwyz8kzxZQBM8WE8oAggnJw4D6AhLKAMlxgBjIywUnzxZw+gLLaswl+kRbyYMG+wBxVWD4IwEIyMsAF8sfUAXPFlADzxYBzxYB+gLMyx/LP8ntVACHvOFnaiaGmAaY/9IH0gfSB9AGppj+mfmC3ofSB9AH0gfQAYKaFQkNDggPlozJP9Ii2TfSItkf0iLcEIIySsKAVgAKrAQAgb7l72omhpgGmP/SB9IH0gfQBqaY/pn5gBaH0gfQB9IH0AGCmxUJDQ4ID5aM0U/SItlH0iLZH9Ii2F4ACFiBqqiU';

export async function SaleContract(nftsToSale: ISaleExample[], wallet: openedWallet, seqno: number): Promise<number> {
	const NftFixPriceSaleV3R3CodeCell = Cell.fromBoc(Buffer.from(NftFixPriceSaleV3R3CodeBoc, 'base64'))[0];
	const messages = [];

	for (let nft of nftsToSale) {
		const feesData = beginCell()
			.storeAddress(marketplaceFeeAddress)
			.storeCoins((toNano(nft.price) / BigInt(100)) * BigInt(5)) // Комиссия GetGems
			.storeAddress(wallet.contract.address)
			.storeCoins((toNano(nft.price) / BigInt(100)) * BigInt(10))
			.endCell();

		const saleData = beginCell()
			.storeBit(0)
			.storeUint(Math.round(Date.now() / 1000), 32)
			.storeAddress(marketplaceAddress)
			.storeAddress(Address.parse(nft.address))
			.storeAddress(wallet.contract.address)
			.storeCoins(toNano(nft.price))
			.storeRef(feesData)
			.storeUint(0, 32)
			.storeUint(0, 64)
			.endCell();

		const stateInitCell = beginCell()
			.store(storeStateInit({ code: NftFixPriceSaleV3R3CodeCell, data: saleData }))
			.endCell();

		const saleContractAddress = new Address(0, stateInitCell.hash());

		const saleBody = beginCell().storeUint(1, 32).storeUint(0, 64).endCell();

		const transferNftBody = beginCell()
			.storeUint(0x5fcc3d14, 32)
			.storeUint(0, 64)
			.storeAddress(destinationAddress)
			.storeAddress(wallet.contract.address)
			.storeBit(0)
			.storeCoins(toNano('0.2'))
			.storeBit(0)
			.storeUint(0x0fe0ede, 31)
			.storeRef(stateInitCell)
			.storeRef(saleBody)
			.endCell();

		messages.push(
			internal({
				to: nft.address,
				value: '0.3',
				body: transferNftBody,
			}),
		);
	}

	await wallet.contract.sendTransfer({
		secretKey: wallet.keyPair.secretKey,
		seqno: seqno,
		sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
		messages,
	});

	return await waitSeqno(seqno, wallet);
}
