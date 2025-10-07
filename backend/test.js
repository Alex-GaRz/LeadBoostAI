const { searchTwitterSignals } = require('./RadarService');

(async () => {
  const query = '"zapier is expensive" -is:retweet lang:en';
  const results = await searchTwitterSignals(query);
  console.log('Tweets encontrados:', results);
})();
