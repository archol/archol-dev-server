
import { loadConfig, startServer } from './api';

setTimeout(() => {
    if (loadConfig(process.cwd())) 
        startServer();
}, 500);
