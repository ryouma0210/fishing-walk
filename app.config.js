module.exports = ({ config }) => {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      "expo-audio",
      "expo-sharing",
    ],
  };
};
