class Maneuver {
  constructor(name) {
    this.name = name;
  }
}

/**
 * An array of Combat Maneuvers and Optional Maneuvers available to all characters.
 *
 * @type {any[]}
 */
export const standardManeuvers = [
  new Maneuver("Block"),
  new Maneuver("Brace"),
  new Maneuver("Disarm"),
  new Maneuver("Dodge"),
  new Maneuver("Grab"),
  new Maneuver("Grab By"),
  new Maneuver("Haymaker"),
  new Maneuver("Move By"),
  new Maneuver("Move Through"),
  new Maneuver("Multiple Attack"),
  new Maneuver("Set"),
  new Maneuver("Shove"),
  new Maneuver("Strike"),
  new Maneuver("Throw"),
  new Maneuver("Trip"),
];
