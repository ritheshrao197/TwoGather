
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
  currentMemberId: string | null;
  partnerMemberId: string | null;
  toggleChat: () => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setMembers: (currentId: string, partnerId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isChatOpen: false,
  messages: [],
  currentMemberId: null,
  partnerMemberId: null,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setMembers: (currentId, partnerId) =>
    set({ currentMemberId: currentId, partnerMemberId: partnerId }),
}));
