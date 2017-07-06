var api = require('../../..');

debugger
api.registerPlugin(
    {
        handlers: {
            '/~invalid': __dirname+'/invalid',
        },
        injections: []
    }
);

