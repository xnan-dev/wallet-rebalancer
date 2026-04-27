import fs from "fs";
import path from "path";
import { WALLETS_DIR } from "../src/config";

async function main() {
  const files = fs.readdirSync(WALLETS_DIR);

  for (const file of files) {
    // only process legacy monolithic .json files
    if (!file.endsWith(".json") || file.endsWith(".keystore.json") || file.endsWith(".metadata.json")) {
      continue;
    }

    const fullPath = path.join(WALLETS_DIR, file);
    const rawContent = fs.readFileSync(fullPath, "utf-8");
    let raw;
    try {
      raw = JSON.parse(rawContent);
    } catch {
      continue;
    }

    if (!raw.keystore) continue;

    const baseName = file.replace(".json", "");
    
    // Stringify the keystore payload exactly like ethers encrypt returns
    const keystoreContent = JSON.stringify(raw.keystore);
    const metaData = { ...raw };
    delete metaData.keystore;

    fs.writeFileSync(path.join(WALLETS_DIR, `${baseName}.keystore.json`), keystoreContent);
    fs.writeFileSync(path.join(WALLETS_DIR, `${baseName}.metadata.json`), JSON.stringify(metaData, null, 2));
    
    fs.unlinkSync(fullPath);
    console.log(`Migrated ${file} -> keystore and metadata split.`);
  }
}

main();
