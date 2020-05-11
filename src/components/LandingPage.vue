<template>
<div>
	<div class="tile is-ancestor">
		<connections 
			:is_editing_allowed="!is_started && !is_starting" 
			@onFormChange="updateConnections($event)"
		/>
		<credentials 
			:is_editing_allowed="!is_started && !is_starting" 
			:connections="connections" 
			@onFormChange="updateCredentials($event)"
		/>
		<configuration 
			:is_editing_allowed="!is_started && !is_starting" 
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
			:isStarting="is_starting"
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
import CorsModal from './CorsModal.vue'

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
			is_starting: false,
			credentials: {},
			connections: {},
			configuration: {},
			orders: {},
			pairTokens: [],
			isCorsModalOpen: false
		}
	},
	created() {
		EventBus.$on('error', (err)=>{
			this.popToast(err)
		})
		EventBus.$on('CORS_error', (err)=>{
			if (this.isCorsModalOpen)
				return;
			this.stop()
			this.isCorsModalOpen = true
			this.$buefy.modal.open({
				parent: this,
				component: CorsModal,
				hasModalCard: true,
				onCancel:()=>{
					this.isCorsModalOpen = false
				},
				customClass: 'custom-class custom-class-2'
			})
		})

		window.onbeforeunload = async (event)=>{ // event triggered on browser exit
			if(this.is_started)
				await this.stop();
		}
	},
	methods:{
		async start(){
			if (!this.configuration.bComplete)
				this.popToast('Configuration is not complete')
			if (!this.credentials.bComplete)
				this.popToast('Credentials are not complete')
			if (!this.connections.bComplete)
				this.popToast('Connections are not complete')
			this.is_starting = true;
			replicate.start(
				Object.assign({}, this.credentials, this.connections,  this.configuration),
				EventBus
				).then((pairTokens)=>{
					this.pairTokens = pairTokens
					this.is_started = true
					this.is_starting = false
				}).catch(
					(e)=>{
						this.popToast(e)
						this.is_starting = false
				})

		},
		async stop(){
			try{
				await replicate.stop()
			} catch(e){
				this.popToast(e.toString())
			}
			this.is_started = false

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

