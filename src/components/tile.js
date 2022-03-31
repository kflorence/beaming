import { Path, Point } from 'paper';

export class Tile {
  constructor(
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

  onSelected(event) {
    this.selected = true;
    this.indicator.fillColor = "#eee";
    this.indicator.opacity = 0.4;
  }

  onUnselected(event) {
    this.selected = false;
    this.indicator.opacity = 0;
  }

  static parameters(height) {
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
  }

  static styles = {
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
  }
}
