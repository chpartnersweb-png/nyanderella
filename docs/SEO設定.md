# にゃんデレラのSEO設定

本番URL： https://nyanderella.pages.dev/

## 実装内容

- `astro.config.mjs`の`site`で本番ドメインを指定。
- `src/data/site.ts`に検索向けタイトル・説明文を集約。
- `src/components/Seo.astro`でtitle・description・canonical・robots・OGP・X向け情報・JSON-LDを出力。
- 正規URLは本番ドメインとページのパスから生成。クエリやセクションのハッシュは含めない。
- OGP画像は既存の1200×630pxの`public/ogp.png`を使用し、画像URLを絶対URLに設定。
- JSON-LDはAnimalShelter・WebSite・WebPageを関連付け、名称・実写真・ロゴ・電話番号・所在地・地図・公式SNS等を指定。
- 公開情報が確定していない営業時間、料金帯、緯度経度、口コミ評価は追加していない。
- 既存の画像の代替テキスト、ヒーロー画像の優先読み込み、下部画像の遅延読み込みを維持。日本語フォントの先読みを追加。
- 指定されたローディング演出の表示時間と、画面デザインは維持。

## 検索向けの文言

タイトル：

> 保護猫ルーム にゃんデレラ｜赤羽・東京都北区の里親募集

説明文：

> 東京都北区・赤羽の「保護猫ルーム にゃんデレラ」。JR赤羽駅から徒歩10分、見学は完全予約制。里親募集中の猫との出会い、譲渡までの流れ・条件・費用、保護猫活動へのご支援をご案内します。

タイトルはHTMLのhead内に設定し、本文に地域名の断片を追加していない。

## 検索エンジン向けのファイル

Astroの静的エンドポイントで、ビルド時に次のファイルを生成する。

- `src/pages/robots.txt.ts` → https://nyanderella.pages.dev/robots.txt
- `src/pages/sitemap.xml.ts` → https://nyanderella.pages.dev/sitemap.xml

現状は1ページのLPのため、サイトマップにはトップページのみを掲載。架空の更新日時や優先度は付けていない。ページを追加した場合はサイトマップ側にも正式なURLを追加する。

## 公開後の作業

1. 通常のCloudflare Pagesの公開手順で変更を反映する。本番へ反映するにはAstroのビルド成果物が必要。
2. Google Search Consoleに`https://nyanderella.pages.dev/`をURLプレフィックスのプロパティとして登録し、所有権を確認する。確認用metaタグ・HTMLファイルはSearch Consoleが発行した実際の値を使用する。
3. Search Consoleのサイトマップ画面で`sitemap.xml`を送信する。
4. URL検査でトップページを確認し、インデックス登録をリクエストする。
5. 公開URLのrobots.txt・sitemap.xml・canonicalと、構造化データを確認する。

この作業では、公開先へのデプロイ、Search Consoleの登録・所有権確認・送信、検索順位の計測は実施していない。以前の指示に従い、実装後のビルド・表示確認・テストも実施していない。

## 参考

- [Astroのsite設定](https://docs.astro.build/en/reference/configuration-reference/#site)
- [Astroの静的エンドポイント](https://docs.astro.build/en/guides/endpoints/)
- [Googleの正規URLの指定](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Googleのサイトマップの作成と送信](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [GoogleのLocalBusiness構造化データ](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Schema.orgのAnimalShelter](https://schema.org/AnimalShelter)
