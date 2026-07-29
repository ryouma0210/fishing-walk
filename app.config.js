const base = require("./app.json");
const fs = require("node:fs");
const path = require("node:path");

function readAjisaiGoogleMapsApiKey() {
  try {
    const configPath = path.resolve(
      process.cwd(),
      "../ajisaiLogistics/frontend/ajisai_logistics/assets/js/map-config.js",
    );
    const source = fs.readFileSync(configPath, "utf8");
    return source.match(/AJISAI_GOOGLE_MAPS_API_KEY\s*=\s*["']([^"']+)["']/)?.[1];
  } catch {
    return undefined;
  }
}

module.exports = () => {
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY || readAjisaiGoogleMapsApiKey();

  return {
    ...base.expo,
    android: {
      ...base.expo.android,
      config: googleMapsApiKey
        ? {
            ...base.expo.android?.config,
            googleMaps: { apiKey: googleMapsApiKey },
          }
        : base.expo.android?.config,
    },
  };
};
