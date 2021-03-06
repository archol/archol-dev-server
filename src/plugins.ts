import { IPlugin } from "./api";

export const defaultPlugins: IPlugin[] = [
    {
        handlers: {
            ["/~ads/ping"](req, res, next) {
                res.setHeader("content-type", "text/plain; charset=utf-8");
                res.write(new Date().toISOString());
                res.write("\r\n");
                res.write("\r\n");
                req.pipe(res);
            },
        },
        injections: [],
    },
];
