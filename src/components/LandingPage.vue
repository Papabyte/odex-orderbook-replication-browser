<template>
<div>
	<div class="tile is-ancestor">
		<connections 
			:is_editing_allowed="!is_started" 
			@onFormChange="updateConnections($event)"
		/>
		<credentials 
			:is_editing_allowed="!is_started" 
			:connections="connections" 
			@onFormChange="updateCredentials($event)"
		/>
		<configuration 
			:is_editing_allowed="!is_started" 
			:credentials="credentials"
			:connections="connections" 
			@onFormChange="updateConfiguration($event)
		"/>
			<status 
			:credentials="credentials" 
			:connections="connections"
			:is_started="is_started" 
			:pairTokens="pairTokens"
			:configuration="configuration"
			@start="start"
			@stop="stop"
		/>
	</div>
			<div class="tile is-ancestor">

			<orders
				:configuration="configuration"
				:pairTokens="pairTokens"
			/>
			<trades/>
		</div>
	</div>

</template>

<script>

const replicate = require('../js/replicate.js');
import Credentials from './Credentials.vue'
import Connections from './Connections.vue'
import Configuration from './Configuration.vue'
import Orders from './Orders.vue'
import Trades from './Trades.vue'

import { EventBus } from '../js/event-bus.js';

import Status from './Status.vue'


export default {
	components: {
		Credentials,
		Connections,
		Configuration,
		Status,
		Orders,
		Trades
	},
	data () {
		return {
			is_started: false,
			credentials: {},
			connections: {},
			configuration: {},
			orders: {},
			pairTokens: [],
		}
	},
		created() {

	},
	methods:{
		async start(){
			if (!this.configuration.bComplete)
				this.popToast('Configuration is not complete')
			if (!this.credentials.bComplete)
				this.popToast('Credentials are not complete')
			if (!this.connections.bComplete)
				this.popToast('Connections are not complete')

			await replicate.start(
				Object.assign({}, this.credentials, this.connections,  this.configuration),
				EventBus
				).then((pairTokens)=>{
						this.pairTokens = pairTokens
					this.is_started = true
				}).catch(
					(e)=>{
						this.popToast(e)
				})

		},
		stop(){
			this.is_started = false
			replicate.stop().catch((e)=>{
				this.popToast(e.toString())
			})
		},
		updateCredentials: function(credentials){
			this.credentials = Object.assign({}, credentials) // we clone in a new object so watchers can see the change
		},
		updateConnections: function(connections){
			this.connections = Object.assign({}, connections) 
		},
		updateConfiguration: function(configuration){
			this.configuration = Object.assign({}, configuration) 
		},
		popToast: function(message){
			this.$buefy.toast.open({
				duration: 5000,
				message,
				position: 'is-bottom',
				type: 'is-danger'
			})
		}
	}
}
</script>

