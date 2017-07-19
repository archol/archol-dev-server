
import { loadConfig, startServer } from "./api";
import { addLogListenner, addServerOnlyLogListenner } from "./logger";

addLogListenner((data) => {
    // tslint:disable-next-line:no-console
    console.dir(data);
});
addServerOnlyLogListenner((data) => {
    // tslint:disable-next-line:no-console
    console.dir(data);
});

setTimeout(() => {
    if (loadConfig(process.cwd())) {
        startServer(() => {
            //
        });
    }
}, 500);
