<template>
	<div class="tile is-3 is-parent">
		<article class="tile is-child notification is-info">
			<p class="title  is-5">Configuration</p>
			<b-field label="Odex BTC stable coin symbol" :message="destination_quote_message">
				<b-input @input="onChange" v-model="configuration.destination_quote"  :disabled="!is_editing_allowed"></b-input>
			</b-field>
			<b-field :message="owner_address_message">
				<template slot="label">
					Owner address
					<b-tooltip type="is-dark" label="Address of your Odex account, used to deposit and withdraw funds">
						<b-icon size="is-small" icon="help-circle-outline"></b-icon>
					</b-tooltip>
				</template>
				<b-input @input="onChange" v-model="configuration.owner_address"  :disabled="!is_editing_allowed"></b-input>
			</b-field>
			<div>
				<div v-if="grantLink && revokeLink">
					<a  :href="grantLink" target="_blank">Grant</a>
					<b-tooltip style="margin-left:5px;" type="is-dark" label="Open your Obyte wallet and send a transaction that grants trading right to your control address">
						<b-icon size="is-small" icon="help-circle-outline"></b-icon>
					</b-tooltip>
					<a v-if="revokeLink" style="margin-left:20px;" :href="revokeLink" target="_blank">Revoke</a>
					<b-tooltip style="margin-left:5px;" type="is-dark" label="Open your Obyte wallet and send a transaction that revokes trading right of your control address">
						<b-icon size="is-small" icon="help-circle-outline"></b-icon>
					</b-tooltip>
				</div>
			</div>
			<b-field style="margin-top:10px;" >
				<template slot="label">
					BTC balance minimum
					<b-tooltip type="is-dark" label="Minimum balance in BTC or BTC stablecoin to keep free on Odex and Bittrex">
						<b-icon size="is-small" icon="help-circle-outline"></b-icon>
					</b-tooltip>
				</template>
				<b-numberinput @input="onChange" v-model="configuration.min_quote_balance"  :disabled="!is_editing_allowed" :min="0" :step="0.01"></b-numberinput>
			</b-field>
			<b-field >
				<template slot="label">
				GBYTE balance minimum
				<b-tooltip type="is-dark" label="Minimum balance in GB to keep free on Odex and Bittrex">
						<b-icon size="is-small" icon="help-circle-outline"></b-icon>
					</b-tooltip>
				</template>
				<b-numberinput @input="onChange" v-model="configuration.min_base_balance"  :disabled="!is_editing_allowed"  :min="0" :step="0.1"></b-numberinput>
			</b-field>
			<b-field>
					<template slot="label">
					Markup (in %)
					<b-tooltip type="is-dark" label="Rate that applies to your price to enable profits">
						<b-icon size="is-small" icon="help-circle-outline"></b-icon>
					</b-tooltip>
				</template>
				<b-numberinput @input="onChange" v-model="configuration.markup"  :disabled="!is_editing_allowed" :min="0" :max="99" :step="0.1"></b-numberinput>
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
			if(!this.configuration.destination_quote.length){
				this.destination_quote_message = 'not valid'
				bComplete = false
			} else {
				this.destination_quote_message = ''
			}

			this.configuration.dest_pair = 'GBYTE/' + this.configuration.destination_quote

			if (this.configuration.min_quote_balance === null || this.configuration.min_base_balance === null|| this.configuration.markup === null) 
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

