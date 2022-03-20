const https = require("https");

function sendNotification(snsMessage) {
  let payload = JSON.stringify(createNotificationPayload(snsMessage));
  console.log(Buffer.byteLength(payload));
  const options = {
    hostname: process.env.WEBHOOK_HOST,
    path: process.env.WEBHOOK_PATH,
    port: 443,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  var req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding("utf8");
    res.on("data", (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on("end", () => {
      console.log("No more data in response.");
    });
  });

  req.on("error", (e) => {
    console.log(`problem with request: ${e.message}`);
  });

  req.write(payload);
  req.end();
  return;
}

function createNotificationPayload(snsMessage) {
  console.log(snsMessage["Event Source"])
  let payload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    summary: `(RDS) ${snsMessage["Event Source"]}: ${snsMessage['Event Message']}`,
    themeColor: "3498db",
    title: `Relational Database Service (RDS) Notification`,
    sections: [
      {
        activityTitle: `${snsMessage['Event Message']}`,
        facts: [
          {
            name: "Time:",
            value: snsMessage['Event Time'],
          },
          {
            name: "Account:",
            value: process.env.ACCOUNT,
          },
          {
            name: "Region:",
            value: process.env.REGION,
          },
          {
            name: "DB Source:",
            value: snsMessage["Event Source"],
          },
          {
            name: "Identifier Link:",
            value: snsMessage["Identifier Link"],
          },
        ],
      },
    ],
    potentialAction: [],
  };
  console.log("MSTeams payload:", JSON.stringify(payload));
  return payload;
}

function parseSNSMessage(message) {
  return JSON.parse(message);
}

exports.handler = async (event, context, callback) => {
  let snsMessage;

  try {
    console.log("SNS Event:", JSON.stringify(event));
    const snsMessage = parseSNSMessage(event.Records[0].Sns.Message);
    console.log(snsMessage)
    sendNotification(snsMessage);
  } catch (err) {
    console.error(
      `Unable to sendNotification for ${JSON.stringify(snsMessage, null, 2)}`
    );
    console.error(JSON.stringify(err, null, 2));

    return callback(err);
  }

  return callback(null);
};