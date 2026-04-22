# Starrysky.js

Dynamic starry sky animation with smooth rotation, twinkling stars and realistic meteor effects.
Zero dependencies, lightweight and ready for production.

---

## Installation

```bash
npm install starrysky
```

Or via CDN:

```html
<script src="https://unpkg.com/starrysky/dist/starrysky.min.js"></script>
```

---

## Basic Usage

### ES Modules

```js
import Starrysky from 'starrysky';

Starrysky({
  starDensity: 0.0015,
  enableMeteors: true
});
```

### Browser

```html
<script src="starrysky.min.js"></script>
<script>
  Starrysky();
</script>
```

---

## Configuration

| Option                | Type        | Default       | Description                      |
| --------------------- | ----------- | ------------- | -------------------------------- |
| container             | HTMLElement | document.body | Container element for the canvas |
| starCount             | number      | auto          | Fixed number of stars            |
| starDensity           | number      | 0.001         | Stars per pixel ratio            |
| starColors            | array       | see source    | RGB color array                  |
| starMinSize           | number      | 0.2           | Minimum star radius              |
| starMaxSize           | number      | 1.7           | Maximum star radius              |
| starTwinkleSpeed      | number      | 0.004         | Twinkle animation speed          |
| rotationSpeed         | number      | 0.0003        | Sky rotation speed               |
| enableMeteors         | boolean     | true          | Enable meteor system             |
| maxMeteorsAtOnce      | number      | 5             | Max concurrent meteors           |
| firstMeteorDelay      | number      | 1000          | Delay before first meteor (ms)   |
| meteorMinDelay        | number      | 10000         | Min delay between meteors (ms)   |
| meteorMaxDelay        | number      | 25000         | Max delay between meteors (ms)   |
| meteorBurstChance     | number      | 0.01          | Meteor burst probability         |
| meteorBurstDelayMin   | number      | 20000         | Min burst delay (ms)             |
| meteorBurstDelayMax   | number      | 50000         | Max burst delay (ms)             |
| meteorSpeed           | number      | 3             | Meteor velocity                  |
| meteorSizeMin         | number      | 1.2           | Min meteor size                  |
| meteorSizeMax         | number      | 3.2           | Max meteor size                  |
| meteorTailLength      | number      | 60            | Trail length                     |
| meteorLifeReduction   | number      | 0.007         | Life decay per frame             |
| fadeDuration          | number      | 0             | Fade-in duration (ms)            |
| starsFadeDelay        | number      | 0             | Stars fade delay (ms)            |
| meteorsFadeDelay      | number      | 0             | Meteors fade delay (ms)          |
| fadeEasing            | string      | smooth        | Easing type                      |
| canvasId              | string      | auto          | Canvas ID                        |
| canvasZIndex          | number      | -2            | Canvas z-index                   |
| autoPauseOnTabChange  | boolean     | true          | Pause on tab inactive            |
| autoResumeOnTabReturn | boolean     | true          | Resume on tab active             |
| preserveTimeOnPause   | boolean     | true          | Keep animation timing            |
| debug                 | boolean     | false         | Enable logs                      |

---

## API Methods

### Control

```js
Starrysky.pause();
Starrysky.resume();
Starrysky.stop();
Starrysky.restart(config);
```

### State

```js
Starrysky.isRunning();
Starrysky.isPaused();
Starrysky.getStats();
Starrysky.getConfig();
```

### Update

```js
Starrysky.updateConfig(newConfig);
```

---

## Multi-instance

```js
const instance1 = Starrysky.create('sky-1');
instance1.start({ starDensity: 0.001 });

const instance2 = Starrysky.create('sky-2');
instance2.start({
  starDensity: 0.002,
  container: document.getElementById('hero')
});
```

---

## Events

| Event         | Parameters        | Description                  |
| ------------- | ----------------- | ---------------------------- |
| onStart       | instance          | Called when animation starts |
| onStop        | instance          | Called when animation stops  |
| onPause       | -                 | Called when paused           |
| onResume      | -                 | Called when resumed          |
| onMeteor      | meteor            | Meteor created               |
| onMeteorEnd   | meteor            | Meteor removed               |
| onMeteorBurst | meteors           | Burst event                  |
| onStarCreated | star, index       | Star created                 |
| onResize      | { width, height } | Window resized               |

---

## Example

```js
const sky = Starrysky({
  container: document.getElementById('hero'),
  starDensity: 0.0012,
  rotationSpeed: 0.00015,
  enableMeteors: true,
  meteorSpeed: 2.5,
  fadeDuration: 2000,
  starsFadeDelay: 500,
  fadeEasing: 'ease-out',
  debug: false,

  onStart: () => console.log('Sky animation started'),
  onMeteor: (meteor) => console.log('Meteor created', meteor)
});
```

---

## Browser Support

All modern browsers with Canvas support:

* Chrome 60+
* Firefox 55+
* Safari 12+
* Edge 79+

---

## Development

```bash
npm install
npm run build
```

---

## License

This project is licensed under the MIT License – see the [LICENSE](./LICENSE) file for details.

---

## Author

**StarTX**
