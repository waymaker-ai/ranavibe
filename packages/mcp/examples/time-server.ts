#!/usr/bin/env node
/**
 * Time & Date MCP Server Example
 * Demonstrates prompts and timezone handling
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'time-server', version: '1.0.0' },
  { capabilities: { tools: {}, prompts: {} } }
);

// Common timezone offsets (simplified)
const TIMEZONES: Record<string, number> = {
  'UTC': 0, 'GMT': 0,
  'EST': -5, 'EDT': -4, 'CST': -6, 'CDT': -5, 'MST': -7, 'MDT': -6, 'PST': -8, 'PDT': -7,
  'CET': 1, 'CEST': 2, 'EET': 2, 'EEST': 3,
  'IST': 5.5, 'JST': 9, 'AEST': 10, 'AEDT': 11, 'NZST': 12, 'NZDT': 13,
};

const tools = [
  {
    name: 'get_current_time',
    description: 'Get current time in a timezone',
    inputSchema: {
      type: 'object' as const,
      properties: {
        timezone: { type: 'string', description: 'Timezone (e.g., UTC, EST, PST, JST)' },
        format: { type: 'string', enum: ['iso', '12h', '24h'], description: 'Time format' },
      },
    },
  },
  {
    name: 'convert_timezone',
    description: 'Convert time between timezones',
    inputSchema: {
      type: 'object' as const,
      properties: {
        time: { type: 'string', description: 'Time to convert (HH:MM or ISO)' },
        from: { type: 'string', description: 'Source timezone' },
        to: { type: 'string', description: 'Target timezone' },
      },
      required: ['time', 'from', 'to'],
    },
  },
  {
    name: 'get_date_info',
    description: 'Get information about a date',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date (YYYY-MM-DD) or "today"' },
      },
    },
  },
  {
    name: 'calculate_duration',
    description: 'Calculate duration between two dates/times',
    inputSchema: {
      type: 'object' as const,
      properties: {
        start: { type: 'string', description: 'Start date/time' },
        end: { type: 'string', description: 'End date/time' },
      },
      required: ['start', 'end'],
    },
  },
  {
    name: 'add_time',
    description: 'Add or subtract time from a date',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Starting date (YYYY-MM-DD or "today")' },
        days: { type: 'number', description: 'Days to add (negative to subtract)' },
        hours: { type: 'number', description: 'Hours to add' },
        minutes: { type: 'number', description: 'Minutes to add' },
      },
      required: ['date'],
    },
  },
  {
    name: 'list_timezones',
    description: 'List available timezones',
    inputSchema: { type: 'object' as const, properties: {} },
  },
];

function getTimeInTimezone(tz: string, format: string = 'iso'): { time: string; date: string; timezone: string } {
  const offset = TIMEZONES[tz.toUpperCase()] ?? 0;
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const tzTime = new Date(utc + offset * 3600000);

  let timeStr: string;
  if (format === '12h') {
    const hours = tzTime.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    timeStr = `${h12}:${tzTime.getMinutes().toString().padStart(2, '0')} ${ampm}`;
  } else if (format === '24h') {
    timeStr = `${tzTime.getHours().toString().padStart(2, '0')}:${tzTime.getMinutes().toString().padStart(2, '0')}`;
  } else {
    timeStr = tzTime.toISOString();
  }

  return {
    time: timeStr,
    date: tzTime.toISOString().split('T')[0],
    timezone: tz.toUpperCase(),
  };
}

function getDayOfWeek(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_current_time': {
      const { timezone = 'UTC', format = 'iso' } = args as { timezone?: string; format?: string };
      if (!(timezone.toUpperCase() in TIMEZONES)) {
        return { content: [{ type: 'text', text: `Unknown timezone: ${timezone}` }], isError: true };
      }
      const result = getTimeInTimezone(timezone, format);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    case 'convert_timezone': {
      const { time, from, to } = args as { time: string; from: string; to: string };
      const fromOffset = TIMEZONES[from.toUpperCase()];
      const toOffset = TIMEZONES[to.toUpperCase()];

      if (fromOffset === undefined) {
        return { content: [{ type: 'text', text: `Unknown timezone: ${from}` }], isError: true };
      }
      if (toOffset === undefined) {
        return { content: [{ type: 'text', text: `Unknown timezone: ${to}` }], isError: true };
      }

      // Parse time (HH:MM format)
      const match = time.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) {
        return { content: [{ type: 'text', text: 'Invalid time format. Use HH:MM' }], isError: true };
      }

      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const totalMinutes = hours * 60 + minutes + (toOffset - fromOffset) * 60;
      const newHours = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
      const newMinutes = ((totalMinutes % 60) + 60) % 60;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            original: { time, timezone: from.toUpperCase() },
            converted: {
              time: `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`,
              timezone: to.toUpperCase(),
            },
          }, null, 2),
        }],
      };
    }

    case 'get_date_info': {
      const { date: dateStr = 'today' } = args as { date?: string };
      const date = dateStr === 'today' ? new Date() : new Date(dateStr);

      if (isNaN(date.getTime())) {
        return { content: [{ type: 'text', text: 'Invalid date' }], isError: true };
      }

      const info = {
        date: date.toISOString().split('T')[0],
        dayOfWeek: getDayOfWeek(date),
        dayOfYear: getDayOfYear(date),
        weekNumber: getWeekNumber(date),
        quarter: Math.ceil((date.getMonth() + 1) / 3),
        isLeapYear: isLeapYear(date.getFullYear()),
        daysInMonth: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
        unix: Math.floor(date.getTime() / 1000),
      };
      return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
    }

    case 'calculate_duration': {
      const { start, end } = args as { start: string; end: string };
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { content: [{ type: 'text', text: 'Invalid date(s)' }], isError: true };
      }

      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = Math.abs(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.abs(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.abs(diffMs / (1000 * 60));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            duration: {
              days: Math.floor(diffDays),
              hours: Math.floor(diffHours),
              minutes: Math.floor(diffMinutes),
              readable: `${Math.floor(diffDays)} days, ${Math.floor(diffHours % 24)} hours, ${Math.floor(diffMinutes % 60)} minutes`,
            },
          }, null, 2),
        }],
      };
    }

    case 'add_time': {
      const { date: dateStr, days = 0, hours = 0, minutes = 0 } = args as {
        date: string; days?: number; hours?: number; minutes?: number;
      };
      const date = dateStr === 'today' ? new Date() : new Date(dateStr);

      if (isNaN(date.getTime())) {
        return { content: [{ type: 'text', text: 'Invalid date' }], isError: true };
      }

      const newDate = new Date(date.getTime() +
        days * 24 * 60 * 60 * 1000 +
        hours * 60 * 60 * 1000 +
        minutes * 60 * 1000);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            original: date.toISOString(),
            added: { days, hours, minutes },
            result: newDate.toISOString(),
          }, null, 2),
        }],
      };
    }

    case 'list_timezones': {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(
            Object.entries(TIMEZONES).map(([tz, offset]) => ({
              timezone: tz,
              offset: `UTC${offset >= 0 ? '+' : ''}${offset}`,
            })),
            null, 2
          ),
        }],
      };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

// Prompts
const prompts = [
  { name: 'schedule_meeting', description: 'Help schedule a meeting across timezones', arguments: [
    { name: 'participants', description: 'Timezones of participants (comma-separated)', required: true },
    { name: 'duration', description: 'Meeting duration in hours' },
  ]},
  { name: 'countdown', description: 'Create a countdown to an event', arguments: [
    { name: 'event', description: 'Event name', required: true },
    { name: 'date', description: 'Event date (YYYY-MM-DD)', required: true },
  ]},
];

server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts }));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'schedule_meeting': {
      const participants = (args?.participants as string) || 'UTC';
      const duration = (args?.duration as string) || '1';
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Help me schedule a ${duration}-hour meeting with participants in these timezones: ${participants}. Find a time that works for everyone during business hours (9 AM - 6 PM).`,
          },
        }],
      };
    }
    case 'countdown': {
      const event = args?.event as string;
      const date = args?.date as string;
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Create a countdown for "${event}" on ${date}. Calculate how many days, hours, and minutes are left.`,
          },
        }],
      };
    }
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Time MCP server running');
}

main().catch(console.error);
