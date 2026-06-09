import fs from "node:fs/promises";

const TRACTS_URL =
  "https://api.censusreporter.org/1.0/geo/show/tiger2023?geo_ids=140|05000US53033";
const ACS_URL =
  "https://api.censusreporter.org/1.0/data/show/latest?table_ids=B19013,B17001,B01001&geo_ids=140|05000US53033";
const OSM_QUERY =
  '[out:json][timeout:180];(node["leisure"="pitch"]["sport"~"soccer"](47.0,-122.6,47.9,-121.0);way["leisure"="pitch"]["sport"~"soccer"](47.0,-122.6,47.9,-121.0);relation["leisure"="pitch"]["sport"~"soccer"](47.0,-122.6,47.9,-121.0););out center;';
const OSM_URL = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(OSM_QUERY)}`;

function ringContains(point, ring) {
  const [px, py] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point, polygonCoords) {
  if (!ringContains(point, polygonCoords[0])) return false;

  for (let i = 1; i < polygonCoords.length; i += 1) {
    if (ringContains(point, polygonCoords[i])) return false;
  }

  return true;
}

function pointInGeometry(point, geometry) {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
  }

  return false;
}

function extractBoundaryPoints(coords, out) {
  if (typeof coords[0] === "number") {
    out.push(coords);
    return;
  }

  for (const c of coords) {
    extractBoundaryPoints(c, out);
  }
}

function centroidApprox(geometry) {
  const points = [];
  extractBoundaryPoints(geometry.coordinates, points);

  let lon = 0;
  let lat = 0;
  for (const p of points) {
    lon += p[0];
    lat += p[1];
  }

  const n = points.length || 1;
  return [lon / n, lat / n];
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function norm(value, min, max) {
  if (!Number.isFinite(value)) return 0;
  if (max <= min) return 50;
  return ((value - min) / (max - min)) * 100;
}

function getEstimate(tables, table, cell) {
  const t = tables?.[table];
  if (!t) return null;

  if (t.estimate && t.estimate[cell] != null) return Number(t.estimate[cell]);
  if (t.error && t.error[cell] != null) return Number(t.error[cell]);
  return null;
}

function toFacilityFeature(element) {
  let lon = null;
  let lat = null;

  if (element.type === "node") {
    lon = element.lon;
    lat = element.lat;
  } else if (element.center) {
    lon = element.center.lon;
    lat = element.center.lat;
  }

  if (lon == null || lat == null) return null;

  return {
    type: "Feature",
    properties: {
      name: element.tags?.name || `OSM ${element.type} ${element.id}`,
      type: element.tags?.access || "Unknown",
      osm_type: element.type,
      osm_id: element.id,
    },
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
  };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "king-county-soccer-equity-lab",
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed ${res.status} for ${url}`);
  }

  return res.json();
}

async function main() {
  const [tractGeo, acsData, osmRaw] = await Promise.all([
    fetchJson(TRACTS_URL),
    fetchJson(ACS_URL),
    fetchJson(OSM_URL),
  ]);

  const facilitiesAll = (osmRaw.elements || [])
    .map(toFacilityFeature)
    .filter(Boolean);

  const acsByGeoid = acsData.data || {};

  const tractRecords = tractGeo.features
    .map((feature) => {
      const geoid = feature.properties?.geoid;
      const acs = acsByGeoid[geoid];
      if (!acs) return null;

      const income = getEstimate(acs, "B19013", "B19013001");
      const povTotal = getEstimate(acs, "B17001", "B17001001");
      const povPoor = getEstimate(acs, "B17001", "B17001002");

      const kids =
        (getEstimate(acs, "B01001", "B01001004") || 0) +
        (getEstimate(acs, "B01001", "B01001005") || 0) +
        (getEstimate(acs, "B01001", "B01001006") || 0) +
        (getEstimate(acs, "B01001", "B01001028") || 0) +
        (getEstimate(acs, "B01001", "B01001029") || 0) +
        (getEstimate(acs, "B01001", "B01001030") || 0);

      const povertyRate =
        povTotal && povTotal > 0 && povPoor != null ? (povPoor / povTotal) * 100 : null;

      const centroid = centroidApprox(feature.geometry);

      return {
        geoid,
        name: feature.properties?.name || geoid,
        feature,
        income,
        povertyRate,
        kids,
        centroid,
      };
    })
    .filter(Boolean)
    .filter((r) => Number.isFinite(r.income) && Number.isFinite(r.povertyRate));

  const incomes = tractRecords.map((r) => r.income);
  const povertyRates = tractRecords.map((r) => r.povertyRate);

  const minIncome = Math.min(...incomes);
  const maxIncome = Math.max(...incomes);
  const minPoverty = Math.min(...povertyRates);
  const maxPoverty = Math.max(...povertyRates);

  const facilitiesInKing = [];
  const seenFacility = new Set();

  for (const tract of tractRecords) {
    tract.facilityCount = 0;
    tract.nearestKm = Infinity;

    for (const facility of facilitiesAll) {
      const point = facility.geometry.coordinates;

      if (pointInGeometry(point, tract.feature.geometry)) {
        tract.facilityCount += 1;
        const key = `${facility.properties.osm_type}:${facility.properties.osm_id}`;
        if (!seenFacility.has(key)) {
          seenFacility.add(key);
          facilitiesInKing.push(facility);
        }
      }

      const d = haversineKm(tract.centroid, point);
      if (d < tract.nearestKm) tract.nearestKm = d;
    }
  }

  const accessRawList = tractRecords.map((r) => {
    const kidsFactor = Math.max((r.kids || 0) / 1000, 0.2);
    const supply = r.facilityCount / kidsFactor;
    const distBoost = 1 / Math.max(r.nearestKm, 0.2);
    return 0.7 * supply + 0.3 * distBoost;
  });

  const minAccessRaw = Math.min(...accessRawList);
  const maxAccessRaw = Math.max(...accessRawList);

  tractRecords.forEach((tract, i) => {
    const incomeNorm = norm(tract.income, minIncome, maxIncome);
    const povertyNorm = norm(tract.povertyRate, minPoverty, maxPoverty);
    const ses = 0.6 * incomeNorm + 0.4 * (100 - povertyNorm);

    const accessNorm = norm(accessRawList[i], minAccessRaw, maxAccessRaw);
    const kidsPerPitch =
      tract.facilityCount > 0
        ? tract.kids / tract.facilityCount
        : tract.kids > 0
          ? tract.kids * 2
          : 0;

    tract.feature.properties = {
      tract_name: tract.name,
      geoid: tract.geoid,
      ses_index: Math.round(ses),
      access_index: Math.round(accessNorm),
      kids_per_pitch: Math.round(kidsPerPitch),
      median_income: Math.round(tract.income),
      poverty_rate: Number(tract.povertyRate.toFixed(2)),
      kids_5_17: Math.round(tract.kids),
      facility_count: tract.facilityCount,
      nearest_facility_km: Number(tract.nearestKm.toFixed(3)),
      data_year: "ACS 2023 5-year",
    };
  });

  const tractsOut = {
    type: "FeatureCollection",
    features: tractRecords.map((r) => r.feature),
  };

  const facilitiesOut = {
    type: "FeatureCollection",
    features: facilitiesInKing,
  };

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile("data/tracts.geojson", JSON.stringify(tractsOut));
  await fs.writeFile("data/facilities.geojson", JSON.stringify(facilitiesOut));

  console.log(`Tracts written: ${tractsOut.features.length}`);
  console.log(`Facilities written: ${facilitiesOut.features.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
