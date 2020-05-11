const ccxt = require('ccxt');
const conf = require("./conf.js");
const mutex = require("./mutex.js");

let source_balances = null;

let queued_amount = 0; // positive on the buy side
let queuedlowestPrice;
let queuedHighestPrice;

let intervalId;

let bittrex;
let vueEventBus;

async function createLimitTx(side, size, price) {

	if (side === 'BUY')
		size += queued_amount;
	else
		size -= queued_amount;
	if (size < 0) { // flip the sides
		size = -size;
		side = (side === 'BUY') ? 'SELL' : 'BUY';
	}

	if (!queuedlowestPrice || price < queuedlowestPrice)
		queuedlowestPrice = price;
	if (!queuedHighestPrice || price > queuedHighestPrice)
		queuedHighestPrice = price;

	const min_btc_value = conf.BITTREX_MIN_SIZE_ORDER_SAT / 10**8;
	const min_source_order_size = side === 'BUY' ? min_btc_value / queuedHighestPrice : min_btc_value / queuedlowestPrice;

	if (size < min_source_order_size) {
		queued_amount = (side === 'BUY') ? size : -size;
		return console.log("amount " + size + " is less than source min order size " + min_source_order_size + ", will queue");
	}

	queued_amount = 0;

	if (side === 'BUY'){
		let max_limit_buy_price = source_balances.free.BTC / size * 0.997; // Bittrex fees
		let limit_buy_price = queuedHighestPrice < max_limit_buy_price ? queuedHighestPrice : max_limit_buy_price;
		sendLimitOrderReliably(side, size, limit_buy_price, 3);
	} else {
		sendLimitOrderReliably(side, size, queuedlowestPrice, 3);
	}

	queuedlowestPrice = null;
	queuedHighestPrice = null;
	
	let unlock = await mutex.lock('source_balances');
	try {
		source_balances = await bittrex.fetchBalance();
	} catch (e) {
		console.log("error when feetching balance: " + e.toString());
	}

	if (vueEventBus)
		vueEventBus.$emit('source_balances', source_balances);
	unlock();
}


async function sendLimitOrderReliably(side, size, price, retry){

	if (conf.testnet) {
		vueEventBus.$emit('trade', {
			type: 'source',
			side,
			size,
			price,
			time: new Date(),
			status: 'testnet - fake',
		});
		console.log("tesnet won't send order side: " + side + ", size: " + size + ", price: " + price);
		return;
	}
	const delayInSeconds = 10;
	try {
		if (side == 'BUY')
			await bittrex.createLimitBuyOrder('GBYTE/BTC', size, price);
		else
			await bittrex.createLimitSellOrder('GBYTE/BTC', size, price);
	} catch(e){
		vueEventBus.$emit('trade', {
			type: 'source',
			side,
			size,
			price,
			time: new Date(),
			status: retry > 0 ? 'failed - will retry' : 'failed - abandoned',
			error: e
		});
		if (retry > 0)
			setTimeout(function(){
				retry--;
				sendLimitOrderReliably(side, size, price, retry);
			}, delayInSeconds * 1000)
		return;
	}
	vueEventBus.$emit('trade', {
		type: 'source',
		side,
		size,
		price,
		time: new Date(),
		status: 'placed'
	});
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
	if (vueEventBus)
		vueEventBus.$emit('source_balances', source_balances);
	unlock();
}

async function start(_vueEventBus) {
	vueEventBus = _vueEventBus;
	bittrex = new ccxt.bittrex({
		apiKey: conf.sourceApiKey,
		secret: conf.sourceApiSecret,
	});
	await updateBalances();
	intervalId = setInterval(updateBalances, 60 * 1000);
}

function stop(){
	clearInterval(intervalId);
	
}

exports.start = start;
exports.stop = stop
exports.getBalances = getBalances;
exports.createLimitTx = createLimitTx;
