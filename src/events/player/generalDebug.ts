import { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';
import loggerModule from '../../services/logger';

module.exports = {
    name: 'debug',
    isDebug: true,
    isPlayerEvent: false,
    execute: async (message: string) => {
        const executionId: string = uuidv4();
        const logger: Logger = loggerModule.child({
            source: 'generalDebug.js',
            module: 'event',
            name: 'playerGeneralDebug',
            executionId: executionId
        });

        logger.debug(message);
    }
};