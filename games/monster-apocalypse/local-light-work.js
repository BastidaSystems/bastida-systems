import {REVISION,ShaderChunk} from 'three';

// Three r160 evaluates the full BRDF even when a local light contributes zero.
// Keep its attenuation/shadows intact; skip only that zero-valued contribution.
export function installLocalLightWork() {
  const marker='// MA: skip zero local-light contribution';
  const source=ShaderChunk.lights_fragment_begin;
  if(source.includes(marker))return true;
  if(REVISION!=='160')return false;
  const direct='RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );';
  const parts=source.split(direct);
  // r160 orders the point, spot, then directional light loops.
  if(parts.length!==4||!parts[0].includes('PointLight pointLight;')||!parts[1].includes('SpotLight spotLight;'))return false;
  const guarded=`${marker}\n\t\tif ( directLight.visible ) { ${direct} }`;
  ShaderChunk.lights_fragment_begin=parts[0]+guarded+parts[1]+guarded+parts[2]+direct+parts[3];
  return true;
}
