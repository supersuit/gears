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
    length: 1000,
    width: 1000,
    wallHeight: 10,
    wallThickness: 5,
    wallColor: 'B3B3B3'
  });

  // Yard features. Layout is drawn in full-size cm (origin at the center) and
  // scaled by S so the whole yard fits a 1000 cm field.
  // World positions are [x, z, height], matching the other worlds (for example Football).
  var S = 0.5;
  var wallColor = '#B3B3B3';
  var ASPHALT = 'textures/maps/proving_ground_asphalt.png';
  var CONCRETE = 'textures/maps/proving_ground_concrete.png';
  var GRAVEL = 'textures/maps/proving_ground_gravel.png';
  var ORANGE = '#FF6B1A';
  var YELLOW = '#FEC627';
  var NAVY = '#14213D';

  // Solid box standing on the ground
  function box(x, z, w, d, h, color) {
    return boxAt(x, h / 2, z, w, d, h, color);
  }

  // Box with an explicit center height, for signs, roofs, and anything raised
  function boxAt(x, y, z, w, d, h, color) {
    return {
      type: 'box',
      position: [x * S, z * S, y * S],
      size: [w * S, d * S, h * S],
      color: color,
      physicsOptions: false
    };
  }

  // Ground pad with its own texture, sitting just above the floor.
  // Textures tile every 20 cm, the same as the floor.
  function pad(x, z, w, d, textureURL) {
    return {
      type: 'box',
      position: [x * S, z * S, 0.5],
      size: [w * S, d * S, 1],
      color: '#FFFFFF',
      imageType: 'top',
      imageURL: textureURL,
      uScale: (w * S) / 20,
      vScale: (d * S) / 20,
      physicsOptions: false
    };
  }

  // Flat sign panel lying on a roof. The texture shows on the top face.
  function roofSign(x, z, w, d, h, textureURL) {
    return {
      type: 'box',
      position: [x * S, z * S, (h + 0.5) * S],
      size: [w * S, d * S, 1 * S],
      color: '#FFFFFF',
      imageType: 'top',
      imageURL: textureURL,
      uScale: 1,
      vScale: 1,
      physicsOptions: false
    };
  }
  var SIGN_TORQUE = 'textures/signs/torque_tacos.png';
  var SIGN_RELAY = 'textures/signs/relay_burgers.png';
  var SIGN_UNI = 'textures/signs/gridyard_university.png';

  // Traffic cone (small orange block)
  function cone(x, z) {
    return box(x, z, 8, 8, 12, '#FF8C00');
  }

  // Parked car: body with a roof on top
  function car(x, z, color) {
    return [
      box(x, z, 40, 80, 18, color),
      boxAt(x, 18 + 6, z, 32, 46, 12, '#222222')
    ];
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
    let add = function(list) {
      if (Array.isArray(list)) {
        list.forEach(function(o) { objects.push(o); });
      } else {
        objects.push(list);
      }
    };

    // ---- Ground pads first, so everything else sits on top ----
    add(pad(-500, -400, 800, 60, ASPHALT));                  // airstrip runway
    add(pad(-600, 700, 600, 400, ASPHALT));                  // parking lot
    add(pad(0, 250, 500, 350, ASPHALT));                     // test track
    add(pad(0, -500, 200, 800, CONCRETE));                   // road from gate to lab
    add(pad(400, -50, 600, 100, CONCRETE));                  // plaza in front of lab
    add(pad(400, -300, 560, 360, CONCRETE));                 // lab floor
    add(pad(700, 700, 400, 400, GRAVEL));                    // parts yard ground

    // ---- Lab building with a doorway on its south side ----
    add(box(400, -500, 600, 20, 150, wallColor));            // north
    add(box(100, -300, 20, 400, 150, wallColor));            // west
    add(box(700, -300, 20, 400, 150, wallColor));            // east
    add(box(220, -100, 240, 20, 150, wallColor));            // south, left of door
    add(box(580, -100, 240, 20, 150, wallColor));            // south, right of door
    // Inside: shelves, lab benches, and a server rack
    add(box(130, -300, 20, 300, 80, '#5C6B7A'));             // west shelving
    add(box(330, -380, 120, 40, 50, '#9AA3AE'));             // bench
    add(box(330, -240, 120, 40, 50, '#9AA3AE'));             // bench
    add(box(520, -300, 40, 120, 60, '#9AA3AE'));             // bench
    add(box(660, -420, 30, 40, 120, '#2E3A46'));             // server rack

    // ---- Plaza benches ----
    add(box(280, -50, 60, 20, 10, '#8B5E3C'));
    add(box(520, -50, 60, 20, 10, '#8B5E3C'));

    // ---- Parking: 10 stalls, 4 parked cars ----
    for (let i = 0; i < 10; i++) {
      add(box(-850 + i * 60, 700, 4, 150, 1, '#FFFFFF'));    // stall lines
    }
    add(car(-820, 700, '#C0392B'));
    add(car(-640, 700, '#2980B9'));
    add(car(-580, 700, '#7F8C8D'));
    add(car(-400, 700, '#F1C40F'));
    add(cone(-300, 500)); add(cone(-300, 900));              // lane cones

    // ---- Airstrip: runway dashes, edge lights, hangar, windsock ----
    for (let i = 0; i < 7; i++) {
      add(box(-850 + i * 100, -400, 40, 3, 1, '#FFFFFF'));   // center dashes
    }
    for (let i = 0; i < 8; i++) {
      add(box(-880 + i * 110, -432, 4, 4, 8, '#FFEE88'));    // north edge lights
      add(box(-880 + i * 110, -368, 4, 4, 8, '#FFEE88'));    // south edge lights
    }
    add(box(-300, -600, 160, 120, 60, '#B0B7C0'));            // hangar
    add(box(-150, -420, 4, 4, 80, '#FFFFFF'));                // windsock pole
    add(boxAt(-135, 70, -420, 30, 8, 10, ORANGE));            // windsock

    // ---- Test track: barrier loop, chicanes, cones, start line ----
    let tx = 0, tz = 250;
    add(box(tx, tz - 175, 500, 10, 15, ORANGE));              // north barrier
    add(box(tx, tz + 175, 500, 10, 15, ORANGE));              // south barrier
    add(box(tx - 250, tz, 10, 350, 15, ORANGE));              // west barrier
    add(box(tx + 250, tz, 10, 350, 15, ORANGE));              // east barrier
    add(box(tx - 80, tz - 40, 20, 80, 10, ORANGE));           // chicane 1
    add(box(tx + 80, tz + 40, 20, 80, 10, ORANGE));           // chicane 2
    add(box(tx - 160, tz + 90, 20, 60, 10, ORANGE));          // chicane 3
    add(box(tx + 160, tz - 90, 20, 60, 10, ORANGE));          // chicane 4
    add(box(tx - 200, tz, 4, 350, 1, '#FFFFFF'));             // start/finish line
    for (let i = 0; i < 5; i++) {
      add(cone(-200 + i * 100, tz - 150));                    // north cones
      add(cone(-200 + i * 100, tz + 150));                    // south cones
    }

    // ---- Parts yard: fence, crate piles, robot shells, pallets ----
    add(box(700, 900, 400, 10, 30, wallColor));               // fence north
    add(box(700, 500, 400, 10, 30, wallColor));               // fence south
    add(box(500, 700, 10, 400, 30, wallColor));               // fence west
    add(box(900, 700, 10, 400, 30, wallColor));               // fence east
    let random = seeded(7);
    for (let i = 0; i < 16; i++) {
      let size = 20 + Math.floor(random() * 30);
      let x = 530 + random() * 340;
      let z = 530 + random() * 340;
      add(box(x, z, size, size, 10 + random() * 30, '#8C6A3F'));
    }
    for (let i = 0; i < 6; i++) {
      let x = 560 + random() * 280;
      let z = 560 + random() * 280;
      add(box(x, z, 60, 40, 20, '#7A7F87'));                  // robot chassis
      add(box(x - 25, z - 25, 10, 10, 6, '#222222'));         // wheels
      add(box(x + 25, z - 25, 10, 10, 6, '#222222'));
      add(box(x - 25, z + 25, 10, 10, 6, '#222222'));
      add(box(x + 25, z + 25, 10, 10, 6, '#222222'));
    }
    for (let i = 0; i < 4; i++) {
      add(box(600 + i * 70, 850, 40, 40, 4, '#A0784A'));      // pallets
    }

    // ---- Gated entry: posts, closed gate, guard booth, sign ----
    add(box(-100, -900, 30, 30, 120, YELLOW));                // left post
    add(box(100, -900, 30, 30, 120, YELLOW));                 // right post
    add(box(0, -900, 170, 10, 25, YELLOW));                   // gate bar
    add(box(-200, -860, 40, 40, 60, '#333333'));              // guard booth
    add(cone(-120, -880)); add(cone(120, -880));
    // Entry sign just inside the gate: navy board with yellow trim on two posts.
    // The name is not printed on it yet; that needs a texture image.
    add(boxAt(-150, 60, -960, 6, 6, 120, NAVY));              // left post
    add(boxAt(150, 60, -960, 6, 6, 120, NAVY));               // right post
    add(boxAt(0, 105, -960, 340, 4, 60, NAVY));               // sign board
    add(boxAt(0, 75, -960, 340, 4, 6, YELLOW));               // yellow trim

    // ---- Road lamps ----
    [-850, -700, -550, -400, -250].forEach(function(z) {
      add(box(-120, z, 6, 6, 100, '#555555'));
      add(boxAt(-120, 100, z, 12, 12, 4, '#FFEE88'));
      add(box(120, z, 6, 6, 100, '#555555'));
      add(boxAt(120, 100, z, 12, 12, 4, '#FFEE88'));
    });

    // ---- Restaurant row, east of the test track ----
    add(box(400, 180, 120, 80, 50, '#C8B89A'));               // Torque Tacos
    add(roofSign(400, 180, 100, 60, 50, SIGN_TORQUE));
    add(box(400, 330, 120, 80, 50, '#B9C4CF'));               // Relay Burgers
    add(roofSign(400, 330, 100, 60, 50, SIGN_RELAY));
    add(box(400, 255, 8, 8, 20, '#555555'));                  // walkway post
    add(box(400, 405, 8, 8, 20, '#555555'));

    // ---- University building, west of the test track ----
    add(box(-420, 0, 260, 180, 80, '#D9D2C3'));               // main building
    add(roofSign(-420, 0, 220, 140, 80, SIGN_UNI));
    for (let i = 0; i < 4; i++) {
      add(box(-520 + i * 65, -100, 10, 10, 80, '#FFFFFF'));   // front columns
    }
    add(box(-420, -110, 120, 20, 4, '#8B5E3C'));              // entrance steps

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