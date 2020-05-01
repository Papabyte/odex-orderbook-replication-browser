<template>
	<div class="tile is-4 is-parent">
		<article class="tile is-child notification is-info">
			<p class="title">Credentials</p>
			<b-field label="wif" :message="wif_message">
				<b-input @input="onChange" v-model="credentials.wif" type="password" autocomplete="off" :disabled="!is_editing_allowed || are_credentials_saved"></b-input>
			</b-field>
			<b-field label="Bittrex API key" :message="api_key_message">
				<b-input @input="onChange" v-model="credentials.bittrex_api_key" type="password" :disabled="!is_editing_allowed || are_credentials_saved" autocomplete="off"></b-input>
			</b-field>
			<b-field label="Bittrex API Secret" :message="api_secret_message">
				<b-input @input="onChange" v-model="credentials.bittrex_api_secret" type="password" :disabled="!is_editing_allowed || are_credentials_saved" autocomplete="off"></b-input>
			</b-field>
			<b-button class="is-primary" v-if="is_editing_allowed && are_credentials_saved" @click="deleteCredentials">Delete from computer</b-button>				
			<b-button class="is-primary" v-if="is_editing_allowed && !are_credentials_saved && is_form_complete" @click="saveCredentials">Save on computer</b-button>
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
				are_credentials_saved: false,
				wif_message: '',
				api_key_message: '',
				api_secret_message: '',
				credentials: {}
			}
		},
	created() {
		this.are_credentials_saved = !!localStorage.getItem('wif')
		this.credentials.wif = localStorage.getItem('wif') || ''
		this.credentials.bittrex_api_key = localStorage.getItem('bittrex_api_key') || ''
		this.credentials.bittrex_api_secret = localStorage.getItem('bittrex_api_secret') || ''
		this.onChange()
	},
	methods:{
		deleteCredentials(){
			for (var key in this.credentials){
				localStorage.removeItem(key)
				this.credentials[key] = ''
			}
			this.are_credentials_saved = false
		},
		saveCredentials(){
			for (var key in this.credentials){
				localStorage.setItem(key, this.credentials[key]) 
			}
			this.are_credentials_saved = true
		},
		onChange(){
			var bComplete = true;
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
			this.credentials.complete = this.is_form_complete = bComplete
			this.$emit("onFormChange", this.credentials)
		}
	}
}
</script>

