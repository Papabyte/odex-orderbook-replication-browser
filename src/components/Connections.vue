<template>
	<div class="tile is-4 is-parent">
		<article class="tile is-child notification is-info">
			<p class="title">Connections</p>
			<b-field label="Odex ws URL" :message="odex_ws_message">
				<b-input @input="onChange" v-model="connections.odex_ws_url"  :disabled="!is_editing_allowed"></b-input>
			</b-field>
			<b-field label="Odex http API url" :message="odex_http_message">
				<b-input @input="onChange" v-model="connections.odex_http_url" :disabled="!is_editing_allowed" autocomplete="off"></b-input>
			</b-field>
			<b-field label="Hub ws url" :message="hub_ws_message">
				<b-input @input="onChange" v-model="connections.hub_ws_url" :disabled="!is_editing_allowed" autocomplete="off"></b-input>
			</b-field>
			<div class="field">
			<b-checkbox  v-model="connections.is_testnet">
				testnet
				</b-checkbox>
			</div>
			<b-button class="is-primary" v-if="!matchDefaultTestnet" @click="switchToDefaultTestnet" style="margin:10px;">Switch to testnet default settings</b-button>				
			<b-button class="is-primary" v-if="!matchDefault" @click="switchToDefault" style="margin:10px;">Switch to default settings</b-button>
		</article>
	</div>
</template>
<script>

export default {
  props: {
		is_editing_allowed: Boolean,
	},
	data () {
		return {
			is_form_complete: false,
			default_odex_ws_url: "wss://odex.ooo/socket",
			default_odex_http_url: "https://odex.ooo/api",
			default_hub_ws_url: "wss://obyte.org/bb",
			default_odex_ws_url_testnet: "wss://testnet.odex.ooo/socket",
			default_odex_http_url_testnet: "https://testnet.odex.ooo/api",
			default_hub_ws_url_testnet: "wss://obyte.org/bb-test",
			odex_ws_message:'',
			odex_http_message: '',
			hub_ws_message: '',
			connections: {}
		}
	},
	computed: {
		matchDefaultTestnet() {
			return this.connections.odex_ws_url == this.default_odex_ws_url_testnet 
			&& this.connections.odex_http_url == this.default_odex_http_url_testnet
			&& this.connections.hub_ws_url == this.default_hub_ws_url_testnet
			&& this.connections.is_testnet
		},
		matchDefault() {
			return this.connections.odex_ws_url == this.default_odex_ws_url 
			&& this.connections.odex_http_url == this.default_odex_http_url
			&& this.connections.hub_ws_url == this.default_hub_ws_url
			&& !this.connections.is_testnet
		},
	},
	created() {
		this.connections.odex_ws_url = localStorage.getItem('odex_ws_url') || ''
		this.connections.odex_http_url = localStorage.getItem('odex_http_url') || ''
		this.connections.hub_ws_url = localStorage.getItem('hub_ws_url') || ''
		this.connections.is_testnet = localStorage.getItem('is_testnet') === 'true' || false
		this.onChange()
	},
	methods:{
		saveConnections(){
			for (var key in this.connections){
				localStorage.setItem(key, this.connections[key]) 
			}
		},
		switchToDefaultTestnet(){
			var connections = {};
			connections.odex_ws_url = this.default_odex_ws_url_testnet
			connections.odex_http_url = this.default_odex_http_url_testnet
			connections.hub_ws_url = this.default_hub_ws_url_testnet
			connections.is_testnet = true
			this.connections = connections // we have to reference new object to resfresh form values
			this.onChange();
		},
			switchToDefault(){
			var connections = {};
			connections.odex_ws_url = this.default_odex_ws_url
			connections.odex_http_url = this.default_odex_http_url
			connections.hub_ws_url = this.default_hub_ws_url
			connections.is_testnet = false
			this.connections = connections // we have to reference new object to resfresh form values
			this.onChange();
		},
		onChange(){
		/*	var bComplete = true;
			if (this.credentials.wif.length < 50){
				this.wif_message = 'not valid'
				bComplete = false
			}
			else {
				this.wif_message = ''
			}
			if (this.credentials.bittrex_api_key.length !=32){
				this.api_key_message = 'not valid'
				bComplete = false
			}
			else {
				this.api_key_message = ''
			}
			if (this.credentials.bittrex_api_secret.length !=32){
				this.api_secret_message = 'not valid'
				bComplete = false
			}
			else {
				this.api_secret_message = ''
			}
			this.credentials.complete = this.is_form_complete = bComplete*/
			this.saveConnections();
			this.$emit("onFormChange", this.connections)
		}
	}
}
</script>

