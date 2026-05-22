// here map any known alias to its canonical symbol 

export const ASSET_ALIASES: Record<string, string> = {
    BITCOIN: 'BTC',
    ETHEREUM: 'ETH',
    SOLANA: 'SOL',
    POLYGON: 'MATIC', 
    TETHER: 'USDT',
    CHAINLINK: 'LINK',

};


export const normaliseAsset = (raw: string): string => {
    const upper = raw.trim().toUpperCase();
    return ASSET_ALIASES[upper] ?? upper;
}