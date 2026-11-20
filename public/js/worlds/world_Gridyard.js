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

  // Set options, including default
  this.setOptions = function(options) {
    self.mergeOptionsWithDefault(options);

    self.options.uScale = self.options.width / 20;
    self.options.vScale = self.options.length / 20;

    return this.parent.setOptions(options);
  };

  // Run on page load
  this.init = function() {
    Object.assign(self.options, self.defaultOptions);
  };
}

// Init class
world_Gridyard.init();

if (typeof worlds == 'undefined') {
  var worlds = [];
}
worlds.push(world_Gridyard);