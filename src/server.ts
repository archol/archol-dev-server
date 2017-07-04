
import { loadConfig, loadPlugins, startServer } from './api';

setTimeout(() => {
    loadConfig();
    loadPlugins();
    startServer();
}, 500);
