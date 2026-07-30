const fs = require("node:fs");
const path = require("node:path");

function readAjisaiGoogleMapsApiKey() {
  try {
    const bundledPath = path.resolve(process.cwd(), "config/google-maps-key.txt");
    const ajisaiPath = path.resolve(
      process.cwd(), "../ajisaiLogistics/frontend/ajisai_logistics/assets/js/map-config.js",
    );
    const source = fs.readFileSync(fs.existsSync(bundledPath) ? bundledPath : ajisaiPath, "utf8");
    return source.match(/AJISAI_GOOGLE_MAPS_API_KEY\s*=\s*["']([^"']+)["']/)?.[1];
  } catch {
    return undefined;
  }
}

module.exports = ({ config }) => {
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY || readAjisaiGoogleMapsApiKey();

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      "expo-audio",
      "expo-sharing",
    ],
    android: {
      ...config.android,
      config: googleMapsApiKey
        ? {
            ...config.android?.config,
            googleMaps: { apiKey: googleMapsApiKey },
          }
        : config.android?.config,
    },
  };
};
