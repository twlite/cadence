import { ChatInputCommandInteraction } from 'discord.js';
import { Logger } from 'pino';
import loggerModule from '../services/logger';
import { Command, ExtendedClient } from '../types/clientTypes';
import { cannotSendMessageInChannel } from '../utils/validation/permissionValidator';

export const handleCommand = async (
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient,
    executionId: string
) => {
    const logger: Logger = loggerModule.child({
        source: 'interactionCommandHandler.ts',
        module: 'handler',
        name: 'interactionCommandHandler',
        executionId: executionId
    });

    await interaction.deferReply();
    logger.debug('Interaction deferred.');

    // TODO: Update TS Type for command
    const command: Command = client.commands?.get(interaction.commandName) as Command;
    if (!command) {
        logger.warn(`Interaction created but command '${interaction.commandName}' was not found.`);
        return;
    }

    if (await cannotSendMessageInChannel({ interaction, executionId })) {
        return;
    }

    logger.debug('Executing command interaction.');
    await command.execute({ interaction, client, executionId });
};