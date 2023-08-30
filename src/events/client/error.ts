import { Events } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';

import loggerModule from '../../services/logger';
import { Logger } from 'pino';

module.exports = {
    name: Events.Error,
    isDebug: false,
    once: false,
    execute: async (error: Error) => {
        const executionId: string = uuidv4();
        const logger: Logger = loggerModule.child({
            source: 'error.js',
            module: 'event',
            name: 'clientError',
            executionId: executionId
        });

        logger.error(error);
    }
};