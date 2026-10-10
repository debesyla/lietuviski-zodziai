<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import '../app.css';
	import { t } from '$lib/translations';

	let { children } = $props();
	const isHomepage = $derived(page.route.id === '/');
	const homeUrl = `${base}/`;
	const methodologyUrl = `${homeUrl}apie`;
	const catalogueUrl = `${homeUrl}duomenu-katalogas`;

	function isCurrent(path: string) {
		if (path === homeUrl) return isHomepage;
		return page.route.id === (path === catalogueUrl ? '/duomenu-katalogas' : '/apie');
	}
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="https://dago.lt/assets/img/dago-icon.png" />
	<link rel="stylesheet" href="https://dago.lt/assets/styles/reset.css?v=20260808" />
	<link rel="stylesheet" href="https://dago.lt/assets/styles/dago.css?v=20260901" />
</svelte:head>

<div class="dago-shell">
<a class="skip-link" href="#main-content">Pereiti prie turinio</a>
<header class="site-header">
  <h1>dažniausi žodžiai <a href="https://dago.lt" class="dago-link print-a-no-link">// dago</a></h1>
  <nav class="site-navigation" aria-label={t('siteNavigation')}>
    <a href={homeUrl} aria-current={isCurrent(homeUrl) ? 'page' : undefined}>Žodžiai</a>
    <span class="nav-separator" aria-hidden="true">//</span>
    <a href={catalogueUrl} aria-current={isCurrent(catalogueUrl) ? 'page' : undefined}>Duomenys</a>
    <span class="nav-separator" aria-hidden="true">//</span>
    <a href={methodologyUrl} aria-current={isCurrent(methodologyUrl) ? 'page' : undefined}>Apie</a>
  </nav>
</header>

<div id="main-content">
	{@render children?.()}
</div>

<footer class="site-footer">
  <p>Reikia pagalbos su duomenų integracija? Galiu padėti. <strong>labas (sraigė) dago.lt</strong></p>
  <div class="ai-badge"><a href="https://weblog.dago.lt/mano-ai-di-politika" target="_blank" rel="noopener" class="print-a-no-link"><img src="https://dago.lt/assets/img/byai.png" srcset="https://dago.lt/assets/img/byai.png 1x, https://dago.lt/assets/img/byai@2x.png 2x" alt="Sukūrė DI, ne žmogus" width="132" height="43" /></a></div>
</footer>

</div>
