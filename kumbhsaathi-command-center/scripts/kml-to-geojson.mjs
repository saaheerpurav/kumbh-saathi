// Converts KML files in public/data/ to GeoJSON in public/maps/
import { readFileSync, writeFileSync } from "fs";
import { DOMParser } from "@xmldom/xmldom";
import { kml } from "@tmcw/togeojson";

const KML_FILES = [
  { src: "public/data/CCTV Dataset.kml", dest: "public/maps/cctv.geojson" },
  { src: "public/data/Police Stations.kml", dest: "public/maps/police.geojson" },
  { src: "public/data/nashik_kumbh_chokepoints_parking_map.kml", dest: "public/maps/chokepoints.geojson" },
];

for (const { src, dest } of KML_FILES) {
  const xmlStr = readFileSync(src, "utf8");
  const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
  const geojson = kml(doc);
  writeFileSync(dest, JSON.stringify(geojson, null, 2));
  console.log(`✓ ${src} → ${dest}  (${geojson.features.length} features)`);
}
