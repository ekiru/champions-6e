// type definitions to augment the foundry-vtt-types ones

declare interface CONFIG {
  Canvas: {
    rulerClass: ConstructorOf<Ruler>;
  };
}
