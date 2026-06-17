/**
 * @file testData.ts
 * @description Centralized UAT test data store for London Drugs automation suite.
 *              All credentials, test cards and shipping addresses are maintained here.
 *              DO NOT hardcode these values inside test files or skill modules.
 */

// ─── Type Definitions ──────────────────────────────────────────────────────────

/** Store or sandbox login credentials */
export interface AuthData {
  email: string;
  password: string;
}

/** Credit / debit card data for payment gateway */
export interface CardData {
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
  /** Human-readable label used for test reporting */
  label: string;
}

/** Full shipping / billing address */
export interface AddressData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  /** Optional second address line (suite, unit, etc.) */
  addressLine2?: string;
  postalCode: string;
  city: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "CA" */
  country: string;
  /** Province / state code, e.g. "AB" */
  province: string;
}

// ─── Credentials ───────────────────────────────────────────────────────────────

/**
 * TEST_CREDENTIALS
 * Authorised automation accounts for UAT and PayPal Sandbox environments.
 */
export const TEST_CREDENTIALS = {
  /** Registered store user for London Drugs UAT */
  storeUser: {
    email: 'VZambudio@londondrugs.com',
    password: 'Nemesis31*',
  } satisfies AuthData,

  /** PayPal Sandbox buyer account */
  paypalSandbox: {
    email: 'Accept_1362518480_per@londondrugs.com',
    password: '12345678',
  } satisfies AuthData,

  /** KIBO Commerce admin console (sandbox) */
  kiboAdmin: {
    email: 'VZambudio@londondrugs.com',
    password: 'Nemesis33*',
  } satisfies AuthData,
} as const;

// ─── Test Cards ────────────────────────────────────────────────────────────────

/**
 * TEST_CARDS
 * Payment cards approved for use in the UAT environment.
 * Add declined / error variants under the `declined` key as needed.
 */
export const TEST_CARDS = {
  /** Standard VISA that produces a successful authorisation in UAT */
  visaSuccess: {
    number: '4111111111111111',
    expiry: '12/2027',
    cvv: '123',
    holder: 'test',
    label: 'VISA-success-4111',
  } satisfies CardData,

  /**
   * Placeholder for a card that triggers a decline response.
   * Populate when a declined-card test case is added to the suite.
   */
  visaDeclined: {
    number: '4000000000000002',
    expiry: '12/2028',
    cvv: '123',
    holder: 'test',
    label: 'VISA-declined-4000',
  } satisfies CardData,
} as const;

// ─── Shipping Addresses ────────────────────────────────────────────────────────

/**
 * SHIPPING_ALBERTA
 * Mandatory delivery address for all UAT checkout scenarios.
 * Derived from the Sherwood Park, AB test account used by the QA team.
 */
export const SHIPPING_ALBERTA: AddressData = {
  firstName: 'Automation',
  lastName: 'Accept',
  email: 'test_Virginia@yopmail.com',
  phone: '1(080) 033-3123',
  addressLine1: '301A-975 Fir St',
  postalCode: 'T8A 4N5',
  city: 'Sherwood Park',
  country: 'CA',
  province: 'AB',
};
