# new-use-slice

Small, typed and optimized React state-manager using paths for spot updates. It
has neat API similar to `React.useState`, it doesn't mutate original objects and
it may be used outside React too.

## Installation

```
npm install new-use-slice
```

or

```
yarn add new-use-slice
```

## Brief reference:

```js
import newUseSlice from 'new-use-slice';

export const useSlice = newUseSlice(initialStore);

const [slice, setSlice, getSlice, lisSlice] = useSlice.at(keyA, keyB, ...keys);

const Component = () => {
  const [slice, setSlice, getSlice, lisSlice] = useSlice(keyA, keyB, ...keys);

  return <></>;
};
```

## Usage

Import `newUseSlice` first:

```js
import newUseSlice from 'new-use-slice';
```

It accepts any value as initial store, from primitive types to complex objects.
Name your hooks starting with `use` word. If hooks should be used in multiple
components/utils then create separate file and export them.

```js
export const useSlice = newUseSlice(initialStore);
```

After that import and call created hooks:

```js
import { useSlice } from './';

const [slice, setSlice, getSlice, lisSlice] = useSlice.at(keyA, keyB, ...keys);
```

Every created hook accepts multiple `path` arguments to access the slice of
object/array you currently need (`useSlice(...path)`). The `path` arguments is
comma-separated list of keys. It could be empty, if you need to access whole
object/array or any primitive value. You should access only existing object
properties, i.e. if you attempt to access a property of undefined value you will
get an error.

When created hook called it starts to listen for store updates at passed `path`
and automatically updates React functional component where it's called.

Created hooks can be used outside React components too, just add `.at` before
calling them (`useSlice.at(...path)`). It returns same functions but doesn't
listen and update anything automatically, since we have no React component here.

Every call of created hook with different `path` arguments returns different
value and functions tailored for it. Those value and 3 functions are packed into
`[slice, setSlice, getSlice, lisSlice]` tuple:

- `slice` — current slice
- `setSlice(slice) | setSlice((prevSlice) => slice)` — set current slice
  directly or via function using previous slice (like `React.setState`)
- `getSlice() | getSlice(true)` — return current slice if `true` argument is not
  passed, otherwise return initial slice
- `lisSlice((slice) => {...})` — listen to slice changes and call passed
  listener function with current `slice` argument on any change

## Example

Create and export your hooks

```js
// stores.js

import newUseSlice from 'new-use-slice';

export const useCoordsAndSpeed = newUseSlice({
  coords: { x: 1, y: 2 },
  speed: 10,
});

export const useCounter = newUseSlice(0);
```

Import and use your hooks in React functional components:

```js
// Counter.js

import { useCoordsAndSpeed, useCounter } from './stores';

const Counter = () => {
  // similar to `React.useState`
  const [counter, setCounter] = useCounter();

  // if you only need to rerender this component on `y` updates
  // then no need to destruct returned tuple
  useCoordsAndSpeed('coords', 'y');

  // full list of functions in returned tuple
  // `getCoords` is useful in callbacks
  // `lisCoords` is useful in `React.useEffect`
  const [coords, setCoords, getCoords, lisCoords] = useCoordsAndSpeed('coords');

  // log on every `coords` change
  useEffect(() => lisCoords(console.log), []);

  return (
    <div>
      <p>
        coords: [{coords.x}, {coords.y}]
      </p>
      <button onClick={() => setCoords(({ x, y }) => ({ x: x + 1, y: y + 1 }))}>
        <p>increase both x and y</p>
      </button>
      <button onClick={() => setCoords(getCoords(true))}>
        <p>reset coords</p>
      </button>
      <button onClick={() => console.log(getCoords())}>
        <p>log coords</p>
      </button>
      <p>counter: {counter}</p>
      <button onClick={() => setCounter(0)}>
        <p>set counter to 0</p>
      </button>
      <button onClick={() => setCounter(1)}>
        <p>set counter to 1</p>
      </button>
    </div>
  );
};
```

Import and use it anywhere outside React components, just add `.at` to your
hooks:

```js
// utils.js

import { useCoordsAndSpeed } from './stores';

// get functions as usual
const [coords, setCoords, getCoords, lisCoords] =
  useCoordsAndSpeed.at('coords');

// -> { x: 1, y: 2 }
console.log(coords);

// update `coords` slice
setCoords({ x: 3, y: 5 });

// -> { x: 1, y: 2 } // `coords` slice is immutable
console.log(coords);

// -> { x: 3, y: 5 } // get current value of `coords` slice
console.log(getCoords());

// -> { x: 1, y: 2 } // get initial value of `coords` slice
console.log(getCoords(true));

// get only functions you need
const [x, setX] = useCoordsAndSpeed.at('coords', 'x');

// no sense outside React component cause we don't listen here
useCoordsAndSpeed.at('coords', 'y');

// -> 3 // since we set coords before
console.log(x);

// update `coords.x` slice
setX(23);

// -> 23
console.log(x);

// -> { x: 23, y: 5 } // since we updated `coords.x`
console.log(getCoords());
```
