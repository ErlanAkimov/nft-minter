import { Address, internal, Cell, beginCell, contractAddress, StateInit, SendMode, toNano } from '@ton/ton';
import { encodeOffChainContent } from '../utils/utils';
import { OpenedWallet } from '../typescript/types';
import { CollectionDataInterface, mintParams } from '../typescript/types';
import { waitSeqno } from '../utils/delay';

export class NftCollection {
	private collectionData: CollectionDataInterface;

	constructor(collectionData: CollectionDataInterface) {
		this.collectionData = collectionData;
	}

	private createCodeCell(): Cell {
		const CollectionCodeBoc =
			'te6cckECFAEAAh8AART/APSkE/S88sgLAQIBYgkCAgEgBAMAJbyC32omh9IGmf6mpqGC3oahgsQCASAIBQIBIAcGAC209H2omh9IGmf6mpqGAovgngCOAD4AsAAvtdr9qJofSBpn+pqahg2IOhph+mH/SAYQAEO4tdMe1E0PpA0z/U1NQwECRfBNDUMdQw0HHIywcBzxbMyYAgLNDwoCASAMCwA9Ra8ARwIfAFd4AYyMsFWM8WUAT6AhPLaxLMzMlx+wCAIBIA4NABs+QB0yMsCEsoHy//J0IAAtAHIyz/4KM8WyXAgyMsBE/QA9ADLAMmAE59EGOASK3wAOhpgYC42Eit8H0gGADpj+mf9qJofSBpn+pqahhBCDSenKgpQF1HFBuvgoDoQQhUZYBWuEAIZGWCqALnixJ9AQpltQnlj+WfgOeLZMAgfYBwGyi544L5cMiS4ADxgRLgAXGBEuAB8YEYGYHgAkExIREAA8jhXU1DAQNEEwyFAFzxYTyz/MzMzJ7VTgXwSED/LwACwyNAH6QDBBRMhQBc8WE8s/zMzMye1UAKY1cAPUMI43gED0lm+lII4pBqQggQD6vpPywY/egQGTIaBTJbvy9AL6ANQwIlRLMPAGI7qTAqQC3gSSbCHis+YwMlBEQxPIUAXPFhPLP8zMzMntVABgNQLTP1MTu/LhklMTugH6ANQwKBA0WfAGjhIBpENDyFAFzxYTyz/MzMzJ7VSSXwXiN0CayQ==';

		return Cell.fromBase64(CollectionCodeBoc);
	}

	private createDataCell(): Cell {
		const data = this.collectionData;
		const dataCell = beginCell();
		dataCell.storeAddress(data.ownerAddress);
		dataCell.storeUint(data.nextItemIndex, 64);

		const contentCell = beginCell()
		.storeRef(encodeOffChainContent(data.collectionContentUrl))
		.storeRef(beginCell().storeBuffer(Buffer.from(data.commonContentUrl)).asCell())

		dataCell.storeRef(contentCell);

		const NftCodeCell = Cell.fromBase64(
			'te6cckECDQEAAdAAART/APSkE/S88sgLAQIBYgMCAAmhH5/gBQICzgcEAgEgBgUAHQDyMs/WM8WAc8WzMntVIAA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAgEgCQgAET6RDBwuvLhTYALXDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAw8AIEs44UMGwiNFIyxwXy4ZUB+kDUMBAj8APgBtMf0z+CEF/MPRRSMLqOhzIQN14yQBPgMDQ0NTWCEC/LJqISuuMCXwSED/LwgCwoAcnCCEIt3FzUFyMv/UATPFhAkgEBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AAH2UTXHBfLhkfpAIfAB+kDSADH6AIIK+vCAG6EhlFMVoKHeItcLAcMAIJIGoZE24iDC//LhkiGOPoIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHlBAqN1viDACCAo41JvABghDVMnbbEDdEAG1xcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wCTMDI04lUC8ANqhGIu',
		);
		dataCell.storeRef(NftCodeCell);

		const royaltyBase = 1000;
		const royaltyFactor = Math.floor(data.royaltyPercent * royaltyBase);

		const royaltyCell = beginCell();
		royaltyCell.storeUint(royaltyFactor, 16);
		royaltyCell.storeUint(royaltyBase, 16);
		royaltyCell.storeAddress(data.royaltyAddress);
		dataCell.storeRef(royaltyCell);

		return dataCell.endCell();
	}

	public get stateInit(): StateInit {
		const code = this.createCodeCell();
		const data = this.createDataCell();

		return { code, data };
	}

	public get address(): Address {
		return contractAddress(0, this.stateInit);
	}

	public async deploy(wallet: OpenedWallet, value: string) {
		const seqno = await wallet.contract.getSeqno();
		await wallet.contract.sendTransfer({
			seqno,
			secretKey: wallet.keyPair.secretKey,
			messages: [
				internal({
					value,
					to: this.address,
					init: this.stateInit,
				}),
			],
			sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
		});

		await waitSeqno(seqno, wallet);
	}

	public createMintBody(params: mintParams): Cell {
		const body = beginCell();
		body.storeUint(1, 32);
		body.storeUint(params.queryId || 0, 64);
		body.storeUint(params.itemIndex, 64);
		body.storeCoins(toNano(Number(params.amount) - 0.02));

		const uriContent = beginCell().storeBuffer(Buffer.from(params.commonContentUrl)).endCell();

		const nftItemContent = beginCell();

		nftItemContent.storeAddress(params.itemOwnerAddress);
		nftItemContent.storeRef(uriContent);

		body.storeRef(nftItemContent.endCell());
		return body.endCell();
	}
}
