const ClickHouse = require('@apla/clickhouse');

const ch = new ClickHouse({
  host: process.env.CH_HOST,
  port: process.env.CH_PORT,
  user: process.env.CH_USER,
  password: process.env.CH_PASSWORD
});

const recordEvent = (event) => {
  console.log("Recording event: ", JSON.stringify(event));

  return new Promise((resolve, reject) => {
    const writableStream = ch.query(`INSERT INTO youranalytics.events`, { format: 'JSONEachRow' }, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Event recorded!');
        resolve();
      }
    });

    // data will be formatted for you
    writableStream.write({...event, timestamp: new Date()});
    // writableStream.write([
    //   new Date(), // timestamp DateTime
    //   event.name, // name String,
    //   event.domain, // domain String,
    //   event.user_id, // user_id UInt64,
    //   event.session_id, // session_id UInt64,
    //   event.hostname, // hostname String,
    //   event.path, // path String,
    //   event.referrer, // referrer String,
    //   event.country_code, // country_code LowCardinality(FixedString(2)),
    //   event.screen_size, // screen_size LowCardinality(String),
    //   event.operating_system, // operating_system LowCardinality(String),
    //   event.browser, // browser LowCardinality(String)
    // ]);

    writableStream.end();
  });
};

module.exports = {
  recordEvent
};
