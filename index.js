import { useRef, useState, useEffect, useLayoutEffect } from 'react';

const { isArray } = Array;

const useIsomorphicEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** @type {(store: any, path: any[]) => any} */
const readSlice = (store, path) => {
  const length = path.length;

  switch (length) {
    case 0:
      return store;
    case 1:
      return store[path[0]];
    case 2:
      return store[path[0]][path[1]];
    case 3:
      return store[path[0]][path[1]][path[2]];
    case 4:
      return store[path[0]][path[1]][path[2]][path[3]];
    case 5:
      return store[path[0]][path[1]][path[2]][path[3]][path[4]];
    case 6:
      return store[path[0]][path[1]][path[2]][path[3]][path[4]][path[5]];
    case 7:
      return store[path[0]][path[1]][path[2]][path[3]][path[4]][path[5]][
        path[6]
      ];
    case 8:
      return store[path[0]][path[1]][path[2]][path[3]][path[4]][path[5]][
        path[6]
      ][path[7]];
  }

  let slice = store;
  for (let i = 0; i < length; i++) {
    slice = slice[path[i]];
  }
  return slice;
};

/** @type {<Store>(store: Store, path: any[], slice: any) => Store} */
const getNextStore = (store, path, slice) => {
  /** @type {any} */
  const nextStore = isArray(store) ? [...store] : { ...store };
  let child = nextStore;
  const lastIndex = path.length - 1;
  for (let i = 0; i < lastIndex; i++) {
    const segment = path[i];
    const subChild = child[segment];
    child[segment] = isArray(subChild) ? [...subChild] : { ...subChild };
    child = child[segment];
  }
  child[path[lastIndex]] = slice;
  return nextStore;
};

/**
 * @typedef {undefined} U
 */

/**
 * @template P
 * @typedef {Exclude<P, U>} S
 */

/**
 * @template Slice
 * @typedef {() => void} Unlisten
 */

/**
 * @template T
 * @typedef {[
 *   slice: T,
 *   setSlice: (slice: T | ((slice: T) => T)) => void,
 *   getSlice: (initial?: boolean) => T,
 *   lisSlice: (listener: (slice: T) => void) => Unlisten<T>
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
 * @type {<Store>(initialStore: Store) => UseSlice<Store> & {at: UseSlice<Store>}}
 */
const newUseSlice = (initialStore) => {
  /** @type {Set<() => void>} */
  const listeners = new Set();

  let store = initialStore;

  /** @type {UseSlice<typeof initialStore> & {at: UseSlice<typeof initialStore>}} */
  // @ts-ignore
  const useSlice = (...path) => {
    const pathRef = useRef(path);
    pathRef.current = path;

    /** @type {React.MutableRefObject<(initial?: boolean) => any>} */
    // @ts-ignore
    const getSliceRef = useRef();
    if (getSliceRef.current === undefined) {
      getSliceRef.current = (initial) =>
        readSlice(initial ? initialStore : store, pathRef.current);
    }

    const [slice, setState] = useState(getSliceRef.current);
    const sliceRef = useRef(slice);
    sliceRef.current = slice;

    /** @type {React.MutableRefObject<(sliceOrFn: any) => void>} */
    // @ts-ignore
    const setSliceRef = useRef();
    if (setSliceRef.current === undefined) {
      setSliceRef.current = (sliceOrFn) => {
        const path = pathRef.current;
        const prevSlice = readSlice(store, pathRef.current);
        const slice =
          typeof sliceOrFn !== 'function' ? sliceOrFn : sliceOrFn(prevSlice);
        if (slice !== prevSlice) {
          store = path.length > 0 ? getNextStore(store, path, slice) : slice;
          for (const listener of listeners) {
            listener();
          }
        }
      };
    }

    /** @type {React.MutableRefObject<() => void>} */
    // @ts-ignore
    const listenerRef = useRef();
    if (listenerRef.current === undefined) {
      listenerRef.current = () => {
        const nextSlice = getSliceRef.current();
        if (sliceRef.current !== nextSlice) {
          setState(nextSlice);
        }
      };
    }

    /** @type {React.MutableRefObject<() => () => void>} */
    // @ts-ignore
    const effectRef = useRef();
    if (effectRef.current === undefined) {
      effectRef.current = () => {
        listeners.add(listenerRef.current);
        return () => {
          listeners.delete(listenerRef.current);
        };
      };
    }

    useIsomorphicEffect(effectRef.current, []);

    useIsomorphicEffect(listenerRef.current, path);

    /** @type {React.MutableRefObject<(listener: (slice: any) => void) => () => void>} */
    // @ts-ignore
    const lisSliceRef = useRef();
    if (lisSliceRef.current === undefined) {
      lisSliceRef.current = (listener) => {
        let slice = readSlice(store, pathRef.current);
        const listenerWrapper = () => {
          const nextSlice = readSlice(store, pathRef.current);
          if (slice !== nextSlice) {
            slice = nextSlice;
            listener(nextSlice);
          }
        };
        listeners.add(listenerWrapper);
        return () => {
          listeners.delete(listenerWrapper);
        };
      };
    }

    // @ts-ignore
    return [
      slice,
      setSliceRef.current,
      getSliceRef.current,
      lisSliceRef.current,
    ];
  };

  /** @type {UseSlice<typeof initialStore>} */
  useSlice.at = (...path) => {
    /** @type {(initial?: boolean) => any} */
    const getSlice = (initial) =>
      readSlice(initial ? initialStore : store, path);

    const slice = readSlice(store, path);

    /** @type {(sliceOrFn: any) => void} */
    const setSlice = (sliceOrFn) => {
      const prevSlice = readSlice(store, path);
      const slice =
        typeof sliceOrFn !== 'function' ? sliceOrFn : sliceOrFn(prevSlice);
      if (slice !== prevSlice) {
        store = path.length > 0 ? getNextStore(store, path, slice) : slice;
        for (const listener of listeners) {
          listener();
        }
      }
    };

    /** @type {(listener: (slice: any) => void) => () => void} */
    const lisSlice = (listener) => {
      let slice = readSlice(store, path);
      const listenerWrapper = () => {
        const nextSlice = readSlice(store, path);
        if (slice !== nextSlice) {
          slice = nextSlice;
          listener(nextSlice);
        }
      };
      listeners.add(listenerWrapper);
      const unlisten = () => {
        listeners.delete(listenerWrapper);
      };
      return unlisten;
    };

    // @ts-ignore
    return [slice, setSlice, getSlice, lisSlice];
  };

  return useSlice;
};

export default newUseSlice;
