// Blend distances per foot cycle. Original clips use 2 walk cycles / 1 run cycle;
// the supplied Shooter clips use 1 / 1. Defaults retain the original fallback.
export function gaitSample(phase,dt,speed,{walkWeight,runWeight,walkDistance,runDistance,runOffset=0,walkCycles=2,runCycles=1}) {
  const ratio=walkCycles/runCycles;
  const total=walkWeight+runWeight;
  const distance=total>.001?(walkWeight*walkDistance+runWeight*runDistance*ratio)/total:walkDistance;
  const advance=Math.max(0,dt)*Math.max(0,speed)/distance;
  const next=(phase+advance)%1;
  return {phase:next,advance,walk:next,run:(next*ratio+runOffset)%1,runStart:(phase*ratio)%1,runAdvance:advance*ratio};
}
