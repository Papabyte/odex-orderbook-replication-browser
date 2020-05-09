<template>
	<div  class="tile is-6 is-parent">
		<article class="tile is-child notification is-info">
			<p class="title is-5">Orders on {{configuration.dest_pair}}</p>

			<div v-if="asks.length>0 || bids.length>0" class="columns">
				<div class="column">
					<b-table :data="bids" :columns="[{field: 'amount', label:'Amount'},{field:'price',label: 'Price'}]"></b-table>
				</div>
				<div class="column">
					<b-table :data="asks" :columns="[{field: 'price', label: 'Price'},{field:'amount', label:'Amount'}]"></b-table>
				</div>
			</div>
			<div v-else>
				No order placed on Odex
			</div>
		</article>
	</div>
</template>

<script>
import { EventBus } from '../js/event-bus.js';

export default {
  props: {
		is_editing_allowed: Boolean,
		connections: Object,
		pairTokens: Array,
		configuration: Object
	},
	data () {
			return {
				pair: 'GBYTE/BTC_20200701',
				asks: [],
				bids: [],
			}
		},
	created() {
		EventBus.$on('orders_updated', (orders)=>{
			let baseMultiplier = 10 ** this.pairTokens[0].decimals;
			this.asks = [];
			this.bids = [];
			for (var key in orders){
				var order = orders[key]
				if (order.pairName != this.pair)
					continue
				if (order.side == 'SELL')
					this.asks.push({price: order.price, amount: order.amount/baseMultiplier})
				if (order.side == 'BUY')
					this.bids.push({price: order.price, amount: order.amount/baseMultiplier})
			}
		})
	},
	watch:{
		 
	},
	methods:{
	
	}
}
</script>

