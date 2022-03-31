import { Path, Point } from 'paper';
import { getOppositeDirection, getReflectedDirection } from './util';

export class Beam {
  constructor(terminus, configuration) {
    this.initialDirection = configuration.direction;
    this.path = new Path({
      locked: true,
      opacity: 0,
      strokeColor: terminus.ui.color,
      strokeWidth: terminus.ui.openingWidth / 2
    });
    this.segments = [];

    this.startBulb = Beam.bulb(terminus);
    this.startTerminus = terminus;
    this.endBulb = null;
    this.endTerminus = null;

    this.update();
  }

  update() {
    console.log("beam update", this.startTerminus);
    if (!this.startTerminus.activated) {
      this.path.opacity = 0;
      this.startBulb.opacity = 0;
      if (this.endBulb) this.endBulb.opacity = 0;
      return;
    }

    this.startBulb.opacity = 1;

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
          this.endBulb.remove();
          this.endBulb = null;
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
        console.log("stopping due to collision with another beam");
        break;
      }

      if (
        currentTile.objects.terminus &&
        currentTile.objects.terminus != this.startTerminus
      ) {
        // We have reached a terminus with an opening that matches our direction.
        if (currentTile.objects.terminus.openings.includes(nextDirectionFrom)) {
          console.log("end terminus");
          this.endTerminus = currentTile.objects.terminus;
          this.endBulb = Beam.bulb(this.endTerminus);
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
  }

  static bulb(terminus) {
    return new Path.Circle({
      center: terminus.tile.center,
      closed: true,
      fillColor: terminus.ui.color,
      locked: true,
      opacity: terminus.activated ? 1 : 0,
      radius: terminus.ui.parameters.circumradius / 4
    });
  }
}
