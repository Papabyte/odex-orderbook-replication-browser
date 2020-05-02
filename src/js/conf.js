exports.odex_ws_url = 'wss://odex.ooo/socket';
exports.odex_http_url = 'https://odex.ooo/api';
exports.hub_ws_url = 'wss://obyte.org/bb';
exports.MAX_PRICE_PRECISION = 8;
exports.aa_address = 'FVRZTCFXIDQ3EYRGQSLE5AMWUQF4PRYJ';
exports.mainnet_protocol = "obyte";
exports.testnet_protocol = "obyte-tn" ;

exports.MARKUP = (typeof process.env.MARKUP !== 'undefined') ? parseFloat(process.env.MARKUP) : 2; // %

exports.quote_currency = 'BTC_20200701';
exports.dest_pair = 'GBYTE/' + exports.quote_currency;

exports.MIN_QUOTE_BALANCE = 0.001;
exports.MIN_BASE_BALANCE = 0.01;

exports.MIN_DEST_ORDER_SIZE = 0.01; // in base currency
exports.MIN_SOURCE_ORDER_SIZE = 0.2; // in base currency
