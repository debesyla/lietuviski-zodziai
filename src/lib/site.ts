const defaultSiteUrl = 'http://127.0.0.1:4173';

export const publicRoutes = [
  '',
  'apie',
  'duomenu-katalogas',
  'zodyno-apreptis',
  'karo-zodziu-palyginimas',
  'zanru-profilis',
  'blkt-profilis',
  'sintakse'
] as const;

function normalizePublicSiteUrl(value?: string) {
  const url = new URL((value || defaultSiteUrl).trim());
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('PUBLIC_SITE_URL must use http or https');
  }
  if (url.search || url.hash) {
    throw new Error('PUBLIC_SITE_URL must not contain a query or fragment');
  }
  url.pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
  return url.toString().replace(/\/$/, '');
}

export function createSite(publicSiteUrl?: string) {
  const url = normalizePublicSiteUrl(publicSiteUrl);
  return {
    name: 'Dažniausi lietuviški žodžiai',
    url,
    homeUrl: `${url}/`,
    methodologyUrl: `${url}/apie`,
    catalogueUrl: `${url}/duomenu-katalogas`,
    coverageProfileUrl: `${url}/zodyno-apreptis`,
    wartimeContrastUrl: `${url}/karo-zodziu-palyginimas`,
    genreProfileUrl: `${url}/zanru-profilis`,
    blktProfileUrl: `${url}/blkt-profilis`,
    syntaxExplorerUrl: `${url}/sintakse`,
    socialImageUrl: `${url}/social-preview-v3.png`,
    description: 'Kurie lietuvių kalbos žodžiai vartojami dažniausiai, kaip jie keitėsi nuo 1922 m. ir kur jie dažnesni – romanuose ar spaudoje? Vieši tekstynų duomenys ir CSV.'
  } as const;
}

const configuredPublicSiteUrl = import.meta.env.PUBLIC_SITE_URL;

export const site = createSite(configuredPublicSiteUrl);
