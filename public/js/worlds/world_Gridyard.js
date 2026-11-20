var world_Gridyard = new function() {
  World_Base.call(this);
  this.parent = {};
  for (p in this) {
    this.parent[p] = this[p];
  }

  var self = this;

  this.name = 'gridyard';
  this.shortDescription = 'Gridyard (large grid)';
  this.longDescription =
    '<p>A large grid yard for long drives and big courses.</p>' +
    '<p>Each large square is 20cm, while each small square is 5cm.</p>';
  this.thumbnail = 'images/worlds/grid.jpg';

  this.optionsConfigurations = [
    {
      option: 'length',
      title: 'Length of field (cm)',
      type: 'slider',
      min: '100',
      max: '3000',
      step: '10'
    },
    {
      option: 'width',
      title: 'Width of field (cm)',
      type: 'slider',
      min: '100',
      max: '3000',
      step: '10'
    },
    {
      option: 'wall',
      title: 'Wall',
      type: 'checkbox',
      label: 'Wall Present'
    },
    {
      option: 'wallHeight',
      title: 'Wall Height (cm)',
      type: 'slider',
      min: '0',
      max: '30',
      step: '0.1'
    },
    {
      option: 'wallThickness',
      title: 'Wall Thickness (cm)',
      type: 'slider',
      min: '0',
      max: '30',
      step: '0.1'
    },
    {
      option: 'startPos',
      title: 'Starting Position',
      type: 'select',
      options: [
        ['Center', 'center'],
        ['Bottom Left', 'bottomLeft'],
        ['Bottom Center', 'bottomCenter'],
        ['Bottom Right', 'bottomRight'],
        ['Player 0', 'P0'],
        ['Player 1', 'P1'],
        ['Player 2', 'P2'],
        ['Player 3', 'P3'],
      ]
    },
    {
      option: 'startPosXYZStr',
      title: 'Starting Position (x, y)',
      type: 'text',
      help: 'Enter using this format "x, y" (without quotes) and it will override the above. Center of image is "0, 0".'
    },
    {
      option: 'startRotStr',
      title: 'Starting Rotation (degrees)',
      type: 'text',
      help: 'Set the starting rotation in degrees. Positive rotation is clockwise.'
    }
  ];

  this.defaultOptions = Object.assign(this.defaultOptions, {
    imageURL: 'textures/maps/grid.png',
    imageScale: '2.353',
    length: 2000,
    width: 2000,
    wallHeight: 10,
    wallThickness: 5,
    wallColor: 'B3B3B3'
  });

  // Yard features. Units are cm, origin at the center, floor at y = 0.
  // Boxes use size [width along x, depth along z, height] and a center position.
  var wallColor = '#B3B3B3';

  function box(x, z, w, d, h, color) {
    return {
      type: 'box',
      position: [x, h / 2, z],
      size: [w, d, h],
      color: color,
      physicsOptions: 'fixed'
    };
  }

  // Simple repeatable pseudo-random numbers so every load builds the same yard
  function seeded(seed) {
    let state = seed;
    return function() {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  this.buildYardObjects = function() {
    let objects = [];

    // Lab building with a doorway on its south side
    let labX = 400, labZ = -300;
    objects.push(box(labX, -500, 600, 20, 150, wallColor));   // north
    objects.push(box(100, -300, 20, 400, 150, wallColor));    // west
    objects.push(box(700, -300, 20, 400, 150, wallColor));    // east
    objects.push(box(220, -100, 240, 20, 150, wallColor));    // south, left of door
    objects.push(box(580, -100, 240, 20, 150, wallColor));    // south, right of door

    // Parking lot with stall lines
    objects.push(box(-600, 700, 600, 400, 1, '#4A4A4A'));
    for (let i = 0; i < 5; i++) {
      objects.push(box(-800 + i * 100, 700, 4, 150, 1, '#FFFFFF'));
    }

    // Used robot parts yard, fenced, with piles of parts
    objects.push(box(700, 900, 400, 10, 30, wallColor));      // fence north
    objects.push(box(700, 500, 400, 10, 30, wallColor));      // fence south
    objects.push(box(500, 700, 10, 400, 30, wallColor));      // fence west
    objects.push(box(900, 700, 10, 400, 30, wallColor));      // fence east
    let random = seeded(7);
    for (let i = 0; i < 14; i++) {
      let size = 20 + Math.floor(random() * 40);
      let x = 530 + random() * 340;
      let z = 530 + random() * 340;
      objects.push(box(x, z, size, size, 10 + random() * 30, '#8C6A3F'));
    }

    // Gated entry: two posts and a closed gate across the lane
    objects.push(box(-100, -900, 30, 30, 120, '#FEC627'));
    objects.push(box(100, -900, 30, 30, 120, '#FEC627'));
    objects.push(box(0, -900, 170, 10, 25, '#FEC627'));

    return objects;
  };

  // Set options, including default
  this.setOptions = function(options) {
    self.mergeOptionsWithDefault(options);

    self.options.uScale = self.options.width / 20;
    self.options.vScale = self.options.length / 20;

    return this.parent.setOptions(options);
  };

  // Run on page load
  this.init = function() {
    self.defaultOptions.objects = self.buildYardObjects();
    Object.assign(self.options, self.defaultOptions);
  };
}

// Init class
world_Gridyard.init();

if (typeof worlds == 'undefined') {
  var worlds = [];
}
worlds.push(world_Gridyard);