import config from 'config';
import { EmbedBuilder, InteractionType } from 'discord.js';

import loggerModule from '../../services/logger';
import { EmbedOptions } from '../../types/configTypes';
import { QueueDoesNotExistParams, QueueIsEmptyParams, QueueNoCurrentTrackParams } from '../../types/utilTypes';
import { Logger } from 'pino';

const embedOptions: EmbedOptions = config.get('embedOptions');
export const queueDoesNotExist = async ({ interaction, queue, executionId }: QueueDoesNotExistParams) => {
    const logger: Logger = loggerModule.child({
        source: 'queueValidator.js',
        module: 'utilValidation',
        name: 'queueDoesNotExist',
        executionId: executionId,
        shardId: interaction.guild?.shardId,
        guildId: interaction.guild?.id
    });

    const interactionIdentifier =
        interaction.type === InteractionType.ApplicationCommand ? interaction.commandName : interaction.customId;

    if (!queue) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `**${embedOptions.icons.warning} Oops!**\nThere are no tracks in the queue and nothing currently playing. First add some tracks with **\`/play\`**!`
                    )
                    .setColor(embedOptions.colors.warning)
            ]
        });

        logger.debug(`User tried to use command '${interactionIdentifier}' but there was no queue.`);
        return true;
    }

    return false;
};

export const queueNoCurrentTrack = async ({ interaction, queue, executionId }: QueueNoCurrentTrackParams) => {
    const logger: Logger = loggerModule.child({
        source: 'queueValidator.js',
        module: 'utilValidation',
        name: 'queueNoCurrentTrack',
        executionId: executionId,
        shardId: interaction.guild?.shardId,
        guildId: interaction.guild?.id
    });

    const interactionIdentifier =
        interaction.type === InteractionType.ApplicationCommand ? interaction.commandName : interaction.customId;

    if (!queue.currentTrack) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `**${embedOptions.icons.warning} Oops!**\nThere is nothing currently playing. First add some tracks with **\`/play\`**!`
                    )
                    .setColor(embedOptions.colors.warning)
            ]
        });

        logger.debug(`User tried to use command '${interactionIdentifier}' but there was no current track.`);
        return true;
    }

    return false;
};

export const queueIsEmpty = async ({ interaction, queue, executionId }: QueueIsEmptyParams) => {
    const logger: Logger = loggerModule.child({
        source: 'queueValidator.js',
        module: 'utilValidation',
        name: 'queueIsEmpty',
        executionId: executionId,
        shardId: interaction.guild?.shardId,
        guildId: interaction.guild?.id
    });

    const interactionIdentifier =
        interaction.type === InteractionType.ApplicationCommand ? interaction.commandName : interaction.customId;

    if (queue.tracks.data.length === 0) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `**${embedOptions.icons.warning} Oops!**\nThere are no tracks added to the queue. First add some tracks with **\`/play\`**!`
                    )
                    .setColor(embedOptions.colors.warning)
            ]
        });

        logger.debug(`User tried to use command '${interactionIdentifier}' but there was no tracks in the queue.`);
        return true;
    }

    return false;
};