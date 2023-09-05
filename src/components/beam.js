import { Group, Path, Point } from 'paper';
import { getOppositeDirection, getReflectedDirection } from './util';

export class Beam {
  constructor(terminus, configuration) {
    this.activated = configuration.activated || false;
    this.initialDirection = configuration.direction;
    this.path = new Path({
      opacity: 0,
      strokeColor: terminus.ui.color,
      strokeJoin: 'round',
      strokeWidth: terminus.ui.openingWidth / 2
    });
    this.segments = [];

    this.startBulb = Beam.bulb(terminus);
    this.startTerminus = terminus;
    this.endBulb = null;
    this.endTerminus = null;

    this.group = new Group({
      children: [this.path, this.startBulb],
      locked: true
    });

    this.update();
  }

  toggle(event) {
    this.activated = !this.activated;
  }

  update() {
    console.log("beam update", this.activated);
    if (!this.activated) {
      this.group.opacity = 0;
      return;
    }

    this.group.opacity = 1;

    let currentTile = this.startTerminus.tile;
    let currentDirectionTo = this.initialDirection;
    let currentDirectionFrom = getOppositeDirection(currentDirectionTo);
    let segmentIndex = 0;

    while (true) {
      let currentSegment = this.segments[segmentIndex];
      let nextDirectionFrom = currentDirectionFrom;
      let nextDirectionTo = currentDirectionTo;

      // Check for other beams.
      const otherBeams = currentTile.objects.beams
        .filter((beam) => beam.activated && beam.startTerminus !== this.startTerminus);
      if (otherBeams.length) {
        // If there's another beam in the start terminus, de-activate.
        if (segmentIndex === 0) {
          console.log("deactivating");
          this.activated = false;
          this.update();
        }
        // We have entered a tile that already contains an activated beam.
        // TODO this is a collision.
        //console.log("stopping due to collision with another beam", otherBeams);
        //break;
      }

      // If the tile has a reflector in it, update the direction accordingly.
      if (currentTile.objects.reflector) {
        nextDirectionTo = getReflectedDirection(
          currentDirectionFrom,
          currentTile.objects.reflector.direction
        );
        nextDirectionFrom = getOppositeDirection(nextDirectionTo);
      }

      // If the direction has changed, remove the current segments and all that follow.
      if (currentSegment && currentSegment.directionTo !== nextDirectionTo) {
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
        if (segmentIndex > 0) {
          currentTile.objects.beams.push(this);
        }

        const data = {
          directionFrom: nextDirectionFrom,
          directionTo: nextDirectionTo,
          tile: currentTile
        };
        this.segments[segmentIndex] = data;
        this.path.add(currentTile.center);
      }

      if (currentTile.objects.terminus && currentTile.objects.terminus !== this.startTerminus) {
        // We have reached a terminus with an opening that matches our direction.
        if (currentTile.objects.terminus.openings.includes(nextDirectionFrom)) {
          console.log("end terminus reached");
          if (!this.endTerminus) {
            this.endTerminus = currentTile.objects.terminus;
            this.endBulb = Beam.bulb(this.endTerminus);
            this.group.addChild(this.endBulb);
          }
          break;
        }
        // We have reached a terminus but from the wrong direction.
        else {
          console.log("end terminus from wrong direction");
          // TODO this is a collision
          break;
        }
      }

      if (
        currentTile.objects.reflector &&
        nextDirectionTo === currentDirectionTo
      ) {
        // TODO: ideally the path would be updated to meet the end of the reflector instead of the center of the tile.
        console.log("stopping path due to collision with reflector");
        break;
      } else if (nextDirectionTo === currentDirectionFrom) {
        console.log("stopping path due to reflection back at self");
        break;
      }

      let nextTile = currentTile.getNeighboringTile(nextDirectionTo);

      // We have reached the edge of the map.
      if (!nextTile) {
        const vector = new Point(0, 0);
        vector.length = currentTile.parameters.inradius;
        vector.angle = 60 * nextDirectionTo;
        const point = currentTile.center.add(vector);
        this.path.add(point);
        // TODO this is a collision.
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
      data: { terminus },
      fillColor: terminus.ui.color,
      locked: true,
      opacity: 1,
      radius: terminus.ui.parameters.circumradius / 4
    });
  }
}
