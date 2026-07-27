/**
 * Type stub for @aws-amplify/backend
 * This allows the frontend to import type { Schema } from 'amplify/data/resource'
 * without needing the actual @aws-amplify/backend package installed.
 */
declare module '@aws-amplify/backend' {
  export type ClientSchema<T> = any;
  export const a: any;
  export function defineData(config: any): any;
}

/**
 * Override aws-amplify/data to make generateClient return a fully untyped client.
 * This prevents TS2339 errors when accessing properties on result.data
 * which the default types resolve as 'any[]' when Schema is 'any'.
 */
declare module 'aws-amplify/data' {
  export function generateClient<T = any>(options?: any): any;
}
