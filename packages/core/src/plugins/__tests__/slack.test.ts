/**
 * Slack Plugin Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SlackBot, createSlackPlugin } from '../slack';

describe('SlackBot', () => {
  let bot: SlackBot;

  beforeEach(() => {
    bot = createSlackPlugin({
      botToken: 'xoxb-test-token',
      maxRequestsPerMinute: 60,
    });
  });

  describe('initialization', () => {
    it('should create a bot instance', () => {
      expect(bot).toBeDefined();
      expect(bot).toBeInstanceOf(SlackBot);
    });

    it('should accept configuration', () => {
      const customBot = createSlackPlugin({
        botToken: 'xoxb-custom-token',
        appToken: 'xapp-custom-token',
        maxRequestsPerMinute: 30,
        autoThreadReplies: false,
      });

      expect(customBot).toBeDefined();
    });
  });

  describe('event handlers', () => {
    it('should register message handlers', () => {
      const handler = async () => {};
      bot.onMessage(handler);
      // Handler registered successfully if no error thrown
      expect(true).toBe(true);
    });

    it('should register command handlers', () => {
      const handler = async () => 'response';
      bot.onCommand('test', handler);
      // Handler registered successfully if no error thrown
      expect(true).toBe(true);
    });

    it('should register interaction handlers', () => {
      const handler = async () => {};
      bot.onInteraction(handler);
      // Handler registered successfully if no error thrown
      expect(true).toBe(true);
    });

    it('should register event handlers', () => {
      const handler = async () => {};
      bot.onEvent('app_mention', handler);
      // Handler registered successfully if no error thrown
      expect(true).toBe(true);
    });
  });

  describe('user context', () => {
    it('should set and get user context', () => {
      const userId = 'U12345';
      const context = { conversationHistory: [] };

      bot.setUserContext(userId, context);
      const retrieved = bot.getUserContext(userId);

      expect(retrieved).toEqual(context);
    });

    it('should return undefined for non-existent context', () => {
      const context = bot.getUserContext('U99999');
      expect(context).toBeUndefined();
    });

    it('should clear user context', () => {
      const userId = 'U12345';
      bot.setUserContext(userId, { data: 'test' });
      bot.clearUserContext(userId);

      const context = bot.getUserContext(userId);
      expect(context).toBeUndefined();
    });
  });

  describe('Block Kit helpers', () => {
    it('should create section block', () => {
      const section = SlackBot.createSection('Test text');

      expect(section).toEqual({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Test text',
        },
      });
    });

    it('should create section with plain text', () => {
      const section = SlackBot.createSection('Test text', false);

      expect(section).toEqual({
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'Test text',
        },
      });
    });

    it('should create header block', () => {
      const header = SlackBot.createHeader('My Header');

      expect(header).toEqual({
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'My Header',
          emoji: true,
        },
      });
    });

    it('should create divider block', () => {
      const divider = SlackBot.createDivider();

      expect(divider).toEqual({
        type: 'divider',
      });
    });

    it('should create button element', () => {
      const button = SlackBot.createButton('Click Me', 'action_id');

      expect(button).toEqual({
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Click Me',
          emoji: true,
        },
        action_id: 'action_id',
        value: 'action_id',
      });
    });

    it('should create button with custom value and style', () => {
      const button = SlackBot.createButton(
        'Delete',
        'delete_action',
        'delete_123',
        'danger'
      );

      expect(button).toEqual({
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Delete',
          emoji: true,
        },
        action_id: 'delete_action',
        value: 'delete_123',
        style: 'danger',
      });
    });

    it('should create actions block', () => {
      const button1 = SlackBot.createButton('Button 1', 'action1');
      const button2 = SlackBot.createButton('Button 2', 'action2');
      const actions = SlackBot.createActions([button1, button2]);

      expect(actions).toEqual({
        type: 'actions',
        elements: [button1, button2],
      });
    });
  });

  describe('lifecycle', () => {
    it('should start the bot', async () => {
      await expect(bot.start()).resolves.not.toThrow();
    });

    it('should not start twice', async () => {
      await bot.start();
      await expect(bot.start()).rejects.toThrow('Slack bot is already running');
    });

    it('should stop the bot', async () => {
      await bot.start();
      await expect(bot.stop()).resolves.not.toThrow();
    });

    it('should allow stopping when not running', async () => {
      await expect(bot.stop()).resolves.not.toThrow();
    });
  });
});
