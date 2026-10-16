<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import '../app.css';
	import { t } from '$lib/translations';

	let { children } = $props();
	const homeUrl = `${base}/`;
	const navigation = [
		{ href: homeUrl, route: '/', label: 'Žodžiai' },
		{ href: `${homeUrl}duomenu-katalogas`, route: '/duomenu-katalogas', label: 'Duomenys' },
		{ href: `${homeUrl}apie`, route: '/apie', label: 'Apie' }
	];
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="https://dago.lt/assets/img/dago-icon.png" />
	<link rel="stylesheet" href="https://dago.lt/assets/styles/reset.css?v=20260808" />
	<link rel="stylesheet" href="https://dago.lt/assets/styles/dago.css?v=20260901" />
</svelte:head>

<a class="skip-link" href="#main-content">Pereiti prie turinio</a>

<div class="page">
	<header class="site-header">
		<h1><a href={homeUrl} class="print-a-no-link">dažniausi žodžiai</a> <a href="https://dago.lt" class="dago-link print-a-no-link">// dago</a></h1>
		<nav class="site-navigation" aria-label={t('siteNavigation')}>
			{#each navigation as item, index}
				{#if index > 0}<span class="inline-separator" aria-hidden="true">//</span>{/if}
				<a href={item.href} aria-current={page.route.id === item.route ? 'page' : undefined}>{item.label}</a>
			{/each}
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
