import { Group, Path, Point } from 'paper'
import { getOppositeDirection, getReflectedDirection } from './util'

export class Beam {
  constructor (startTerminus, configuration) {
    this.activated = configuration.activated || false

    this.color = startTerminus.ui.color
    this.path = new Path({
      opacity: 0,
      strokeColor: this.color,
      strokeJoin: 'round',
      strokeWidth: startTerminus.ui.openingWidth / 2
    })
    this.segments = []

    this.startBulb = Beam.bulb(startTerminus)
    this.startDirection = configuration.direction
    this.startTerminus = startTerminus

    this.endBulb = null
    this.endDirection = null
    this.endTerminus = null

    this.group = new Group({
      children: [this.path, this.startBulb],
      locked: true
    })

    this.update()
  }

  toggle () {
    this.activated = !this.activated
  }

  // TODO:
  // This all needs to be moved into puzzle and out of here
  update () {
    if (!this.activated) {
      this.group.opacity = 0
      return
    }

    this.group.opacity = 1

    let currentTile = this.startTerminus.tile
    let currentDirectionTo = this.startDirection
    let currentDirectionFrom = getOppositeDirection(currentDirectionTo)
    let segmentIndex = 0

    while (true) {
      let currentSegment = this.segments[segmentIndex]
      let nextDirectionFrom = currentDirectionFrom
      let nextDirectionTo = currentDirectionTo

      // If the tile has a reflector in it, update the direction accordingly.
      if (currentTile.objects.reflector) {
        nextDirectionTo = getReflectedDirection(
          currentDirectionFrom,
          currentTile.objects.reflector.direction
        )
        nextDirectionFrom = getOppositeDirection(nextDirectionTo)
      }

      const otherActivatedBeams = currentTile.objects.beams.filter((beam) =>
        beam.activated && beam.startTerminus !== this.startTerminus
      )

      // If the path has changed, remove the current segment and all that follow.
      if ((currentSegment && currentSegment.directionTo !== nextDirectionTo) || otherActivatedBeams.length) {
        // Remove beam references in tiles
        for (let i = segmentIndex; i < this.segments.length; i++) {
          currentSegment = this.segments[i]
          const beams = currentSegment.tile.objects.beams
          currentSegment.tile.objects.beams = beams.filter((beam) => beam !== this)
        }

        this.segments.splice(segmentIndex)
        this.path.removeSegments(segmentIndex)

        currentSegment = null

        // If we had connected with a terminus, disconnect it.
        if (this.endTerminus) {
          this.endBulb.remove()
          this.endBulb = null
          this.endTerminus.disconnect(this)
          this.endDirection = null
          this.endTerminus = null
        }
      }

      // Add a new segment
      if (!currentSegment) {
        currentTile.objects.beams.push(this)

        this.segments[segmentIndex] = {
          directionFrom: nextDirectionFrom,
          directionTo: nextDirectionTo,
          tile: currentTile
        }

        this.path.add(currentTile.center)
      }

      // Check for other activated beams in this tile
      if (otherActivatedBeams.length) {
        // FIXME
        // Beams should not be allowed to cross, but they should be able to occupy the same tile if:
        // - there is a reflector in the tile and the beams would not be reflected into each other
        console.log('stopping due to collision with another beam')
        break
      }

      const terminus = currentTile.objects.terminus
      if (terminus && terminus !== this.startTerminus) {
        // The terminus is for a different color.
        if (terminus.ui.color !== this.color) {
          console.log('end terminus wrong color')
          break
        } else if (terminus.openings.includes(nextDirectionFrom)) {
          // We have reached a terminus with an opening that matches our direction.
          console.log('end terminus reached')
          if (!this.endTerminus) {
            this.endDirection = nextDirectionFrom
            this.endTerminus = terminus
            this.endBulb = Beam.bulb(terminus)
            this.group.addChild(this.endBulb)

            terminus.connect(this)
          }
          break
        } else {
          // We have reached a terminus but from the wrong direction.
          console.log('end terminus from wrong direction')
          // TODO this is a collision
          break
        }
      }

      if (
        currentTile.objects.reflector &&
        nextDirectionTo === currentDirectionTo
      ) {
        // TODO: ideally the path would be updated to meet the end of the reflector instead of the center of the tile.
        console.log('stopping path due to collision with reflector')
        break
      } else if (nextDirectionTo === currentDirectionFrom) {
        console.log('stopping path due to reflection back at self')
        break
      }

      const nextTile = currentTile.getNeighboringTile(nextDirectionTo)

      // We have reached the edge of the map.
      if (!nextTile) {
        const vector = new Point(0, 0)
        vector.length = currentTile.parameters.inradius
        vector.angle = 60 * nextDirectionTo
        const point = currentTile.center.add(vector)
        this.path.add(point)
        // TODO this is a collision.
        console.log('stopping due to edge of map')
        break
      }

      currentDirectionFrom = nextDirectionFrom
      currentDirectionTo = nextDirectionTo
      currentTile = nextTile

      segmentIndex++
    }

    this.path.opacity = 1
  }

  static bulb (terminus) {
    return new Path.Circle({
      center: terminus.tile.center,
      closed: true,
      data: { terminus },
      fillColor: terminus.ui.color,
      locked: true,
      opacity: 1,
      radius: terminus.ui.parameters.circumradius / 4
    })
  }
}
