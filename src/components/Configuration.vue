<template>
	<div class="tile is-3 is-parent">
		<article class="tile is-child notification is-info">
			<p class="title">Configuration</p>
			<b-field label="Owner address" :message="owner_address_message">
				<b-input @input="onChange" v-model="configuration.owner_address"  :disabled="!is_editing_allowed"></b-input>
			</b-field>
			<div style="margin-top:20px;">
				<a v-if="grantLink" :href="grantLink" target="_blank">Grant</a>
				<a v-if="revokeLink" :href="revokeLink" target="_blank">Revoke</a>
			</div>
		</article>
	</div>
</template>
<script>
const isUrl = require('is-url')
const { isValidAddress } = require('obyte/lib/utils');
import { aa_address, testnet_protocol, mainnet_protocol } from '../conf.js'


export default {
  props: {
		is_editing_allowed: Boolean,
		credentials: Object,
		connections: Object
	},
	data () {
		return {
			configuration: {dest_pair:'GBYTE/BTC_20200701'},
			owner_address_message: '',
			revokeLink: false,
			grantLink: false
		}
	},
	computed: {

	},
	created() {
		this.configuration.owner_address = localStorage.getItem('owner_address') || ''
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
			this.configuration.complete = bComplete
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

