/**
 * React type shim for DTS build
 * This declares minimum React types needed for hooks compilation
 */

declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createElement(type: any, props?: any, ...children: any[]): any;
  export const Fragment: unique symbol;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ReactNode = any;
}
