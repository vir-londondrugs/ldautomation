/**
 * @file PayPalFlow.ts
 * @description Reusable skill that handles the PayPal Sandbox payment step during UAT checkout.
 *              Captures the asynchronous popup tab opened by the PayPal button (which is an
 *              <img> element, NOT a <button>), authenticates in the sandbox, confirms the
 *              simulated payment, and waits for the popup to close before returning.
 *
 * @important  The PayPal checkout button in the London Drugs UAT is rendered as an image tag:
 *               <img alt="Check out with PayPal" />
 *             Standard button selectors WILL FAIL. This file uses the validated img selector.
 *
 * @usage
 *   import { executePayPalPayment } from '../skills/PayPalFlow';
 *   import { TEST_CREDENTIALS } from '../config/testData';
 *   await executePayPalPayment(page, TEST_CREDENTIALS.paypalSandbox);
 */

import { Page } from '@playwright/test';
import { AuthData } from '../config/testData';

// ─── Selectors ─────────────────────────────────────────────────────────────────

const SELECTORS = {
  /** Radio button that activates the PayPal payment method */
  paypalRadio: 'input[type="radio"][value="mzint~PayPalExpress2"]',
  /** Fallback radio selector used in some UAT builds */
  paypalRadioFallback: 'input[type="radio"][value="PayPal"]',
  /** "Is Same as Shipping Address" checkbox — avoids manual billing form entry */
  sameAsShippingCheckbox: 'input[name="sameAsShippingAddress"]',
  /** PayPal checkout button — it is an <img>, NOT a <button> */
  paypalImgButton: 'img[alt="Check out with PayPal"]',

  // PayPal Sandbox internal selectors
  sandboxEmailInput: 'input#email',
  sandboxNextBtn: 'button#btnNext',
  sandboxPasswordInput: 'input#password',
  sandboxLoginBtn: 'button#btnLogin',
  /** "Continue" or "Pay Now" button that confirms the simulated purchase */
  sandboxConfirmBtn: 'button#payment-submit-btn, button:has-text("Pay Now"), button:has-text("Continue")',
} as const;

// ─── Main Exported Function ────────────────────────────────────────────────────

/**
 * Executes the full PayPal Sandbox payment flow starting from the Billing step.
 *
 * Flow:
 *  1. Select PayPal radio button (tries primary selector, falls back if needed).
 *  2. Check "Same as Shipping Address" to avoid duplicating the billing form.
 *  3. Open the PayPal popup tab via the img button, capturing it with waitForEvent('popup').
 *  4. Authenticate in PayPal Sandbox using the injected AuthData credentials.
 *  5. Confirm simulated funds.
 *  6. Wait for the popup to close (signals successful return to the store).
 *
 * @param page - Active Playwright Page instance positioned on the UAT Billing step.
 * @param auth - PayPal Sandbox credentials. Import TEST_CREDENTIALS.paypalSandbox from testData.ts.
 */
export async function executePayPalPayment(
  page: Page,
  auth: AuthData,
): Promise<void> {
  // ── 1. Select PayPal radio button ───────────────────────────────────────────
  const primaryRadio = page.locator(SELECTORS.paypalRadio);
  const fallbackRadio = page.locator(SELECTORS.paypalRadioFallback);

  const isPrimaryVisible = await primaryRadio.isVisible().catch(() => false);

  if (isPrimaryVisible) {
    await primaryRadio.click();
  } else {
    await fallbackRadio.waitFor({ state: 'visible', timeout: 10_000 });
    await fallbackRadio.click();
  }

  // ── 2. Mark "Same as Shipping Address" when the checkbox is present ─────────
  const sameAsShippingCheckbox = page.locator(SELECTORS.sameAsShippingCheckbox);
  const isCheckboxVisible = await sameAsShippingCheckbox.isVisible().catch(() => false);
  if (isCheckboxVisible) {
    const isChecked = await sameAsShippingCheckbox.isChecked();
    if (!isChecked) {
      await sameAsShippingCheckbox.check();
    }
  }

  // ── 3. Click the PayPal img button and capture the popup tab ────────────────
  // The PayPal button is rendered as <img alt="Check out with PayPal"> — not a <button>.
  const paypalImgButton = page.getByRole('img', { name: 'Check out with PayPal' });
  await paypalImgButton.waitFor({ state: 'visible', timeout: 10_000 });

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    paypalImgButton.click(),
  ]);

  await popup.waitForLoadState('networkidle');

  // ── 4. Authenticate in PayPal Sandbox ───────────────────────────────────────
  // The sandbox login uses a two-step form: email → Next → password → Login
  await popup.fill(SELECTORS.sandboxEmailInput, auth.email);
  await popup.click(SELECTORS.sandboxNextBtn);
  await popup.waitForTimeout(800); // Brief wait for the password field to animate in
  await popup.fill(SELECTORS.sandboxPasswordInput, auth.password);
  await popup.click(SELECTORS.sandboxLoginBtn);
  await popup.waitForLoadState('networkidle');

  // ── 5. Confirm simulated payment ────────────────────────────────────────────
  const confirmButton = popup.locator(SELECTORS.sandboxConfirmBtn);
  await confirmButton.waitFor({ state: 'visible', timeout: 15_000 });
  await confirmButton.click();

  // ── 6. Wait for the popup to close (successful return to London Drugs UAT) ──
  await popup.waitForEvent('close', { timeout: 30_000 });
}
