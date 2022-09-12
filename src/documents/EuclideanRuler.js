/**
 * A {@code Ruler} subclass that never calculates based on grid spaces.
 */
export default class EuclideanRuler extends Ruler {
  _computeDistance() {
    super._computeDistance(false);
  }
}
