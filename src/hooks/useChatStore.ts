
import { create } from 'zustand';

interface ChatMessage {
  id: string;
  authorId: string;
  text: string;
  timestamp: number;
}

interface ChatState {
  isChatOpen: boolean;
  messages: ChatMessage[];
  toggleChat: () => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isChatOpen: false,
  messages: [],
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
