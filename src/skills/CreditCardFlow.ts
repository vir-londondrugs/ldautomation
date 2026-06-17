/**
 * @file CreditCardFlow.ts
 * @description Reusable skill that handles the Credit Card payment step during UAT checkout.
 *              This module is UI-only: it receives data objects and interacts with the
 *              Billing page selectors. It must NOT contain navigation or cart logic.
 *
 * @usage
 *   import { executeCreditCardPayment } from '../skills/CreditCardFlow';
 *   import { TEST_CARDS } from '../config/testData';
 *   await executeCreditCardPayment(page, TEST_CARDS.visaSuccess);
 */

import { Page } from '@playwright/test';
import { CardData, AddressData } from '../config/testData';

// ─── Selectors ─────────────────────────────────────────────────────────────────

const SELECTORS = {
  visaRadio: 'input[type="radio"][value="tenant~VISA"]',
  cardNumber: 'input[name="creditCardNumber"]',
  expirationDate: 'input[name="expirationDate"]',
  cvv: 'input[name="cvv"]',
  cardholderName: 'input[name="cardholderName"]',
  billingForm: 'form#billing-address-form, [data-testid="billing-address-form"]',
  billingFirstName: 'input[name="firstName"]',
  billingLastName: 'input[name="lastName"]',
  billingPhone: 'input[name="phone"]',
  billingAddress1: 'input[name="addressLine1"]',
  billingPostalCode: 'input[name="zipCode"]',
  billingCity: 'input[name="city"]',
  billingCountry: 'select[name="country"]',
  billingProvince: 'select[name="state"]',
} as const;

// ─── Main Exported Function ────────────────────────────────────────────────────

/**
 * Executes the Credit Card payment step on the UAT Billing page.
 *
 * @param page    - Active Playwright Page instance already positioned on the billing step.
 * @param card    - Card data object (number, expiry, cvv, holder). Import from testData.ts.
 * @param billing - Optional billing address. When omitted and the form is visible,
 *                  the function uses the same first/last name from the card holder field
 *                  ('automation' / 'Accept'). Pass a full AddressData object to override.
 */
export async function executeCreditCardPayment(
  page: Page,
  card: CardData,
  billing?: AddressData,
): Promise<void> {
  // ── 1. Select the VISA radio button ─────────────────────────────────────────
  const visaRadio = page.locator(SELECTORS.visaRadio);
  await visaRadio.waitFor({ state: 'visible', timeout: 10_000 });
  await visaRadio.click();

  // ── 2. Fill card details from the injected CardData object ──────────────────
  await page.fill(SELECTORS.cardNumber, card.number);
  await page.fill(SELECTORS.expirationDate, card.expiry);
  await page.fill(SELECTORS.cvv, card.cvv);
  await page.fill(SELECTORS.cardholderName, card.holder);

  // ── 3. Handle Billing Address form (conditional — may not appear for saved addresses) ─
  const billingFormLocator = page.locator(SELECTORS.billingForm);
  const isBillingFormVisible = await billingFormLocator.isVisible().catch(() => false);

  if (isBillingFormVisible) {
    // Derive first/last name: use explicit billing override if provided,
    // otherwise fall back to the mandatory "automation / Accept" defaults.
    const firstName = billing?.firstName ?? 'automation';
    const lastName = billing?.lastName ?? 'Accept';

    await page.fill(SELECTORS.billingFirstName, firstName);
    await page.fill(SELECTORS.billingLastName, lastName);

    // Fill remaining address fields only when a full AddressData object is supplied
    if (billing) {
      await page.fill(SELECTORS.billingPhone, billing.phone);
      await page.fill(SELECTORS.billingAddress1, billing.addressLine1);
      await page.fill(SELECTORS.billingPostalCode, billing.postalCode);
      await page.fill(SELECTORS.billingCity, billing.city);
      await page.selectOption(SELECTORS.billingCountry, billing.country);
      await page.selectOption(SELECTORS.billingProvince, billing.province);
    }
  }
}
