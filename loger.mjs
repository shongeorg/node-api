import { inspect } from "node:util";

export const print = (data) => {
  let out = inspect(data, {
    colors: true,
    breakLength: 80,
    depth: Infinity,
    maxArrayLength: Infinity,
    maxStringLength: Infinity,
    numericSeparator: true,
    sorted: true,
  });
  console.dir(out);
};

export const loger = (req, res, method) => {
  console.log({
    method,
    url: req.url,
  });
  // print({ headers: req.headers });

  let body = [];
  req
    .on("data", (chunk) => {
      body.push(chunk);
    })
    .on("end", () => {
      body = Buffer.concat(body).toString();
      // print({ body });
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
    // print({ responseBody });
    originalEnd.call(res, chunk);
  };
};
