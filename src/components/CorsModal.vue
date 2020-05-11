<template>
	<div class="modal-card" style="min-width:400px;">
		<header class="modal-card-head">
			<p class="modal-card-title">CORS error detected</p>
		</header>
		<section class="modal-card-body">
			<p>This bot relies on Bittrex API to get orderbook and place orders. 
			Unfortunately Bittrex doesn't set the proper headers to allow Cross Origin Request Sharing, so the browser refuses to fetch data since they come from a different domain (bittrex.com) than the current one ({{currentUrl}}).
			</p>
			<p>
			To avoid this issue, it's required that you install an extension that will alter http requests to make the browser believe the server has answered with proper headers.
			We recommend to use Firefox and install this extension: <a href="https://addons.mozilla.org/fr/firefox/addon/cors-everywhere/" target="_blank" rel="noopener noreferrer"> https://addons.mozilla.org/fr/firefox/addon/cors-everywhere/ </a>
			</p>
			<p>
			Don't trade security for lazyness, don't enable CORS for any website but whitelist only this application. To do so go click on icon extension -> Manage Extension -> Preferences and put
			<b>/^{{currentUrl}}</b> in the whitelist.
						</p>
			<p>
			There are other ways to force CORS policy like enabling some developer mode and it's OK if you know what you are doing. But we strongly advise against solutions that cannot enable CORS selectively only for this application.
	</p>
		</section>
	</div>
</template>

<script>


export default  {
	components:{

	},
	props: {

	},
	data() {
		return {
			currentUrl: window.location.href
			}
		},
	created(){

	},
	methods:{

	}

}
</script>

<style scoped>
p {
margin-top: 10px;
}
</style>