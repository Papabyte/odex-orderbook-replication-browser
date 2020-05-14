# odex-orderbook-replication-browser

This bot is a browser application that replicates orders from Bittrex BTC-GBYTE to a BTC [discount stablecoin](https://ostable.org/) traded on an [Odex](odex.ooo) decentralized exchange. When an order is filled on Odex, its opposite is immediately placed on Bittrex. A markup is configurable to enable some profits.

This bot and its source code are offered as is, without any guarantees of its correct operation. The bot might lose money because of bugs, unreliable network connections, and other reasons.

## Run locally (recommended)

The bot can be bundled from source and run from a local webserver. It's recomended since you can check the source code you actually run.

Install Nodejs in a version from 8 to 10.

```
git clone https://github.com/Papabyte/odex-orderbook-replication-browser.git
``` 

```
cd odex-orderbook-replication-browser
```

```
npm install
```

```
npm run serve
```

The bot can then be opened on your browser at address http://localhost:8080

## Run as demo

This bot is available ready to use on [replibot.papabyte.com](https://replibot.papabyte.com)



## CORS-anywhere browser extension

This application will work only if your browser is configured to bypass [CORS rules](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
We recommend to use Firefox and install [cors-everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/) extension. Don't enable CORS for every websites but whitelist only http://localhost:8080 or replibot.papabyte.com


## Usage

- Create an API access ('READ INFO' and 'TRADE') from your Bittrex account and fill the configuration form with the key and the secret.
- Generate a WIF with a [command line tool](https://obytejs.com/utils/generate-wallet) or [online](https://bonustrack.github.io/obyte-paperwallet/) and paste it into the form, the control address that will be used to sign your orders should appear.
- Log into [Odex](https://odex.ooo) exchange with your Obyte GUI wallet and deposit GBYTE and BTC stablecoin
- Set your Odex account exchange as owner addess then grant your control address the roght to trade on Odex account
- Set the minimum balances you want to keep on exchanges and your markup
- Ensure CORS is enabled by CORS-anywhere extension
- Start the bot 