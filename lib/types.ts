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

export type Branch = {
  id: number;
  name: string;
  messages: Message[];
  attachments: File[];
  createdAt: Date;
  description?: string;
  model?: BedrockModelNames;
};

export interface ChatThread {
  id: string;
  name: string;
  branches: Branch[];
  currentBranchId: number;
}

export const BedrockModelDisplayNames: Record<BedrockModelNames, string> = {
  [BedrockModelNames.CLAUDE_V3_5_SONNET_V2]: 'Claude 3.5 Sonnet v2 (new brain)',
  [BedrockModelNames.CLAUDE_V3_5_SONNET]: 'Claude 3.5 Sonnet (old best model)',
  [BedrockModelNames.CLAUDE_V3_5_HAIKU]: 'Claude 3.5 Haiku (another one)',
  [BedrockModelNames.CLAUDE_V3_OPUS]: 'Claude 3 Opus (wanna be best, but not quite..)',
  [BedrockModelNames.CLAUDE_V3_SONNET]: 'Claude 3 Sonnet (meh..)',
  [BedrockModelNames.CLAUDE_V3_HAIKU]: 'Claude 3 Haiku (ugh..)',
};
