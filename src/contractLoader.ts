import fs from "fs";
import { ContractConfig } from "./types";

/**
 * Loads the contract configuration from a JSON file.
 * @param filePath Path to the contracts JSON file.
 * @returns Strongly typed ContractConfig object.
 */
export function loadContractConfig(filePath: string): ContractConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Contract config file not found at: ${filePath}`);
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as ContractConfig;
    
    // Basic validation to ensure the structure matches what we expect
    if (!parsed.network || !parsed.assets) {
      throw new Error("Invalid contract config format: missing 'network' or 'assets'");
    }

    return parsed;
  } catch (error) {
    throw new Error(`Failed to load or parse contract config: ${error instanceof Error ? error.message : String(error)}`);
  }
}
