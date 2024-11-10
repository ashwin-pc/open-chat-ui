
export enum BedrockModelNames {
    CLAUDE_V3_5_SONNET_V2 = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    CLAUDE_V3_5_SONNET = 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
    CLAUDE_V3_5_HAIKU = 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
    CLAUDE_V3_OPUS = 'us.anthropic.claude-3-opus-20240229-v1:0',
    CLAUDE_V3_SONNET = 'us.anthropic.claude-3-sonnet-20240229-v1:0',
    CLAUDE_V3_HAIKU = 'us.anthropic.claude-3-haiku-20240307-v1:0',
}

export type Message = {
    sender: 'Human' | 'Assistant';
    text: string;
};