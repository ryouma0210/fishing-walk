const base = require("./app.json");

module.exports = () => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

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
