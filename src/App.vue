<template>
  <div id="app">
		<section>
		<div class="container">
			<div class="columns">
				<div class="column">
					<h2 class="title is-3">Bittrex to Odex replication bot </h2> 
				</div>

				<div class="column has-text-right">
					<h6 class="title is-6" style="padding: 10px">
						<a :href="conf.intructions_url" target="_blank">Instructions - Source code 
							<b-icon size="is-small" icon="link"></b-icon>
						</a>
					</h6>
				</div>
			</div>
		<LandingPage />
		 </div>
		 	</section>
  </div>
</template>

<script>
import LandingPage from './components/LandingPage.vue'
import conf from './js/conf.js'
export default {
  name: 'App',
  components: {
    LandingPage
  },
	data() {
		return {
		conf: conf
		}
	}
}
</script>
