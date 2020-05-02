<template>
	<div class="tile is-3 is-parent">
		<article class="tile is-child notification is-info">
			<p class="title">Status</p>
			Control address: <span class="is-size-7"> {{credentials.control_address || ''}}</span>
			<div style="margin-top:20px;">
				<b-button v-if="!is_started" @click="$emit('start')">start</b-button>
				<b-button v-if="is_started" @click="$emit('stop')">stop</b-button>
			</div>
			<div>
				{{sources_balances}}
				</div>
		</article>
					
	</div>
</template>

<script>
import { EventBus } from '../js/event-bus.js';
import { aa_address } from '../conf.js'

export default {
  props: {
		connections: Object,
		credentials: Object,
		is_started: Boolean
	},
	data () {
			return {
				control_address: '',
				sources_balances: false
			}
		},
	created() {
		EventBus.$on('source_balances', function(sources_balances){

		this.sources_balances = sources_balances
		})
	},
	watch:{
		credentials: function() {
		},
		connections: function() {
		}
		 
	},
	methods:{


	}
}
</script>

