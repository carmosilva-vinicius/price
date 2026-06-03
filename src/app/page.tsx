import { AssetRadar } from "@/components/AssetRadar";
import { listAssetRows } from "@/lib/services/assets";
import styles from "./page.module.css";

export default function Home() {
  const assets = listAssetRows();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Preco-Teto Barsi</h1>
          <p>Radar local para comparar cotacao, dividendos e margem de seguranca.</p>
        </div>
      </header>
      <AssetRadar initialAssets={assets} />
    </main>
  );
}
