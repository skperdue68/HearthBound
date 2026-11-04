import { SlashCommandBuilder } from 'discord.js';

export const commandBuilders = [
  new SlashCommandBuilder().setName('hearth').setDescription('Open HearthBound: discover houses and housing tours'),
  new SlashCommandBuilder().setName('housing').setDescription('Open HearthBound (compatibility alias for /hearth)')
];
for(const command of commandBuilders)command.addStringOption(option=>option.setName('house').setDescription('Select a saved house by nickname or ESO owner; choose this before screenshot').setAutocomplete(true)).addAttachmentOption(option=>option.setName('screenshot').setDescription('Choose a file for the selected house (PNG/JPEG/WebP, up to 5 MB)')).addStringOption(option=>option.setName('caption').setDescription('Describe this screenshot').setMaxLength(250));
export const commandJson = commandBuilders.map(c=>c.toJSON());
