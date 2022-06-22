import { useRef, useState, useLayoutEffect } from 'react';

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
    const pathRef = useRef(path);
    pathRef.current = path;

    /** @type {React.MutableRefObject<any>} */
    const getSliceRef = useRef();
    if (getSliceRef.current === undefined) {
      getSliceRef.current = () => {
        /** @type {any} */
        let slice = storeRef.current;
        const path = pathRef.current;
        for (let i = 0; i < path.length; i++) {
          slice = slice[path[i]];
        }
        return slice;
      };
    }

    const [slice, setState] = useState(getSliceRef.current);
    const sliceRef = useRef(slice);
    sliceRef.current = slice;

    /** @type {React.MutableRefObject<any>} */
    const setSliceRef = useRef();
    if (setSliceRef.current === undefined) {
      setSliceRef.current = (/** @type {any} */ sliceOrFn) => {
        const prevSlice = getSliceRef.current();
        const path = pathRef.current;
        let slice =
          typeof sliceOrFn === 'function' ? sliceOrFn(prevSlice) : sliceOrFn;
        if (sliceOrFn === getSliceRef.current) {
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
      };
    }

    /** @type {React.MutableRefObject<any>} */
    const listenerRef = useRef();
    if (listenerRef.current === undefined) {
      listenerRef.current = () => {
        const nextSlice = getSliceRef.current();
        if (sliceRef.current !== nextSlice) {
          setState(nextSlice);
        }
      };
    }

    /** @type {React.MutableRefObject<any>} */
    const effectRef = useRef();
    if (effectRef.current === undefined) {
      effectRef.current = () => {
        listeners.add(listenerRef.current);
        return () => {
          listeners.delete(listenerRef.current);
        };
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(effectRef.current, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(listenerRef.current, path);

    // @ts-ignore
    return [slice, setSliceRef.current, getSliceRef.current];
  };

  return useSlice;
};

export default newUseSlice;
