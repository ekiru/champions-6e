interface ConvertibleToNumber {
  valueOf(): number;
}

export type NumberLike = number | ConvertibleToNumber;
