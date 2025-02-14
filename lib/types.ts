export enum BedrockModelNames {
  AMZN_NOVA_PRO = 'us.amazon.nova-pro-v1:0',
  CLAUDE_V3_5_SONNET_V2 = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  CLAUDE_V3_5_SONNET = 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
  CLAUDE_V3_5_HAIKU = 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  CLAUDE_V3_OPUS = 'us.anthropic.claude-3-opus-20240229-v1:0',
  CLAUDE_V3_SONNET = 'us.anthropic.claude-3-sonnet-20240229-v1:0',
  CLAUDE_V3_HAIKU = 'us.anthropic.claude-3-haiku-20240307-v1:0',
}

export enum Roles {
  HUMAN = 'Human',
  ASSISTANT = 'Assistant',
}

export interface Attachment {
  name: string;
  content: string; // Base64 or plain text
}

export interface SystemPrompt {
  id: string;
  name: string;
  text: string;
  readonly?: boolean;
}

export type Message = {
  text: string;
  sender: Roles;
  attachments?: Attachment[]; // Use Attachment interface
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
  systemPromptId?: string;
  isIncognitoThread?: boolean;
}

export const BedrockModelDisplayNames: Record<BedrockModelNames, string> = {
  [BedrockModelNames.CLAUDE_V3_5_SONNET_V2]: 'Claude 3.5 Sonnet v2 (best model)',
  [BedrockModelNames.CLAUDE_V3_5_SONNET]: 'Claude 3.5 Sonnet (older best model)',
  [BedrockModelNames.AMZN_NOVA_PRO]: `Amazon Nova Pro (it's whatever..)`,
  [BedrockModelNames.CLAUDE_V3_5_HAIKU]: `Claude 3.5 Haiku (i'm fast!)`,
  [BedrockModelNames.CLAUDE_V3_OPUS]: 'Claude 3 Opus (old news now..)',
  [BedrockModelNames.CLAUDE_V3_SONNET]: 'Claude 3 Sonnet (meh..)',
  [BedrockModelNames.CLAUDE_V3_HAIKU]: 'Claude 3 Haiku (ugh..)',
};

export enum CreativityLevel {
  PRECISE = 'PRECISE',
  BALANCED = 'BALANCED',
  CREATIVE = 'CREATIVE',
}

export interface ModelInferenceParameters {
  temperature?: number;
  top_k?: number;
  top_p?: number;
}

export const CREATIVITY_PARAMETERS: Record<CreativityLevel, ModelInferenceParameters> = {
  [CreativityLevel.PRECISE]: {
    top_p: 0.15,
  },
  [CreativityLevel.BALANCED]: {
    top_p: 0.5,
  },
  [CreativityLevel.CREATIVE]: {
    top_p: 0.85,
  },
};

export interface ChatApiInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: (prompt: string, chatHistory: Array<Message>) => Promise<any>;
  getLatestResponse: (
    conversationId: string,
    timestamp: number,
  ) => Promise<{
    status: string;
    latestResponse: string;
  }>;
  abortConversation: (conversationId: string) => Promise<void>;
  createConversation: (
    message: string,
    chatHistory: Array<Message>,
    id: string,
    updatedTime: number,
    model: BedrockModelNames,
    systemContext: string,
    onError: (error: string) => void,
    modelInferenceParams?: ModelInferenceParameters,
  ) => void;
}
