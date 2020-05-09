<template>
	<div class="tile is-3 is-parent">
		<article class="tile is-child notification is-info">
			<p class="title  is-5">Configuration</p>
			<b-field label="Odex quote" :message="destination_quote_message">
				<b-input @input="onChange" v-model="configuration.destination_quote"  :disabled="!is_editing_allowed"></b-input>
			</b-field>
			<b-field label="Owner address" :message="owner_address_message">
				<b-input @input="onChange" v-model="configuration.owner_address"  :disabled="!is_editing_allowed"></b-input>
			</b-field>
			<div>
				<a v-if="grantLink"  :href="grantLink" target="_blank">Grant</a>
				<a v-if="revokeLink" style="margin-left:20px;" :href="revokeLink" target="_blank">Revoke</a>
			</div>
			<b-field label="Quote balance minimum" >
				<b-numberinput @input="onChange" v-model="configuration.min_quote_balance"  :disabled="!is_editing_allowed" :min="0" :step="0.01"></b-numberinput>
			</b-field>
			<b-field label="Base balance minimum" >
				<b-numberinput @input="onChange" v-model="configuration.min_base_balance"  :disabled="!is_editing_allowed"  :min="0" :step="0.1"></b-numberinput>
			</b-field>
			<b-field label="Markup (in %)">
				<b-numberinput @input="onChange" v-model="configuration.markup"  :disabled="!is_editing_allowed" :min="0" :step="0.1"></b-numberinput>
			</b-field>
		</article>
	</div>
</template>
<script>

const isUrl = require('is-url')
const { isValidAddress } = require('obyte/lib/utils');
import { aa_address, testnet_protocol, mainnet_protocol } from '../js/conf.js'

export default {
  props: {
		is_editing_allowed: Boolean,
		credentials: Object,
		connections: Object
	},
	data () {
		return {
			configuration: {
				dest_pair:'',
				source_pair: '',
			},
			owner_address_message: '',
			destination_quote_message: '',
			revokeLink: false,
			grantLink: false
		}
	},
	computed: {

	},
	created() {
		this.configuration.owner_address = localStorage.getItem('owner_address') || ''
		this.configuration.min_quote_balance = Number(localStorage.getItem('min_quote_balance')) || 0.01
		this.configuration.min_base_balance  = Number(localStorage.getItem('min_base_balance')) || 0.1
		this.configuration.min_source_order_size = Number(localStorage.getItem('min_source_order_size')) || 0.2
		this.configuration.markup = Number(localStorage.getItem('markup')) || 2
		this.configuration.destination_quote = localStorage.getItem('destination_quote') || "BTC_20200701"
		this.onChange()
	},
	watch:{
		credentials: function() {
			this.onChange()
		},
		connections: function() {
			this.onChange()
		},
	},
	methods:{
		saveConfiguration(){
			for (var key in this.configuration){
				localStorage.setItem(key, this.configuration[key]) 
			}
		},

		onChange(){
			var bComplete = true;
			if (!isValidAddress(this.configuration.owner_address)){
				this.owner_address_message = 'not valid'
				this.grantLink = false
				this.revokeLink = false
				bComplete = false
			}
			else {
				if (this.credentials.control_address && this.credentials.control_address.length > 0)
					this.createAuthorizeAndRevokeLinks()
				this.owner_address_message = ''
			}

			this.configuration.dest_pair = 'GBYTE/' + this.configuration.destination_quote

			if (!this.configuration.min_quote_balance || !this.configuration.min_base_balance || !this.configuration.markup) 
				bComplete = false
			this.configuration.bComplete = bComplete
			if (bComplete)
				this.saveConfiguration();
			this.$emit("onFormChange", this.configuration)
		},


		createAuthorizeAndRevokeLinks(){
			const base64url = require('base64url');
			var data = {
				grant: 1,
				address: this.credentials.control_address
			}
			var json_string = JSON.stringify(data);
			var base64data = base64url(json_string);
			this.grantLink = (this.connections.testnet ? testnet_protocol : mainnet_protocol)+":"+aa_address+"?amount=10000&base64data="+base64data;
			data = {
				revoke: 1,
				address: this.credentials.control_address
			}
			json_string = JSON.stringify(data);
			base64data = base64url(json_string);
			this.revokeLink = (this.connections.testnet ? testnet_protocol : mainnet_protocol)+":"+aa_address+"?amount=10000&base64data="+base64data;
		}
	}
}
</script>

