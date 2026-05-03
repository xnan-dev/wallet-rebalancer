import { ethers } from "ethers";

export type Address = string;
export type Wei = bigint;

export type WalletBalance = {
  address: Address;
  name?: string;
  weight: number;
  balance: Wei; // ETH (native)
  assetBalances: Record<string, Wei>; // ERC20 tokens
};

export type RebalanceResult = {
  address: Address;
  name?: string;
  balance: Wei;
  target: Wei;
  delta: Wei;
  weight: number;
  totalWeight: number;
};

export type MultiAssetRebalanceResult = {
  asset: string;
  decimals: number;
  results: RebalanceResult[];
};


export type Transfer = {
  from: Address;
  fromName?: string;
  to: Address;
  toName?: string;
  amount: Wei;
  asset: string;
  decimals: number;
  contractAddress?: string;
};



export type LoadedWallet = {
  wallet: ethers.Signer;
  address: Address;
  name?: string;
  weight: number;
};

export type WalletMap = Record<Address, ethers.Wallet>;
  
export type AssetType = "native" | "erc20";

export interface ContractAsset {
  type: AssetType;
  decimals: number;
  address?: string;
}

export interface ContractConfig {
  network: string;
  assets: Record<string, ContractAsset>;
}