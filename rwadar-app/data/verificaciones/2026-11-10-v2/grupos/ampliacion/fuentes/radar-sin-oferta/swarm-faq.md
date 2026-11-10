> For the complete documentation index, see [llms.txt](https://docs.swarm.com/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.swarm.com/getting-started/faq.md).

# FAQ

**What is Swarm?**

Swarm is a blockchain platform that brings unique tokenization and trading solutions to the world of traditional finance. Day to day, we work with real-world-asset owners to tokenize collateral and build trading infrastructure in a compliant way.&#x20;

Swarm is the first organization in the world to offer tokenized US Treasury bills and public stocks that are tradable on a complient and decentralized platform.

**Who is Swarm for?**

Our platform opens up new opportunities for retail investors and institutional market participants, such as banks, hedge funds, broker-dealers, asset managers and alternative investment industries, such as real estate, tech secondaries, carbon and music, as well as retail investors.&#x20;

Those already on-chain, from stablecoin issuers to treasury managers can also use our platform to deploy into less risky assets.&#x20;

Any individual or organization who wishes to onboard to Swarm must meet our Know Your Customer (KYC) and Anti-Money Laundering (AML) standards

**What makes Swarm different?**

We can integrate blockchain with financial markets because we are designed around compliance.

Our hybrid model combines the advantages of blockchain-trading with the trust and asset-range typically enjoyed by traditional exchanges.

#### How risky is it to invest in stock and bond ETF tokens?[​](https://docs.ondo.finance/faq#how-risky-is-it-to-invest-in-ondo-funds)

All investment carries risk. Swarm offers investment opportunities in traditional asset classes that benefit from deep liquidity and robust price discovery. In a high interest environment, the short term US t-bills that are available on Swarm can yield up to 4.5%, which is variable.

#### How does Swarm make money?[​](https://docs.ondo.finance/faq#how-does-ondo-make-money)

Swarm generates revenue through issuance and redemption fees for RWAs.

**Do I need crypto to buy tokenized securities on Swarm?**

Users will need to purchase security tokens using USDC on Polygon.

**Can I buy these tokens with fiat?**

Not yet, Swarm may release this functionality in subsequent releases. &#x20;

#### How long does it take for me to receive USDC when I redeem?[​](https://docs.ondo.finance/faq#how-long-does-it-take-for-me-to-receive-usdc-when-i-redeem)

Redemptions will be processed once requests reach a value of $100k in aggregate. This policy will be reviewed, as volume grows on the platform.

Once the redemption request has settled, USDC will be distributed. Alternatively, users can place an offer against any listed asset on Swarm, using the decentralized over-the-counter (dOTC) smart contract, which can be taken by any user on the platform.

#### How do I "know" my tokens are truly backed by real world assets?[​](https://docs.ondo.finance/faq#how-do-i-know-my-tokens-are-truly-backed-by-an-etf)

The tokens are 100% backed by real stocks and bond ETFs bought in traditional financial markets. Underlying assets are held by institutional custodians and verified by the token trustee.

The tokenization process is monitored step-by-step by a Token-Trustee, which involves tracking the delivery of the respective underlying into the custody account. Subsequently, the Token-Trustee confirms the minting and issuance of corresponding tokens.

Tokens can be redeemed for the value of the underlying asset at any time and monthly disclosures of assets in reserve will be made publicly available. Swarm is working towards a real-time asset verification model.

**Can the real underlying assets be registered in my name?**

Presently we don't have a license to transfer real underlying stocks directly to token holders. The current redemption process transfers you the value of the stocks at the time of redemption, in USDC.&#x20;

**What are the risks of DeFi?**

While decentralized finance and AMMs have been somewhat battle tested, they are very new protocol technologies. Swarm is introducing new layers that could introduce both additional risk and de-risk in certain use cases. We are taking every precaution and doing[ extensive audits](https://app.gitbook.com/@swarm/s/swarm-markets/reference/smart-contracts/smart-contract-audit).

**Is Swarm decentralized?**

Swarm makes every effort to be as trustless as possible. The core protocol is built on open and battle-tested code.

#### **Are there any limitations on using Swarm ?** <a href="#limitations" id="limitations"></a>

Transacting on Swarm is currently not available for US persons (as defined[ here](https://en.wikipedia.org/wiki/United_States_person)) or persons that hold identities from other countries not serviced. US persons and users from non-serviced countries may connect a wallet and view their assets, but will not be able to set up a trading account.

Swarm is currently available to users resident in Argentina, Armenia, Australia, Austria, Azerbaijan, Belgium, Bermuda, Brazil, Canada (crypto only), Cayman, Chile, China, Cyprus, Czech Republic, Denmark, Estonia, Eswatini (formerly Swaziland), Finland, France, Germany, Gibraltar, Greece, Hong Kong, Hungary, Iceland, India, Indonesia, Ireland, Israel, Italy, Jamaica, Japan, Jersey, Latvia, Liechtenstein, Lithuania, Luxembourg, Macau, Macedonia, Malaysia, Malta, Mauritius, Mexico, Netherlands, New Zealand, Norway, Peru, Poland, Portugal, Romania, Singapore, Slovakia, Slovenia, South Korea, Spain, Sweden, Switzerland, Taiwan, Thailand, Turkey, Ukraine, United Arab Emirates (UAE), United Kingdom (UK), and Uruguay.&#x20;

**What is Swarm useful for?**

Firstly, to serve any market participants who value the core benefits of DeFi (self-custody, transparency, participation), but want to remain compliance confident and keep their digital assets future-proof

Secondly, on the basis of Swarm's compliant protocol layer, entirely new financial products can be launched and offered, extending DeFi pretty much to any financial asset and to integrate with financial institutions.

**I do not have crypto. Where do I start?**

To use Swarm you will need to have at least one of the supported assets in your connected wallet. A good place to start is with USDC, Ethereum (ETH) or Dai Stablecoin (DAI).&#x20;

**Why is the platform not working?**

If you have trouble loading the platform, connecting your Web3 wallet ,or any other kind of loading issues, please check the security settings and tracking blockers that your browser might be using. Some of these services block necessary Javascript needed to run the Swarm platform properly.&#x20;

We recommend disabling enhanced tracking protections (including any adblockers) for our web app only so that other tracking protection is unaffected for other internet browsing. No cross-site tracking, cryptominers, or any hidden software are implemented on the platform web app.

**Why might my transaction be expected to fail?**

If you receive a general error message that your swap is expected to fail, it may be due to:

* Authorization not yet set: If you just completed Quickstart onboarding, please allow the protocol a minute or two to authorize your address on the blockchain. You will receive an email as soon as this is complete.

**What are proxy contracts and atomic transactions?**

Swarm uses proxy contracts to save you gas fees when transacting. Creating your proxy address adds a little gas to your first transaction but results in lower fees and a better user experience over time.

When making your first transaction via the platform, the Swarm protocol checks whether you have previously deployed a proxy contract. If you have not, the platform creates one for you, bundling this into your first transaction.

Your proxy contract is a[ Gnosis Safe](https://gnosis-safe.io) and can be used with any Gnosis Safe Application. Proxy contracts allow complex multi-step transactions to be batched into a single, atomic one, requiring only a single verification. An atomic transaction will revert if any part of the transaction is expected to fail so you won’t be charged any gas fees for a failed transaction. This saves you money over time and improves the user experience by making transactions much simpler.&#x20;

Proxy contracts also hold your wrapped assets and pool tokens, saving you the gas fees that would otherwise be charged by transferring these assets to your primary wallet address.

Note: your proxy contract is created, owned, and controlled by your connected primary wallet address. No other address can instruct your proxy in any way.

**Why is there a balance in my proxy address?**

Some platform transactions can result in a small percentage of your assets remaining in your proxy address. This occurs when there is a difference between the estimated amount of asset being transacted and the actual amount used when the transaction is mined.

**How do I use or claim the balance in my proxy address?**

When swapping or interacting with liquidity pools, the platform will automatically use any relevant balances from your proxy address before withdrawing funds from your user address. Therefore, the simplest way to minimize the balance in your proxy address is by transacting. You will always have the option to simply claim your entire proxy balance through your platform[ Wallet](https://app.swarm.com/wallets) at any time. In the meantime, balances in the proxy wallet count towards rewards calculations.

\
\ <br>


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://docs.swarm.com/getting-started/faq.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
