<template>
	<div class="tile is-6 is-parent">
		<article class="tile is-child notification is-info">
			<p class="title is-5">Trades</p>
				<div v-if="trades.length">
					<b-table :data="trades" :columns="[
					{field: 'place', label:'Place'},
					{field:'side',label: 'Side'},
					{field:'size',label: 'Size'},
					{field:'status',label: 'Status'},
					{field:'time',label: 'Time'}
					]" paginated :per-page="10"></b-table>
				</div>
				<div v-else>
					No trade for this session.
				</div>
		</article>
	</div>
</template>

<script>
import { EventBus } from '../js/event-bus.js';

export default {
  props: {

	},
	data () {
			return {
				trades: [],
			}
		},
	created() {
		EventBus.$on('trade', (trade)=>{
			trade.time = trade.time.toISOString();
			trade.place = trade.type == 'source' ? 'Bittrex' :'Odex';
			trade.size += 'GB';
			if (trade.error)
				trade.status = 	trade.error.name + ' - ' + trade.status;
			for (var i=0; i<100;i++)
			this.trades.push(trade);
		})
	},
	watch:{
		 
	},
	methods:{
	
	}
}
</script>

