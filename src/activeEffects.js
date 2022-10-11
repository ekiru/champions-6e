import { SystemActiveEffectModes } from "./constants.js";

Hooks.on(
  "applyActiveEffect",
  function (actor, change, current, delta, changes) {
    switch (change.mode) {
      case SystemActiveEffectModes.HALVED:
        changes[change.key] = Math.round(current / 2);
    }
  }
);
