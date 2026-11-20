var world_Gridyard = new function() {
  World_Base.call(this);
  this.parent = {};
  for (p in this) {
    this.parent[p] = this[p];
  }

  var self = this;

  this.name = 'gridyard';
  this.shortDescription = 'The Proving Ground';
  this.longDescription =
    '<p>The Proving Ground: a large grid yard with a lab, parking, a parts yard, an airstrip and a test track.</p>' +
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
    imageURL: 'textures/maps/proving_ground_grass.png',
    imageScale: '2.353',
    length: 2000,
    width: 2000,
    wallHeight: 10,
    wallThickness: 5,
    wallColor: 'B3B3B3'
  });

  // Yard features. Units are cm, origin at the center, floor at height 0.
  // World positions are [x, z, height], matching the other worlds (for example Football).
  // Boxes use size [width along x, depth along z, height] and a center position.
  var wallColor = '#B3B3B3';

  function box(x, z, w, d, h, color) {
    return {
      type: 'box',
      position: [x, z, h / 2],
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

  // Box with an explicit center height, for signs and anything floating
  function boxAt(x, y, z, w, d, h, color) {
    return {
      type: 'box',
      position: [x, z, y],
      size: [w, d, h],
      color: color,
      physicsOptions: 'fixed'
    };
  }

  // Ground pad with its own texture, sitting just above the floor.
  // Textures tile every 20 cm, the same as the floor.
  function pad(x, z, w, d, textureURL) {
    return {
      type: 'box',
      position: [x, z, 0.5],
      size: [w, d, 1],
      color: '#FFFFFF',
      imageType: 'top',
      imageURL: textureURL,
      uScale: w / 20,
      vScale: d / 20,
      physicsOptions: 'fixed'
    };
  }
  var ASPHALT = 'textures/maps/proving_ground_asphalt.png';
  var CONCRETE = 'textures/maps/proving_ground_concrete.png';
  var GRAVEL = 'textures/maps/proving_ground_gravel.png';

  this.buildYardObjects = function() {
    let objects = [];

    // Ground pads first so everything else sits on top of them
    objects.push(pad(-500, -400, 800, 60, ASPHALT));          // airstrip runway
    objects.push(pad(-600, 700, 600, 400, ASPHALT));          // parking lot
    objects.push(pad(0, 250, 500, 350, ASPHALT));             // test track
    objects.push(pad(0, -500, 200, 800, CONCRETE));           // road from gate to lab
    objects.push(pad(400, -50, 600, 100, CONCRETE));          // plaza in front of lab
    objects.push(pad(400, -300, 560, 360, CONCRETE));         // lab floor
    objects.push(pad(700, 700, 400, 400, GRAVEL));            // parts yard ground

    // Lab building with a doorway on its south side
    objects.push(box(400, -500, 600, 20, 150, wallColor));    // north
    objects.push(box(100, -300, 20, 400, 150, wallColor));    // west
    objects.push(box(700, -300, 20, 400, 150, wallColor));    // east
    objects.push(box(220, -100, 240, 20, 150, wallColor));    // south, left of door
    objects.push(box(580, -100, 240, 20, 150, wallColor));    // south, right of door

    // Parking stall lines
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

    // Entry sign just inside the gate: navy board, yellow trim, on two posts.
    // The name is not printed on it yet; that needs a texture image.
    objects.push(boxAt(-150, 60, -960, 6, 6, 120, '#14213D'));  // left post
    objects.push(boxAt(150, 60, -960, 6, 6, 120, '#14213D'));   // right post
    objects.push(boxAt(0, 105, -960, 340, 4, 60, '#14213D'));   // sign board
    objects.push(boxAt(0, 75, -960, 340, 4, 6, '#FEC627'));     // yellow trim

    // Airstrip center dashes
    for (let i = 0; i < 7; i++) {
      objects.push(box(-850 + i * 100, -400, 40, 3, 1, '#FFFFFF'));
    }

    // Test track barrier loop and two chicane blocks
    let tx = 0, tz = 250;
    objects.push(box(tx, tz - 175, 500, 10, 15, '#FF6B1A'));            // north barrier
    objects.push(box(tx, tz + 175, 500, 10, 15, '#FF6B1A'));            // south barrier
    objects.push(box(tx - 250, tz, 10, 350, 15, '#FF6B1A'));            // west barrier
    objects.push(box(tx + 250, tz, 10, 350, 15, '#FF6B1A'));            // east barrier
    objects.push(box(tx - 80, tz - 40, 20, 80, 10, '#FF6B1A'));         // chicane block 1
    objects.push(box(tx + 80, tz + 40, 20, 80, 10, '#FF6B1A'));         // chicane block 2

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