
import { loadConfig, loadPlugins, startServer } from './api';

setTimeout(() => {
    if (loadConfig(process.cwd())) {
        loadPlugins();
        startServer();
    }
}, 500);
