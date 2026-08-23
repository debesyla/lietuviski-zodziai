<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import '../app.css';
	import { t } from '$lib/translations';

	let { children } = $props();
	const homeUrl = `${base}/`;
	const methodologyUrl = `${homeUrl}apie`;
	const catalogueUrl = `${homeUrl}duomenu-katalogas`;

	function isCurrent(path: string) {
		if (path === homeUrl) return page.url.pathname === homeUrl;
		return page.url.pathname.startsWith(path);
	}
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="https://dago.lt/assets/img/dago-icon.png" />
	<link rel="stylesheet" href="https://dago.lt/assets/styles/reset.css?v=20260808" />
	<link rel="stylesheet" href="https://dago.lt/assets/styles/dago.css?v=20260808" />
</svelte:head>

<a class="skip-link" href="#main-content">Pereiti prie turinio</a>
<header class="site-header">
	<div class="site-brand">
		<a href={homeUrl} class="brand-home print-a-no-link">dažniausi žodžiai</a>
		<a href="https://dago.lt" class="dago-link print-a-no-link" target="_blank" rel="noopener">// dago</a>
	</div>
	<nav class="site-navigation" aria-label={t('siteNavigation')}>
		<a href={homeUrl} aria-current={isCurrent(homeUrl) ? 'page' : undefined}>{#if isCurrent(homeUrl)}<span aria-hidden="true">› </span>{/if}{t('exploreData')}</a>
		<a href={catalogueUrl} aria-current={isCurrent(catalogueUrl) ? 'page' : undefined}>{#if isCurrent(catalogueUrl)}<span aria-hidden="true">› </span>{/if}{t('dataProductsCatalogue')}</a>
		<a href={methodologyUrl} aria-current={isCurrent(methodologyUrl) ? 'page' : undefined}>{#if isCurrent(methodologyUrl)}<span aria-hidden="true">› </span>{/if}{t('methodologyAndSources')}</a>
	</nav>
</header>

<div id="main-content">
	{@render children?.()}
</div>

<footer>
	<p>{t('footerText')}<a href="mailto:{t('footerEmail')}">{t('footerEmail')}</a></p>
</footer>
