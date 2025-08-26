import { IBatchMintItem } from "./contracts/Batch";
import { ISaleExample } from "./typescript/types";

export const batchExample: IBatchMintItem[] = [
	{
		url: '0.json',
		owner: 'UQAupoEGJMu5WjnhHWGMAaHvPXs72BY0I_erHKY_DaXVYErq',
	},
	{
		url: '1.json',
		owner: 'UQCMJINsOajgah-mKLHUk3EhohCUg4jeY2EV0jrHLbw06C6k',
	},
	{
		url: '3.json',
		// owner будет отправитель
	},
];

export const saleExample: ISaleExample[]= [
	{
		address: '',
		price: 1,
	},
];