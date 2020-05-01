<template>
	<div class="tile is-ancestor">
		<connections :is_editing_allowed="!is_started" @onFormChange="updateConnections($event)"/>
		<credentials :is_editing_allowed="!is_started" @onFormChange="updateCredentials($event)"/>

					<b-button @click="start">start</b-button>
					<b-button @click="stop">stop</b-button>
	</div>
</template>

<script>

const replicate = require('../js/replicate.js');
import Credentials from './Credentials.vue'
import Connections from './Connections.vue'


export default {
	components: {
		Credentials,
		Connections
	},
	data () {
		return {
			is_started: false,
			odex_ws_url: "wss://testnet.odex.ooo/socket",
			odex_http_url: "https://testnet.odex.ooo/api",
			hub_ws_url: "wss://obyte.org/bb-test",
			wif:"",
			testnet: true,
			conf: {
				credentials: {},
				connections: {}
			},
			state: {
				credentials: {}
			}
		}
	},
	methods:{
		start(){
			this.is_started = true
/*
			replicate.start({
				odex_ws_url: this.odex_ws_url,
				odex_http_url: this.odex_http_url ,
				hub_ws_url: this.hub_ws_url,
				wif: this.wif,
				testnet: this.testnet,
				sourceApiKey: '',
				sourceApiSecret: '',
			});
*/
		},
		stop(){
						this.is_started = false

		//	replicate.stop()

		},
		updateCredentials: function(credentials){
			this.conf.credentials = credentials
		},
		updateConnections: function(connections){
			this.conf.connections = connections
		}
	}
}
</script>

