<template>
  <div id="app">
		<section>
		<div class="container">
					<h2 class="title is-3">Bittrex to Odex replication bot</h2>
    <LandingPage />
		 </div>
		 	</section>
  </div>
</template>

<script>
import LandingPage from './components/LandingPage.vue'

export default {
  name: 'App',
  components: {
    LandingPage
  }
}
</script>
