import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
    (useTwinStore as jest.Mock).mockReturnValue(mockStore);
  });

  it('renders correctly', () => {
    const { getByText } = render(<Chat />);
    expect(getByText('توأمك')).toBeTruthy();
  });

  it('sends a message', async () => {
    const { getByPlaceholderText, getByText } = render(<Chat />);
    const input = getByPlaceholderText('اكتب رسالتك...');
    const sendButton = getByText('إرسال');

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