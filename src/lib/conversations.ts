
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "thinkboard-ai-conversations";

export function getConversations(): Conversation[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function createConversation(): string {
  const now = new Date().toISOString();

  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  saveConversations([conversation, ...getConversations()]);

  return conversation.id;
}

export function getConversation(id: string): Conversation | undefined {
  return getConversations().find((conversation) => conversation.id === id);
}

export function saveConversationMessages(
  id: string,
  messages: ChatMessage[],
) {
  const conversations = getConversations();
  const conversation = conversations.find((item) => item.id === id);

  if (!conversation) return;

  conversation.messages = messages;
  conversation.updatedAt = new Date().toISOString();

  const firstUserMessage = messages.find((message) => message.role === "user");

  if (firstUserMessage && conversation.title === "New conversation") {
    conversation.title =
      firstUserMessage.content.trim().slice(0, 45) || "New conversation";
  }

  saveConversations(conversations);
}

export function renameConversation(id: string, title: string) {
  const conversations = getConversations();
  const conversation = conversations.find((item) => item.id === id);

  if (!conversation) return;

  conversation.title = title.trim() || "New conversation";
  conversation.updatedAt = new Date().toISOString();

  saveConversations(conversations);
}

export function deleteConversation(id: string) {
  const conversations = getConversations().filter(
    (conversation) => conversation.id !== id,
  );

  saveConversations(conversations);
}
