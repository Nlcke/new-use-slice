# new-use-slice

Small, typed and optimized React state-manager using paths for spot updates.

## Installation

```
npm install new-use-slice
```

or

```
or yarn add new-use-slice
```

## Usage

Import `newUseSlice` from `new-use-slice` and create new `useSlice`. You may
pass any value to it.

```js
import newUseSlice from 'new-use-slice';

const useSlice = newUseSlice({ coords: { x: 1, y: 2 } });

export default useSlice;
```

Import and use created hook in your React functional components:

```js
import useSlice from './useSlice';

const Counter = () => {
  const [coords, setCoords, getCoords] = useSlice('coords');

  return (
    <div>
      <p>
        coords: [{coords.x}, {coords.y}]
      </p>
      <button onClick={() => setCoords(({ x, y }) => ({ x: x + 1, y: y + 1 }))}>
        <p>increase both x and y</p>
      </button>
      <button onClick={() => setCoords(getCoords)}>
        <p>reset coords</p>
      </button>
      <button onClick={() => console.log(getCoords())}>
        <p>log coords</p>
      </button>
    </div>
  );
};
```
