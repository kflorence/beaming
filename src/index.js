import paper from 'paper';

paper.install(window);

function Puzzle(configuration) {
  const tileSize = configuration.layout.tileSize;

  let layout = new Layout(configuration.layout);

  let reflectors = [];
  for (let i = 0; i < configuration.objects.reflectors.length; i++) {
    const reflectorConfiguration = configuration.objects.reflectors[i];
    const tile = layout.getTileByOffset(
      new OffsetCoordinates(...reflectorConfiguration.offsetCoordinates)
    );
    const reflector = new Reflector(tile, reflectorConfiguration);
    tile.objects.reflector = reflector;
    reflectors.push(reflector);
  }

  let beams = [];
  let terminuses = [];
  for (let i = 0; i < configuration.objects.terminuses.length; i++) {
    const terminusConfiguration = configuration.objects.terminuses[i];
    const tile = layout.getTileByOffset(
      new OffsetCoordinates(...terminusConfiguration.offsetCoordinates)
    );
    const terminus = new Terminus(tile, terminusConfiguration);
    tile.objects.terminus = terminus;
    terminuses.push(terminus);
    beams.push(
      ...terminus.openings.map((direction) => {
        return new Beam(terminus, { direction });
      })
    );
  }

  this.beams = beams;
  this.layout = layout;
  this.reflectors = reflectors;
  this.terminuses = terminuses;
  this.tileSize = tileSize;
  this.selectedTile = null;

  view.onClick = (event) => {
    let tile;
    const hit = project.hitTest(event.point);
    if (hit && hit.item.data.type == "tile") {
      const [q, r] = hit.item.data.axialId.split(",");
      tile = layout.getTileByAxial(new AxialCoordinates(q, r));
    }
    this.onClick(event, tile);
  };
}

Puzzle.prototype.onClick = function (event, tile) {
  console.log(tile);

  if (tile) {
    if (tile.objects.terminus) {
      tile.objects.terminus.onClick(event);
      tile.objects.beams.forEach((beam) => beam.update());
    }
  }

  // A selected tile was clicked
  if (this.selectedTile == tile) {
    if (tile.objects.reflector) {
      tile.objects.reflector.onClick(event);
      this.beams.forEach((beam) => {
        beam.update();
      });
    }
  }

  // A previously unselected tile was clicked
  else {
    if (this.selectedTile) this.selectedTile.onUnselected(event);
    this.selectedTile = tile;
    if (this.selectedTile) this.selectedTile.onSelected(event);
  }
};

Puzzle.prototype.update = function (event) {
  console.log(this);
  console.log(event);
};

function AxialCoordinates(q, r, s) {
  if (!s) s = -q - r;
  this.coordinates = [q, r, s];
  this.q = q;
  this.r = r;
  this.s = s;
}

AxialCoordinates.prototype.add = function (other) {
  return AxialCoordinates.add(this, other);
};

AxialCoordinates.prototype.neighbor = function (direction) {
  return AxialCoordinates.neighbor(this, direction);
};

AxialCoordinates.prototype.toString = function () {
  return this.coordinates.join(",");
};

AxialCoordinates.directions = [
  new AxialCoordinates(1, 0),
  new AxialCoordinates(1, -1),
  new AxialCoordinates(0, -1),
  new AxialCoordinates(-1, 0),
  new AxialCoordinates(-1, 1),
  new AxialCoordinates(0, 1)
];

AxialCoordinates.add = function (a, b) {
  return new AxialCoordinates(a.q + b.q, a.r + b.r);
};

AxialCoordinates.direction = function (direction) {
  if (direction == 0) direction = 6;
  // paperjs uses a clockwise system, but the axial system is counter-clockwise.
  // So we flip the direction here by subtracting it from six
  return AxialCoordinates.directions[6 - direction];
};

AxialCoordinates.neighbor = function (start, direction) {
  return AxialCoordinates.add(start, AxialCoordinates.direction(direction));
};

AxialCoordinates.toOffsetCoordinates = function (axial) {
  const c = axial.q + (axial.r - (axial.r & 1)) / 2;
  return new OffsetCoordinates(c, axial.r);
};

function Layout(configuration) {
  const tileParameters = Tile.parameters(configuration.tileSize);
  const tilesConfiguration = configuration.tiles;

  const center = new Point(view.size.width / 2, view.size.height / 2);
  const height = tilesConfiguration.length * tileParameters.height;
  const startingOffsetY = center.y - height / 2;

  let tiles = [];

  for (let r = 0; r < tilesConfiguration.length; r++) {
    const rowConfiguration = tilesConfiguration[r];
    const rowOffset = Math.floor(r / 2);
    const rowWidth = rowConfiguration.length * tileParameters.width;
    const startingOffsetX =
      center.x - rowWidth / 2 + (r % 2 == 0 ? 0 : tileParameters.inradius);

    let row = new Array(rowConfiguration.length);
    for (let c = 0; c < rowConfiguration.length; c++) {
      const axialCoordinates = new AxialCoordinates(c - rowOffset, r);
      const offsetCoordinates = new OffsetCoordinates(r, c);

      const tileConfiguration = rowConfiguration[c];
      if (!tileConfiguration) {
        row[axialCoordinates.q] = null;
        continue;
      }

      const layoutParameters = {
        row: r,
        column: c,
        startingOffsetX,
        startingOffsetY
      };

      const tile = new Tile(
        axialCoordinates,
        offsetCoordinates,
        layoutParameters,
        tileParameters,
        tileConfiguration,
        (direction) => {
          return this.getNeighboringTile(tile, direction);
        }
      );

      row[axialCoordinates.q] = tile;
    }

    tiles.push(row);
  }

  this.tiles = tiles;
}

Layout.prototype.getTileByAxial = function (axial) {
  return (this.tiles[axial.r] || [])[axial.q];
};

Layout.prototype.getTileByOffset = function (offset) {
  return this.getTileByAxial(OffsetCoordinates.toAxialCoordinates(offset));
};

Layout.prototype.getNeighboringTile = function (tile, direction) {
  return this.getTileByAxial(
    AxialCoordinates.neighbor(tile.axialCoordinates, direction)
  );
};

function OffsetCoordinates(r, c) {
  this.coordinates = [r, c];
  this.r = r;
  this.c = c;
}

OffsetCoordinates.toAxialCoordinates = function (offset) {
  const q = offset.c - (offset.r - (offset.r & 1)) / 2;
  return new AxialCoordinates(q, offset.r);
};

OffsetCoordinates.prototype.toString = function () {
  return this.coordinates.join(",");
};

function Tile(
  axialCoordinates,
  offsetCoordinates,
  layoutParameters,
  tileParameters,
  configuration,
  getNeighboringTile
) {
  const data = {
    axialId: axialCoordinates.toString(),
    offsetId: offsetCoordinates.toString(),
    type: "tile"
  };

  const center = new Point(
    layoutParameters.startingOffsetX +
    tileParameters.inradius +
    layoutParameters.column * tileParameters.width,
    layoutParameters.startingOffsetY +
    tileParameters.circumradius +
    layoutParameters.row * tileParameters.offsetY
  );

  const style = Object.assign(
    {},
    Tile.styles.default,
    configuration.style || {}
  );

  const hexagon = new Path.RegularPolygon({
    center,
    closed: true,
    data,
    radius: tileParameters.circumradius,
    sides: 6,
    style
  });

  const indicatorWidth = tileParameters.circumradius / 12;
  const indicator = new Path.RegularPolygon({
    center,
    closed: true,
    locked: true,
    opacity: 0,
    radius: tileParameters.circumradius - indicatorWidth - style.strokeWidth,
    sides: 6,
    strokeColor: "black",
    strokeWidth: indicatorWidth
  });

  this.axialCoordinates = axialCoordinates;
  this.center = center;
  this.configuration = configuration;
  this.data = data;
  this.getNeighboringTile = getNeighboringTile;
  this.hexagon = hexagon;
  this.indicator = indicator;
  this.indicatorWidth = indicatorWidth;
  this.layoutParameters = layoutParameters;
  this.objects = {
    beams: [],
    reflector: null,
    terminus: null
  };
  this.offsetCoordinates = offsetCoordinates;
  this.parameters = tileParameters;
  this.selected = false;
  this.style = style;
}

Tile.prototype.onSelected = function (event) {
  this.selected = true;
  this.indicator.fillColor = "#eee";
  this.indicator.opacity = 0.4;
};

Tile.prototype.onUnselected = function (event) {
  this.selected = false;
  this.indicator.opacity = 0;
};

Tile.parameters = function (height) {
  const circumradius = height / 2;
  const width = Math.sqrt(3) * circumradius;
  const inradius = width / 2;
  const offsetY = height * (3 / 4);

  return {
    circumradius,
    height,
    inradius,
    offsetY,
    width
  };
};

Tile.styles = {
  default: {
    fillColor: "white",
    strokeColor: "black",
    strokeWidth: 1
  },
  hover: {
    strokeColor: "gray",
    strokeWidth: 2
  },
  selected: {
    strokeColor: "blue",
    strokeWidth: 2
  }
};

function Terminus(tile, configuration) {
  const ui = Terminus.ui(tile, configuration);

  this.activated = configuration.activated;
  this.center = tile.center;
  this.connectedTerminus = null;
  this.openings = configuration.openings;
  this.tile = tile;
  this.ui = ui;
}

Terminus.prototype.onClick = function (event) {
  this.activated = !this.activated;
  this.update();
};

Terminus.prototype.update = function () {
  if (this.activated) {
    this.ui.bulb.opacity = 1;
  } else {
    this.ui.bulb.opacity = 0;
  }
};

Terminus.ui = function (tile, configuration) {
  const { color, openings } = configuration;

  const parameters = Tile.parameters(tile.parameters.circumradius);
  const hexagon = new Path.RegularPolygon({
    center: tile.center,
    fillColor: color,
    opacity: 0.5,
    radius: parameters.circumradius,
    sides: 6
  });

  const cavity = new Path.Circle({
    center: tile.center,
    closed: true,
    fillColor: "white",
    radius: parameters.circumradius / 2
  });

  const openingWidth = parameters.circumradius / 4;

  const paths = openings.map((direction) => {
    const topLeft = tile.center.subtract(new Point(0, openingWidth / 2));
    let opening = new Path.Rectangle({
      fillColor: "white",
      point: topLeft,
      size: new Size(parameters.inradius + 1, openingWidth)
    });

    opening.rotate(direction * 60, opening.bounds.leftCenter);

    return opening;
  });

  const bulb = new Path.Circle({
    center: tile.center,
    closed: true,
    fillColor: color,
    opacity: configuration.activated ? 1 : 0,
    radius: parameters.circumradius / 4
  });

  const group = new Group({
    children: [hexagon, cavity].concat(paths).concat([bulb]),
    locked: true
  });

  return {
    bulb,
    color,
    hexagon,
    paths,
    parameters,
    cavity,
    openings,
    openingWidth,
    group
  };
};

function Beam(terminus, configuration) {
  this.initialDirection = configuration.direction;
  this.path = new Path({
    locked: true,
    opacity: 0,
    strokeColor: terminus.ui.color,
    strokeWidth: terminus.ui.openingWidth / 2
  });
  this.segments = [];
  this.endTerminus = null;
  this.startTerminus = terminus;

  this.update();
}

Beam.prototype.update = function () {
  if (!this.startTerminus.activated) {
    this.path.opacity = 0;
    return;
  }

  let currentTile = this.startTerminus.tile;
  let currentDirectionTo = this.initialDirection;
  let currentDirectionFrom = getOppositeDirection(currentDirectionTo);
  let segmentIndex = 0;

  while (true) {
    let currentSegment = this.segments[segmentIndex];
    let nextDirectionFrom = currentDirectionFrom;
    let nextDirectionTo = currentDirectionTo;

    // If the tile has a reflector in it, update the direction accordingly.
    if (currentTile.objects.reflector) {
      nextDirectionTo = getReflectedDirection(
        currentDirectionFrom,
        currentTile.objects.reflector.direction
      );
      nextDirectionFrom = getOppositeDirection(nextDirectionTo);
    }

    // If the direction has changed, remove the current segments and all that follow.
    if (currentSegment && currentSegment.directionTo != nextDirectionTo) {
      // Remove beam references in tiles
      for (let i = segmentIndex; i < this.segments.length; i++) {
        currentSegment = this.segments[i];
        let beams = currentSegment.tile.objects.beams;
        currentSegment.tile.objects.beams = beams.filter(
          (beam) => beam !== this
        );
      }

      this.segments.splice(segmentIndex);
      this.path.removeSegments(segmentIndex);

      currentSegment = null;

      // If we had connected with a terminus, disconnect it.
      if (this.endTerminus) {
        this.endTerminus.update(null);
        this.endTerminus = null;
      }
    }

    if (!currentSegment) {
      currentTile.objects.beams.push(this);
      const data = {
        directionFrom: nextDirectionFrom,
        directionTo: nextDirectionTo,
        tile: currentTile
      };
      this.segments[segmentIndex] = data;
      this.path.add(currentTile.center);
    }

    if (currentTile.objects.beams.length > 1) {
      // We have entered a tile that already contains a beam.
      // TODO this is a collision.
      break;
    }

    if (
      currentTile.objects.terminus &&
      currentTile.objects.terminus != this.startTerminus
    ) {
      // We have reached a terminus with an opening that matches our direction.
      if (currentTile.objects.terminus.openings.includes(nextDirectionFrom)) {
        this.endTerminus = currentTile.objects.terminus;
        this.endTerminus.update(this.startTerminus);
        break;
      }
      // We have reached a terminus but from the wrong direction.
      else {
        // TODO this is a collision
        break;
      }
    }

    if (
      currentTile.objects.reflector &&
      nextDirectionTo == currentDirectionTo
    ) {
      // TODO: ideally the path would be updated to meet the end of the relfector instead of the center of the tile.
      console.log("stopping path due to collision with reflector");
      break;
    } else if (nextDirectionTo == currentDirectionFrom) {
      console.log("stopping path due to reflection back at self");
      break;
    }

    let nextTile = currentTile.getNeighboringTile(nextDirectionTo);

    // TODO: load and evaluate tile objects for direction changes or blockers.
    if (!nextTile) {
      const vector = new Point(0, 0);
      vector.length = currentTile.parameters.inradius;
      vector.angle = 60 * nextDirectionTo;
      const point = currentTile.center.add(vector);
      this.path.add(point);
      break;
    }

    currentDirectionFrom = nextDirectionFrom;
    currentDirectionTo = nextDirectionTo;
    currentTile = nextTile;

    segmentIndex++;
  }

  this.path.opacity = 1;
};

Beam.ui = {};
Beam.ui.bulb = function (point) { };
Beam.ui.collision = function (point) { };

function Reflector(tile, configuration) {
  const length = tile.parameters.circumradius;
  const width = tile.parameters.circumradius / 12;
  const topLeft = tile.center.subtract(new Point(width / 2, length / 2));

  let wall = new Path.Rectangle({
    fillColor: "black",
    point: topLeft,
    radius: 2,
    size: new Size(width, length)
  });

  // let directionality = new Path.Line({
  //   from: tile.center,
  //   strokeColor: "red",
  //   strokeWidth: 1,
  //   to: tile.center.add(new Point(tile.parameters.inradius / 2, 0))
  // });

  let group = new Group({
    children: [wall /*, directionality*/],
    locked: true
  });

  group.rotate(configuration.direction * 30, wall.bounds.center);

  this.direction = configuration.direction;
  this.group = group;
  this.tile = tile;
  this.wall = wall;
}

Reflector.prototype.onClick = function (event) {
  this.direction = this.direction == 11 ? 0 : this.direction + 1;
  this.group.rotate(30, this.wall.bounds.center);
};

function getReflectedDirection(beamDirection, reflectorDirection) {
  const beamAngle = beamDirection * 60;
  const reflectorAngle = reflectorDirection * 30;
  const reflectedBeamAngle = (reflectorAngle - beamAngle) * 2;
  return (addDegrees(beamAngle, reflectedBeamAngle) / 60) % 6;
}

function getOppositeDirection(direction) {
  return direction + (direction >= 3 ? -3 : 3);
}

function addDegrees(original, degrees) {
  const result = original + degrees;
  if (result < 0) return 360 + result;
  else if (result > 360) return result - 360;
  return result;
}

window.onload = function () {
  paper.setup(document.getElementById("canvas"));

  const puzzle = new Puzzle({
    layout: {
      tiles: [
        [null, null, {}, null, null],
        [null, {}, {}, null, null],
        [null, {}, null, {}, null],
        [null, {}, {}, null, null],
        [null, null, {}, null, null]
      ],
      tileSize: 100
    },
    objects: {
      reflectors: [
        {
          direction: 0,
          offsetCoordinates: [2, 3]
        }
      ],
      terminuses: [
        {
          activated: false,
          color: "blue",
          offsetCoordinates: [0, 2],
          openings: [1]
        },
        {
          activated: true,
          color: "blue",
          offsetCoordinates: [4, 2],
          openings: [5]
        }
      ]
    }
  });
};
