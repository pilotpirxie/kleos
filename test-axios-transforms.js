const axios = require("axios");
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ a: 1 }));
});

server.listen(0, async () => {
  const port = server.address().port;
  try {
    const res = await axios.get(`http://localhost:${port}/`, {
      transformResponse: [
        (data) => {
          console.log("1st transform:", typeof data);
          return JSON.parse(data);
        },
        (data) => {
          console.log("2nd transform:", typeof data);
          data.b = 2;
          return data;
        },
      ],
    });
    console.log("final data:", res.data);
  } finally {
    server.close();
  }
});
