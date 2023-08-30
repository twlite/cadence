import config from 'config';
import { GuildQueue, Track, useQueue } from 'discord-player';
import { EmbedBuilder, GuildMember, SlashCommandBuilder } from 'discord.js';
import { Logger } from 'pino';
import loggerModule from '../../../services/logger';
import { EmbedOptions } from '../../../types/configTypes';
import { CustomSlashCommandInteraction } from '../../../types/interactionTypes';
import { queueDoesNotExist } from '../../../utils/validation/queueValidator';
import { notInSameVoiceChannel, notInVoiceChannel } from '../../../utils/validation/voiceChannelValidator';

const embedOptions: EmbedOptions = config.get('embedOptions');

const command: CustomSlashCommandInteraction = {
    isNew: false,
    isBeta: false,
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a specific track from the queue.')
        .setDMPermission(false)
        .setNSFW(false)
        .addNumberOption((option) =>
            option
                .setName('tracknumber')
                .setDescription('Track number to remove from queue.')
                .setMinValue(1)
                .setRequired(true)
        ),
    execute: async ({ interaction, executionId }) => {
        const logger: Logger = loggerModule.child({
            source: 'remove.js',
            module: 'slashCommand',
            name: '/remove',
            executionId: executionId,
            shardId: interaction.guild?.shardId,
            guildId: interaction.guild?.id
        });

        const queue: GuildQueue = useQueue(interaction.guild!.id)!;

        const validators = [
            () => notInVoiceChannel({ interaction, executionId }),
            () => queueDoesNotExist({ interaction, queue, executionId }),
            () => notInSameVoiceChannel({ interaction, queue, executionId })
        ];

        for (const validator of validators) {
            if (await validator()) {
                return;
            }
        }

        const removeTrackNumber: number = interaction.options.getNumber('tracknumber')!;

        if (removeTrackNumber > queue.tracks.data.length) {
            logger.debug('Specified track number is higher than total tracks.');

            logger.debug('Responding with warning embed.');
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**${embedOptions.icons.warning} Oops!**\nTrack **\`${removeTrackNumber}\`** is not a valid track number. There are a total of **\`${queue.tracks.data.length}\`** tracks in the queue.\n\nView tracks added to the queue with **\`/queue\`**.`
                        )
                        .setColor(embedOptions.colors.warning)
                ]
            });
        }

        // Remove specified track number from queue
        const removedTrack: Track = queue.node.remove(removeTrackNumber - 1)!;
        logger.debug(`Removed track '${removedTrack.url}' from queue.`);
        let durationFormat =
            Number(removedTrack.raw.duration) === 0 || removedTrack.duration === '0:00'
                ? ''
                : `\`${removedTrack.duration}\``;

        if (removedTrack.raw.live) {
            durationFormat = `${embedOptions.icons.liveTrack} \`LIVE\``;
        }

        let authorName: string;

        if (interaction.member instanceof GuildMember) {
            authorName = interaction.member.nickname || interaction.user.username;
        } else {
            authorName = interaction.user.username;
        }

        logger.debug('Responding with success embed.');
        return await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: authorName,
                        iconURL: interaction.user.avatarURL() || embedOptions.info.fallbackIconUrl
                    })
                    .setDescription(
                        `**${embedOptions.icons.success} Removed track**\n**${durationFormat} [${removedTrack.title}](${
                            removedTrack.raw.url ?? removedTrack.url
                        })**`
                    )
                    .setThumbnail(removedTrack.thumbnail)
                    .setColor(embedOptions.colors.success)
            ]
        });
    }
};

export default command;