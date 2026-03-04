export const loger = (req, res) => {
  console.log({ method: req.method, url: req.url });

  let body = [];
  req
    .on("data", (chunk) => {
      body.push(chunk);
    })
    .on("end", () => {
      body = Buffer.concat(body).toString();
      if (body) console.log({ body });
    });

  const originalWrite = res.write;
  const originalEnd = res.end;
  let responseBody = "";

  res.write = (chunk) => {
    responseBody += chunk;
    originalWrite.call(res, chunk);
  };

  res.end = (chunk) => {
    if (chunk) {
      responseBody += chunk;
    }
    try {
      const parsed = JSON.parse(responseBody);
      console.log({ responseBody: parsed });
    } catch {
      console.log({ responseBody });
    }
    originalEnd.call(res, chunk);
  };
};

export const toJson = (data) => JSON.stringify(data, null, 2);
