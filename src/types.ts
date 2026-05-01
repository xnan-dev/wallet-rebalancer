import { ethers } from "ethers";

export type Address = string;
export type Wei = bigint;

export type WalletBalance = {
  address: Address;
  name?: string;
  weight: number;
  balance: Wei;
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

export type Transfer = {
  from: Address;
  fromName?: string;
  to: Address;
  toName?: string;
  amount: Wei;
};

export type LoadedWallet = {
  wallet: ethers.Signer;
  address: Address;
  name?: string;
  weight: number;
};

export type WalletMap = Record<Address, ethers.Wallet>;