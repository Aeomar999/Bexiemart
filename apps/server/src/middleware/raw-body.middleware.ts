import { Request, Response, NextFunction } from "express";

export function rawBodyParser(webhookPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === webhookPath && req.method === "POST") {
      let data = Buffer.alloc(0);
      req.on("data", (chunk: Buffer) => {
        data = Buffer.concat([data, chunk]);
      });
      req.on("end", () => {
        (req as any).rawBody = data;
        req.body = JSON.parse(data.toString());
        next();
      });
    } else {
      next();
    }
  };
}
