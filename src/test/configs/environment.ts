import dotenv from 'dotenv';
dotenv.config();

if (!process.env.WALLET_MNEMONIC || !process.env.TONCENTER_API_KEY) {
	throw new Error('Необходимо заполнить .env\nПример заполнения можно найти в .env.example');
}

export const walletMnemonic = process.env.WALLET_MNEMONIC;
export const toncenterApiKey = process.env.TONCENTER_API_KEY;
