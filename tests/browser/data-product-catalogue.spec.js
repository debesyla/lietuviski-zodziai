import { expect, test } from '@playwright/test';

function observePageHealth(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()} (${request.failure()?.errorText ?? 'unknown failure'})`);
  });
  return () => {
    expect(consoleErrors, 'browser console errors').toEqual([]);
    expect(pageErrors, 'uncaught page errors').toEqual([]);
    expect(failedRequests, 'failed browser requests').toEqual([]);
  };
}

test('makes every public data product discoverable with scope, limits, and a safe access path', async ({ page }) => {
  const assertHealthy = observePageHealth(page);

  await page.goto('duomenu-katalogas');
  await expect(page.getByRole('heading', { name: 'duomenų katalogas' })).toBeVisible();
  await expect(page.locator('article.catalogue-entry')).toHaveCount(15);

  for (const heading of ['Tyrinėti naršyklėje', 'Rinkiniai JSON formatu']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await expect(page.getByRole('heading', { name: 'Tik šaltinių aprašai' })).toHaveCount(0);

  const parliament = page.getByRole('article', { name: 'Parlamento kalbų dažniai' });
  await parliament.locator('summary').click();
  await expect(parliament.getByText('CC BY 4.0')).toBeVisible();
  await expect(parliament.getByText(/tai nėra autorystės nustatymo, politikų reitingavimo, citatų ar kalendorinės analizės priemonė/i)).toBeVisible();
  await expect(parliament.getByRole('link', { name: 'Parlamento kalbų dažniai' })).toHaveAttribute(
    'href',
    /data-products\/kapociute-dzikiene-2017-parliament-frequency-aggregates\/manifest\.json$/
  );

  const morphemicDictionary = page.getByRole('article', { name: 'Morfemikos žodynas' });
  await morphemicDictionary.locator('summary').click();
  await expect(morphemicDictionary.getByText('Rightsholder permission')).toBeVisible();
  await expect(morphemicDictionary.getByText(/72 325 įrašai/i)).toBeVisible();
  await expect(morphemicDictionary.getByText(/61 eilute daugiau.*tik kontekstui.*ne kaip išgavimo tikslas/i)).toBeVisible();
  await expect(morphemicDictionary.getByRole('link', { name: 'Morfemikos žodynas' })).toHaveAttribute(
    'href',
    /data-products\/rimkute-morphemic-dictionary\/manifest\.json$/
  );
  await expect(morphemicDictionary.getByRole('link', { name: 'Peržiūrėti viešą sprendimo aprašą' })).toHaveCount(0);

  await expect(page.getByRole('table')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  assertHealthy();
});
