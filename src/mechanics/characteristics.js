export class Characteristic {
  constructor(abbreviation, name) {
    this.abbreviation = abbreviation;
    this.name = name;
  }

  targetNumber(value) {
    return Math.round(9 + value / 5);
  }
}

export const STR = new Characteristic("STR", "Strength");
STR.hthDamage = function (value) {
  const wholeDice = Math.floor(value / 5);
  if (value % 5 >= 3) {
    return wholeDice + 0.5;
  } else {
    return wholeDice;
  }
};
