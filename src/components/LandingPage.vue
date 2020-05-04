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
			:is_started="is_started" @start="start"
			:pairTokens="pairTokens"
			:configuration="configuration"
			@stop="stop"
		/>
	</div>
		<div class="tile is-ancestor">

			<orders
				:configuration="configuration"
				:pairTokens="pairTokens"
			/>
	</div>
	</div>

</template>

<script>

const replicate = require('../js/replicate.js');
import Credentials from './Credentials.vue'
import Connections from './Connections.vue'
import Configuration from './Configuration.vue'
import Orders from './Orders.vue'

import { EventBus } from '../js/event-bus.js';

import Status from './Status.vue'


export default {
	components: {
		Credentials,
		Connections,
		Configuration,
		Status,
		Orders
	},
	data () {
		return {
			is_started: false,
			credentials: {},
			connections: {},
			configuration: {},
			orders: {},
			pairTokens: []
		}
	},
		created() {

	},
	methods:{
		async start(){
			
			await replicate.start(
				Object.assign({}, this.credentials, this.connections,  this.configuration),
				EventBus
				).then((pairTokens)=>{
						this.pairTokens = pairTokens
					this.is_started = true
				}).catch(
					(e)=>{
						this.$buefy.toast.open({
						duration: 5000,
						message: e.toString(),
						position: 'is-bottom',
						type: 'is-danger'
					})
				})

		},
		stop(){
			this.is_started = false
			replicate.stop().catch((e)=>{
				this.$buefy.toast.open({
					duration: 5000,
					message: e.toString(),
					position: 'is-bottom',
					type: 'is-danger'
				})
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
		}		
	}
}
</script>

