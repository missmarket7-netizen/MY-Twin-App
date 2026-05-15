import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ cancelled: true }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
}));

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
    },
  },
}));

jest.mock('posthog-react-native', () => {
  return jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  }));
});

import Chat from '../app/chat';
import { useTwinStore } from '../store/useTwinStore';

// Mock the store
jest.mock('../store/useTwinStore', () => ({
  useTwinStore: jest.fn(),
}));

// Mock the API
jest.mock('../lib/api', () => ({
  askTwin: jest.fn(),
}));

describe('Chat Component', () => {
  const mockStore = {
    twinName: 'توأمك',
    bondLevel: 50,
    relationshipDims: {},
    chatHistory: [],
    addMessage: jest.fn(),
    updateBond: jest.fn(),
    calmMode: false,
    toggleCalmMode: jest.fn(),
    triggerHaptic: jest.fn(),
    userId: '123',
  };

  beforeEach(() => {
    const mockedUseTwinStore = useTwinStore as unknown as jest.Mock<any, any, any>;
    mockedUseTwinStore.mockReturnValue(mockStore);
  });

  it('renders correctly', () => {
    const { getByText } = render(<Chat />);
    expect(getByText('توأمك')).toBeTruthy();
  });

  it('sends a message', async () => {
    const { getByPlaceholderText, getByText } = render(<Chat />);
    const input = getByPlaceholderText('اكتب رسالتك...');
    const sendButton = getByText('↑');

    fireEvent.changeText(input, 'مرحبا');
    fireEvent.press(sendButton);

    expect(mockStore.addMessage).toHaveBeenCalledWith('user', 'مرحبا');
  });

  it('toggles calm mode', () => {
    const { getByText } = render(<Chat />);
    const calmButton = getByText('🔔');

    fireEvent.press(calmButton);
    expect(mockStore.toggleCalmMode).toHaveBeenCalled();
  });
});