const ccxt = require('ccxt');
const conf = require("./conf.js");
const mutex = require("./mutex.js");

let source_balances = null;

let queued_amount = 0; // positive on the buy side

console.log("conf.sourceApiKey" + conf.sourceApiKey);
let bittrex;


async function createMarketTx(side, size) {
	if (side === 'BUY')
		size += queued_amount;
	else
		size -= queued_amount;
	if (size < 0) { // flip the sides
		size = -size;
		side = (side === 'BUY') ? 'SELL' : 'BUY';
	}
	if (size < conf.MIN_SOURCE_ORDER_SIZE) {
		queued_amount = (side === 'BUY') ? size : -size;
		return console.log("amount " + size + " is less than source min order size, will queue");
	}
	queued_amount = 0;
	let unlock = await mutex.lock('source_balances');
	if (!conf.testnet){
	let m_resp = (side === 'BUY') 
		? await bittrex.createMarketBuyOrder('GBYTE/BTC', size)
		: await bittrex.createMarketSellOrder('GBYTE/BTC', size);
	} else {
		console.log("testnet - won't send order, side: " + side + " size: " + size);
	}
	console.error('---- m_resp', m_resp);
	source_balances = await bittrex.fetchBalance();	
	unlock();
}

async function getBalances() {
	let unlock = await mutex.lock('source_balances');
	unlock();
	return source_balances;
}

async function updateBalances() {
	let unlock = await mutex.lock('source_balances');
	try {
		source_balances = await bittrex.fetchBalance();
	}
	catch (e) {
		console.error("error from fetchBalance: " + e)
	}
	unlock();
}

async function start() {
	bittrex = new ccxt.bittrex({
		apiKey: conf.sourceApiKey,
		secret: conf.sourceApiSecret,
	});
	await updateBalances();
	setInterval(updateBalances, 60 * 1000);
}

exports.start = start;
exports.getBalances = getBalances;
exports.createMarketTx = createMarketTx;
