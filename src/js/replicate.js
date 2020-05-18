/*jslint node: true */
'use strict';
const odex = require('odex-client-browser');
const Bittrex_ws = require("./bittrex-ws/client.js");
const conf = require("./conf");
const mutex = require("./mutex.js");
const source = require("./source");

let orders, ws_api, balances, bittrex_ws_client, exchange;

let assocSourceBids = {};
let assocSourceAsks = {};
let assocDestOrdersBySourcePrice = {};
let bExiting = false;
let bStarted = false;
let vueEventBus;
let assocCheckCancellingTimerIds = {};
let assocOrdersToBeCancelled = {};

function getDestOrderByHash(hash) {
	for (let source_price in assocDestOrdersBySourcePrice) {
		let dest_order = assocDestOrdersBySourcePrice[source_price];
		if (dest_order.hash === hash){
			return dest_order;
		}
	}
	return null;
}

async function cancelAllTrackedDestOrders() {
	console.log("will cancel " + Object.keys(assocDestOrdersBySourcePrice).length + " tracked dest orders");
	let lastError = null;
	for (let source_price in assocDestOrdersBySourcePrice) {
		let dest_order = assocDestOrdersBySourcePrice[source_price];
		console.log("cancelling order " + dest_order.hash);
		delete assocDestOrdersBySourcePrice[source_price];
		await cancelOrderAndCheckLater(dest_order.hash);

	}
	return lastError;
}

async function cancelAllDestOrders() {
	console.log("will cancel " + Object.keys(orders.assocMyOrders).length + " dest orders");
	for (let hash in orders.assocMyOrders){
		await cancelOrderAndCheckLater(hash);
	}
}

async function createOrReplaceDestOrder(side, size, source_price) {
	let dest_order = assocDestOrdersBySourcePrice[source_price];
	if (dest_order) {
		if (dest_order.size === 0)
			throw Error("0-sized dest order " + dest_order.hash);
		if (dest_order.size === size) // unchanged
			return console.log("order " + size + " GB at source price " + source_price + " already exists");
		// size changed, cancel the old order first
		console.log("will cancel previous " + side + " order at source price " + source_price + " hash " + dest_order.hash);
		delete assocDestOrdersBySourcePrice[source_price];
		await cancelOrderAndCheckLater(dest_order.hash);
	}
	let sign = (side === 'BUY') ? -1 : 1;
	let dest_price = parseFloat(source_price) * (1 + sign * conf.markup / 100);
	console.log("will place " + side + " order for " + size + " GB at " + dest_price + " corresponding to source price " + source_price);
	let hash = await orders.createAndSendOrder(conf.dest_pair, side, size, dest_price);
	if (hash) {
		console.log("sent order " + hash);
		assocDestOrdersBySourcePrice[source_price] = { hash, size, price: source_price };
	} else {
		console.log("send order failed");
	}
}

async function createDestOrders(arrNewOrders) {
	for (let i = 0; i < arrNewOrders.length; i++){
		let { size, source_price, side } = arrNewOrders[i];
		await createOrReplaceDestOrder(side, size, source_price);
	}
}

// returns true if a previous order not exists or is different and was cancelled
async function cancelPreviousDestOrderIfChanged(side, size, source_price) {
	let dest_order = assocDestOrdersBySourcePrice[source_price];
	if (!dest_order)
		return true;
	if (dest_order.size === 0)
		throw Error("0-sized dest order " + dest_order.hash);
	if (dest_order.size === size) { // unchanged
		console.log("order " + size + " GB at source price " + source_price + " already exists");
		return false;
	}
	// size changed, cancel the old order first
	console.log("will cancel previous " + side + " order at source price " + source_price);
	await cancelOrderAndCheckLater(dest_order.hash);
	return true; // order cancelled or modified
	//return true;
}

async function cancelDestOrder(source_price) {
	let dest_order = assocDestOrdersBySourcePrice[source_price];
	if (dest_order) {
		
		console.log("will cancel order " + dest_order.hash + " at source price " + source_price);
		delete assocDestOrdersBySourcePrice[source_price];
		await cancelOrderAndCheckLater(dest_order.hash);
	} //else
	//	console.log("no dest order at source price " + source_price);
}


async function updateDestBids(bids) {
	let unlock = await mutex.lock('bids');
	let dest_balances = await balances.getBalances();
	vueEventBus.$emit('dest_balances', dest_balances);
	let source_balances = await source.getBalances();
	console.error('dest balances', dest_balances);
	let tokensBysymbols = exchange.getTokensBySymbol();
	let quoteDecimals = tokensBysymbols[conf.destination_quote].decimals;
	let { matcherFee } = exchange.getFees(conf.destination_quote);
	let dest_quote_balance_available = (dest_balances[conf.destination_quote] * (1 - matcherFee) || 0)/ (10**quoteDecimals) - conf.min_quote_balance;
	let source_base_balance_available = (source_balances.free.GBYTE  || 0) - conf.min_base_balance - 0.0001;
	let arrNewOrders = [];
	let bDepleted = (dest_quote_balance_available <= 0 || source_base_balance_available <= 0);
	for (let i = 0; i < bids.length; i++){
		let bid = bids[i];
		let source_price = bid.price;
		if (bDepleted) { // cancel all remaining orders to make sure we have enough free funds for other orders
			await cancelDestOrder(source_price);
			continue;
		}
		let size = parseFloat(bid.size);
		if (size > source_base_balance_available) {
			bDepleted = true;
			console.log("bid #" + i + ": " + size + " GB at " + source_price + " but have only " + source_base_balance_available + " GB available on source");
			size = source_base_balance_available;
		}
		let dest_price = parseFloat(source_price) * (1 - conf.markup / 100);
		let dest_quote_amount_required = size * dest_price;
		if (dest_quote_amount_required > dest_quote_balance_available) {
			bDepleted = true;
			console.log("bid #" + i + ": " + size + " GB at " + source_price + " requires " + dest_quote_amount_required + " BTC on dest but have only " + dest_quote_balance_available + " BTC available on dest");
			dest_quote_amount_required = dest_quote_balance_available;
			size = dest_quote_amount_required / dest_price;
		}
		// cancel the old order first, otherwise if it was downsized and made up more room for other orders, we might hit insufficient balance error when we try to place them
		let bNeedNewOrder = await cancelPreviousDestOrderIfChanged('BUY', size, source_price);
		if (bNeedNewOrder && size >= conf.MIN_DEST_ORDER_SIZE)
			arrNewOrders.push({ size, source_price, side: 'BUY' });
		if (size >= conf.MIN_DEST_ORDER_SIZE) {
			source_base_balance_available -= size;
			dest_quote_balance_available -= dest_quote_amount_required;
		}
		else
			console.log("skipping bid " + size + " GB at " + source_price + " as it is too small");
	}
	unlock();
	return arrNewOrders;
}

async function updateDestAsks(asks) {
	let unlock = await mutex.lock('asks');
	let dest_balances = await balances.getBalances();
	vueEventBus.$emit('dest_balances', dest_balances);
	let source_balances = await source.getBalances();
	let dest_base_balance_available = (dest_balances.GBYTE || 0)/1e9 - conf.min_base_balance - 0.0001;
	let source_quote_balance_available = (source_balances.free.BTC || 0) - conf.min_quote_balance;
	let arrNewOrders = [];
	let bDepleted = (dest_base_balance_available <=0 || source_quote_balance_available <= 0);
	for (let i = 0; i < asks.length; i++){
		let ask = asks[i];
		let source_price = ask.price;
		if (bDepleted) { // cancel all remaining orders to make sure we have enough free funds for other orders
			await cancelDestOrder(source_price);
			continue;
		}
		let size = parseFloat(ask.size);
		if (size > dest_base_balance_available) {
			bDepleted = true;
			console.log("ask #" + i + ": " + size + " GB at " + source_price + " but have only " + dest_base_balance_available + " GB available on dest");
			size = dest_base_balance_available;
		}
		let source_quote_amount_required = size * parseFloat(source_price);
		if (source_quote_amount_required > source_quote_balance_available) {
			bDepleted = true;
			console.log("ask #" + i + ": " + size + " GB at " + source_price + " requires " + source_quote_amount_required + " BTC on source but have only " + source_quote_balance_available + " BTC available on source");
			source_quote_amount_required = source_quote_balance_available;
			size = source_quote_amount_required / parseFloat(source_price);
		}
		// cancel the old order first, otherwise if it was downsized and made up more room for other orders, we might hit insufficient balance error when we try to place them
		let bNeedNewOrder = await cancelPreviousDestOrderIfChanged('SELL', size, source_price);
		if (bNeedNewOrder && size >= conf.MIN_DEST_ORDER_SIZE)
			arrNewOrders.push({ size, source_price, side: 'SELL' });
		if (size >= conf.MIN_DEST_ORDER_SIZE) {
			source_quote_balance_available -= source_quote_amount_required;
			dest_base_balance_available -= size;
		}
		else
			console.log("skipping ask " + size + " GB at " + source_price + " as it is too small");
	}
	unlock();
	return arrNewOrders;
}

async function scanAndUpdateDestBids() {
	let bids = [];
	for (let price in assocSourceBids)
		bids.push({ price, size: assocSourceBids[price] });
	bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
	console.log("will update bids");
	return await updateDestBids(bids);
}

async function scanAndUpdateDestAsks() {
	let asks = [];
	for (let price in assocSourceAsks)
		asks.push({ price, size: assocSourceAsks[price] });
	asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
	console.log("will update asks");
	return await updateDestAsks(asks);
}

async function onSourceOrderbookSnapshot(snapshot) {
	console.error('received snapshot');
	assocSourceBids = {};
	assocSourceAsks = {};
	let arrOrdersToBeCancelled = [];

	try {
		snapshot.data.bids.forEach(bid => {
			assocSourceBids[bid.price] = bid.size;
		});
		snapshot.data.asks.forEach(ask => {
			assocSourceAsks[ask.price] = ask.size;
		});
		// in case a secondary (non-initial) snapshot is received, we need to check if we missed some updates
		for (let source_price in assocDestOrdersBySourcePrice) {
			if (!assocSourceBids[source_price] && !assocSourceAsks[source_price]) {
				console.log("order at " + source_price + " not found in new snapshot from source, will cancel on dest");
		//		await cancelDestOrder(source_price);
			arrOrdersToBeCancelled.push(source_price);

			}
		}
	} catch(e){
		console.log('failed onSourceOrderbookSnapshot ' + e.toString());
	}

	if (ws_api.isConnected()){
		for (var i = 0; i< arrOrdersToBeCancelled.length; i++) 
			cancelDestOrder(arrOrdersToBeCancelled[i]);
		let unlock = await mutex.lockOrSkip('update');
		let arrNewBuyOrders = await updateDestBids(snapshot.data.bids);
		let arrNewSellOrders = await updateDestAsks(snapshot.data.asks);
		await createDestOrders(arrNewBuyOrders.concat(arrNewSellOrders));
		unlock();
	}
}

async function onSourceOrderbookUpdate(update) {
	let arrNewBuyOrders = [];
	let arrNewSellOrders = [];
	let arrOrdersToBeCancelled = [];
	try { // we will catch error if object received is badly formatted
		if (update.data.bids.length > 0) {
			for (let i = 0; i < update.data.bids.length; i++) {
				let bid = update.data.bids[i];
				let size = parseFloat(bid.size);
				if (size === 0) {
					console.log("bid at " + bid.price + " removed from source, will cancel on dest");
					delete assocSourceBids[bid.price];
					arrOrdersToBeCancelled.push(bid.price);
				}
				else
					assocSourceBids[bid.price] = bid.size;
			}
		}
		if (update.data.asks.length > 0) {
			for (let i = 0; i < update.data.asks.length; i++) {
				let ask = update.data.asks[i];
				let size = parseFloat(ask.size);
				if (size === 0) {
					console.log("ask at " + ask.price + " removed from source, will cancel on dest");
					delete assocSourceAsks[ask.price];
					arrOrdersToBeCancelled.push(ask.price);
				}
				else
					assocSourceAsks[ask.price] = ask.size;
			}
		}
	} catch (e){
		console.log("Failed onSourceOrderbookUpdate " + e.toString())
		return;
	}

	if (ws_api.isConnected()){
		for (var i = 0; i< arrOrdersToBeCancelled.length; i++)
			cancelDestOrder(arrOrdersToBeCancelled[i]);
		let unlock = await mutex.lockOrSkip('update');
		arrNewBuyOrders = await scanAndUpdateDestBids();
		arrNewSellOrders = await scanAndUpdateDestAsks();
		// we cancel all removed/updated orders first, then create new ones to avoid overlapping prices and self-trades
		await createDestOrders(arrNewBuyOrders.concat(arrNewSellOrders));
		unlock();
	}
}

let onResetOrdersSet = false;

async function onDestDisconnect() {
	vueEventBus.$emit('onDestDisconnect');
	if (onResetOrdersSet){
		return console.log('onResetOrdersSet already set')
	}
	console.log("will cancel all dest orders after disconnect");

	ws_api.once('reset_orders', onResetOrders);
	onResetOrdersSet = true;
	async function onResetOrders(){
		console.log("reset_orders: will cancel all my dest orders after reconnect");
		await cancelAllTrackedDestOrders(); // this will be actually executed after reconnect
		assocDestOrdersBySourcePrice = {};
		console.log("done cancelling all my dest orders after reconnect");
		await ws_api.subscribeOrdersAndTrades(conf.dest_pair);
		await scanAndUpdateDestBids();
		await scanAndUpdateDestAsks();
		console.log("done updating dest orders after reconnect");
		onResetOrdersSet = false;
		unlock();
	}

	let unlock = await mutex.lock('update');
	console.log("got lock to cancel all dest orders after disconnect");
}


async function onDestTrade(matches) {
	console.log("dest trade", JSON.stringify(matches, null, '\t'));
	let size = 0;
	let averagePrice;
	let lowestPrice;
	let highestPrice;
	let side;
	let role;

	for (let i = 0; i < matches.trades.length; i++){
		let trade = matches.trades[i];
		let dest_order = getDestOrderByHash(trade.makerOrderHash);
		if (dest_order) {
			if (role && role !== 'maker')
				throw Error("self-trade?");
			if (dest_order.filled)
				continue;
			role = 'maker';
			side = matches.makerOrders[i].side;
			dest_order.filled = true;
		}
		else {
			dest_order = getDestOrderByHash(trade.takerOrderHash);
			if (dest_order) {
				if (role && role !== 'taker')
					throw Error("self-trade?");
				if (dest_order.filled)
					continue;
				role = 'taker';
				side = matches.takerOrder.side;
				dest_order.filled = true;
			}
		}
		if (dest_order) {
			let price = parseFloat(dest_order.price);
			if (!averagePrice)
				averagePrice = price;
			else
				averagePrice = (averagePrice * size + trade.amount * price) / (averagePrice * size);
			size += trade.amount;

			if (!lowestPrice || price < lowestPrice)
				lowestPrice = price;
			if (!highestPrice || price > highestPrice)
				highestPrice = price;
		}
	}
	if (size && !side)
		throw Error("no side");
	if (size) {
		size /= 1e9;
		console.log("detected fill of my " + side + " " + size + " GB on dest exchange at average price " + averagePrice + ", will do the opposite on source exchange");
		vueEventBus.$emit('trade', {
			type: 'dest',
			side,
			size,
			price: averagePrice,
			time: new Date()
		});

		if (side === 'BUY'){
			let sell_limit_coeff = (1 - conf.markup / 100) * (1 - conf.LIMIT_MARGIN / 100);
			await source.createLimitTx('SELL', size, sell_limit_coeff * lowestPrice);
		} else {
			let buy_limit_coeff = (1 + conf.markup / 100) * (1 + conf.LIMIT_MARGIN / 100);
			await source.createLimitTx('BUY', size, buy_limit_coeff *  highestPrice);
		}
		
	}
	else
		console.log("no my orders or duplicate");
}



function startBittrexWs() {
	return new Promise((resolve, reject)=>{
		try {
			bittrex_ws_client = new Bittrex_ws({
				// websocket will be automatically reconnected if server does not respond to ping after 10s
				pingTimeout:10000,
				watchdog:{
					markets:{
						timeout:1800000,
						reconnect:true
					}
				}
			});
		} catch (e){
			reject(e.toString());
		}
		bittrex_ws_client.on("connectionError", function(objError){
			console.log(objError.error.error)
			if (objError.error && objError.error.error.includes('CORS'))
				vueEventBus.$emit('CORS_error');
		})

		// handle trade events
		bittrex_ws_client.on("trades", trade => console.error('trade', JSON.stringify(trade, null, '\t')));

		// handle level2 orderbook snapshots
		bittrex_ws_client.on("orderBook", onSourceOrderbookSnapshot);
		bittrex_ws_client.on("orderBookUpdate", onSourceOrderbookUpdate);

		console.log("=== Subscribing to 'BTC-GBYTE' pair");
		bittrex_ws_client.subscribeToMarkets(['BTC-GBYTE']);
		resolve();
	})

}

function refreshDashboardOrdersOnNextick(){ // update orderbook on user dashboard
	setTimeout(function(){
		vueEventBus.$emit('orders_updated', orders.assocMyOrders);
	}, 0);
}


/**
 * headless wallet is ready
 */
function start(_conf, _vueEventBus) {
	return new Promise(async (resolve, reject)=>{
		if (bStarted){
			return reject('already started');
		}
		bStarted = true;

		Object.assign(conf, _conf);
		vueEventBus = _vueEventBus;

		try {
			await odex.start(conf);
			orders = odex.orders;
			ws_api = odex.ws_api;
			balances = odex.balances;
			exchange= odex.exchange;
			await orders.trackMyOrders();
		} catch(e){
			bStarted = false;
			return reject("Coudln't start Odex client: " + e.toString());
		}
		
		if (!await odex.account.isAuthorizationGranted()){
			bStarted = false;
			return reject("Control address isn't authorized to trade");
		}

		try {
			var pairTokens = await exchange.getTokensByPair(conf.dest_pair);
		} catch(e){
			odex.stop();
			bStarted = false;
			return reject(conf.dest_pair + " doesn't exist on Odex");
		}

		cancelAllDestOrders();
		assocDestOrdersBySourcePrice = {};

		try {
			await source.start(vueEventBus);
		} catch(e){
			odex.stop();
			bStarted = false;
			return reject("Coudln't start Bittrex API client " + e.toString());
		}

		try{
			await startBittrexWs();
		} catch(e){
			odex.stop();
			source.stop();
			bStarted = false;
			return reject("Couldn't start Bittrex WS " + e.toString());
		}


		initWsApiEvents();

		await ws_api.subscribeOrdersAndTrades(conf.dest_pair);
		assocOrdersToBeCancelled = {};
		resolve(pairTokens);
	})
}


async function stop(){
	return new Promise(async (resolve, reject)=>{
		if (bExiting)
			return reject('Already stopping');
		if (!bStarted)
			return reject('Not started');
		bExiting = true;
		source.stop();
		bittrex_ws_client.removeAllListeners();

		await cancelAllTrackedDestOrders();

		setTimeout(function(){
			const nonCancelledOrdersLength = Object.keys(assocOrdersToBeCancelled).length;
			if (nonCancelledOrdersLength > 0)
				vueEventBus.$emit('error', nonCancelledOrdersLength + " Odex order" + (nonCancelledOrdersLength > 1 ? "s weren't" : " wasn't") + " cancelled on exit");
			refreshDashboardOrdersOnNextick();
			odex.stop();
			for (var key in assocCheckCancellingTimerIds){
				clearTimeout(key);
			}
			bExiting = false;
			bStarted = false;
			resolve()
		}, 2000)
	})
}

function initWsApiEvents(){

// these events are unlistened when odex.stop() is called
	ws_api.on('trades', (type, payload) => {
//	console.error('---- received trades', type, payload);
	});
	ws_api.on('orderbook', (type, {asks, bids}) => {
//		console.error('---- received orderbook', type, asks, bids);
	});
	ws_api.on('ohlcv', (type, payload) => {
//	console.error('---- received ohlcv', type, payload);
	});
	ws_api.on('orders', async (type, payload) => {
		console.error('---- received orders', type, payload);
		refreshDashboardOrdersOnNextick();
		if (type === 'ORDER_CANCELLED'){
			delete assocOrdersToBeCancelled[payload.hash];
		}
//	else if (type === 'ORDER_ADDED')
//		console.log("order " + payload.hash + " at " + payload.price + " added with status " + payload.status);
		else if (type === 'ERROR') {
			if (payload.match(/Cannot cancel order .+\. Status is FILLED/))
				return console.error("attempting to cancel a filled order");
			if (payload.match(/Cannot cancel order .+\. Status is CANCELLED/)){
				const hash = payload.replace("Cannot cancel order ", "").replace(". Status is CANCELLED", "");
				delete assocOrdersToBeCancelled[hash]; // don't try to cancel it again
				return console.error("attempting to cancel cancelled order " + hash);
			}
			if (payload.match(/failed to find the order to be cancelled/))
				return console.error("attempting to cancel a non-existent order");
			console.error('latest dest balances', await balances.getBalances());

			let matches = payload.match(/^Insufficient.+for order (.*) at/);
			if (matches) {
				var hash_to_remove = matches[1];
				delete assocOrdersToBeCancelled[hash_to_remove];
				for (let source_price in assocDestOrdersBySourcePrice) {
					let dest_order = assocDestOrdersBySourcePrice[source_price];
					if (dest_order.hash == hash_to_remove){
						console.log("remove " + hash_to_remove + " from tracking")
						delete assocDestOrdersBySourcePrice[source_price]; // this order was refused by Odex so we delete it
					}
				}
			}
		}
	});
	ws_api.on('raw_orderbook', (type, payload) => {
	//	console.error('---- received raw_orderbook', type, payload);
	});
	ws_api.on('orders', (type, payload) => {
		if (type === 'ORDER_MATCHED'){
	//	console.error('---- received matches', type, payload.matches);
			onDestTrade(payload.matches);
		}
	});
	ws_api.on('disconnected', onDestDisconnect);

}

async function cancelOrderAndCheckLater(hash, timerId){

	function setCheckingCallback(){
			var nextTimerId = setTimeout(function(){
				cancelOrderAndCheckLater(hash, nextTimerId);
			}, 20000);
			assocCheckCancellingTimerIds[nextTimerId] = true;
	}
	if (!timerId){
		if (assocOrdersToBeCancelled[hash])
			return console.log("cancelling already requested for " + hash);
		else
			assocOrdersToBeCancelled[hash] = true;
		await orders.createAndSendCancel(hash);
		setCheckingCallback();
	} else {
		delete assocCheckCancellingTimerIds[timerId];
		if (assocOrdersToBeCancelled[hash] && orders.assocMyOrders[hash]){ // if it's not in assocMyOrders, it never was actually added
			vueEventBus.$emit('error', hash + " wasn't cancelled");
			await orders.createAndSendCancel(hash);
			setCheckingCallback();
		} else {
			delete assocOrdersToBeCancelled[hash];
			console.log("cancelling order " + hash + " was confirmed by Odex");
		}
	}
}





exports.start = start;
exports.stop = stop;