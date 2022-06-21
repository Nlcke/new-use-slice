import { useCallback, useState, useEffect, useRef } from 'react';

const { isArray } = Array;

/** @typedef {undefined} U */

/**
 * @template P
 * @typedef {Exclude<P, U>} S
 */

/**
 * @template T
 * @typedef {[
 *   slice: T,
 *   setSlice: (slice: T | ((slice: T) => T)) => void,
 *   getSlice: () => T
 * ]} UseSliceResult
 */

/**
 * @template N
 * @typedef {<
 * P1 extends keyof N | U = U,
 * P2 extends keyof N[S<P1>] | U = U,
 * P3 extends keyof N[S<P1>][S<P2>] | U = U,
 * P4 extends keyof N[S<P1>][S<P2>][S<P3>] | U = U,
 * P5 extends keyof N[S<P1>][S<P2>][S<P3>][S<P4>] | U = U,
 * P6 extends keyof N[S<P1>][S<P2>][S<P3>][S<P4>][S<P5>] | U = U,
 * P7 extends keyof N[S<P1>][S<P2>][S<P3>][S<P4>][S<P5>][S<P6>] | U = U,
 * P8 extends keyof N[S<P1>][S<P2>][S<P3>][S<P4>][S<P5>][S<P6>][S<P7>] | U = U,
 * P9 extends keyof N[S<P1>][S<P2>][S<P3>][S<P4>][S<P5>][S<P6>][S<P7>][S<P8>] | U = U,
 * > (p1?: P1, p2?: P2, p3?: P3, p4?: P4, p5?: P5, p6?: P6, p7?: P7, p8?: P8, p9?: P9) =>
 * P1 extends U ? UseSliceResult<N> :
 * P2 extends U ? UseSliceResult<N[S<P1>]> :
 * P3 extends U ? UseSliceResult<N[S<P1>][S<P2>]> :
 * P4 extends U ? UseSliceResult<N[S<P1>][S<P2>][S<P3>]> :
 * P5 extends U ? UseSliceResult<N[S<P1>][S<P2>][S<P3>][S<P4>]> :
 * P6 extends U ? UseSliceResult<N[S<P1>][S<P2>][S<P3>][S<P4>][S<P5>]> :
 * P7 extends U ? UseSliceResult<N[S<P1>][S<P2>][S<P3>][S<P4>][S<P5>][S<P6>]> :
 * P8 extends U ? UseSliceResult<N[S<P1>][S<P2>][S<P3>][S<P4>][S<P5>][S<P6>][S<P7>]> :
 * UseSliceResult<N[S<P1>][S<P2>][S<P3>][S<P4>][S<P5>][S<P6>][S<P7>][S<P8>]>
 * } UseSlice
 */

/**
 * @type {<Store>(initialStore: Store) => UseSlice<Store>}
 */
const newUseSlice = (initialStore) => {
  /** @type {Set<() => void>} */
  const listeners = new Set();

  const storeRef = { current: initialStore };

  /** @type {UseSlice<typeof initialStore>} */
  const useSlice = (...path) => {
    const getSlice = useCallback(() => {
      /** @type {any} */
      let slice = storeRef.current;
      for (let i = 0; i < path.length; i++) {
        slice = slice[path[i]];
      }
      return slice;
    }, path);

    const [slice, setState] = useState(getSlice);

    const setSlice = useCallback((/** @type {any} */ sliceOrFn) => {
      const prevSlice = getSlice();
      let slice =
        typeof sliceOrFn === 'function' ? sliceOrFn(prevSlice) : sliceOrFn;
      if (sliceOrFn === getSlice) {
        slice = initialStore;
        for (let i = 0; i < path.length; i++) {
          slice = slice[path[i]];
        }
      }
      if (slice === prevSlice) {
        return;
      }
      if (path.length > 0) {
        const prevStore = storeRef.current;
        /** @type {any} */
        const nextStore = isArray(prevStore)
          ? [...prevStore]
          : { ...prevStore };
        let store = nextStore;
        const lastIndex = path.length - 1;
        for (let i = 0; i < lastIndex; i++) {
          const segment = path[i];
          const child = store[segment];
          store[segment] = isArray(child) ? [...child] : { ...child };
          store = store[segment];
        }
        store[path[lastIndex]] = slice;
        storeRef.current = nextStore;
      } else {
        storeRef.current = slice;
      }
      for (const listener of listeners) {
        listener();
      }
    }, path);

    const sliceRef = useRef(slice);
    sliceRef.current = slice;

    const listener = useCallback(() => {
      const slice = getSlice();
      if (sliceRef.current != slice) {
        setState(slice);
      }
    }, path);

    const effect = useCallback(() => {
      listener();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, [listener]);

    useEffect(effect, [effect]);

    // @ts-ignore
    return [slice, setSlice, getSlice];
  };

  return useSlice;
};

export default newUseSlice;
