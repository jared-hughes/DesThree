export const FogModes = {
  NONE: 1,
  LINEAR: 2,
  EXP: 3
}

export function initGraphSettings () {
  return {
    fogMode: FogModes.NONE
  }
}
