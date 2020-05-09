exports.MAX_PRICE_PRECISION = 8;
exports.aa_address = 'FVRZTCFXIDQ3EYRGQSLE5AMWUQF4PRYJ';
exports.mainnet_protocol = "obyte";
exports.testnet_protocol = "obyte-tn" ;

exports.LIMIT_MARGIN =  (typeof process.env.MARKUP !== 'undefined') ? parseFloat(process.env.MARKUP) : 5; // %
exports.quote_currency = 'BTC_20200701';

exports.MIN_QUOTE_BALANCE = 0.001;
exports.MIN_BASE_BALANCE = 0.01;

exports.MIN_DEST_ORDER_SIZE = 0.01; // in base currency
exports.MIN_SOURCE_ORDER_SIZE = 0.2; // in base currency
exports.BITTREX_MIN_SIZE_ORDER_SAT = 50000;