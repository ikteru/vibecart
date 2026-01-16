import { GeminiAIService } from './GeminiAIService';

export type CommandType =
  | 'confirm'
  | 'cancel'
  | 'status'
  | 'track'
  | 'help'
  | 'reorder';

export interface ParsedCommand {
  isCommand: boolean;
  command: CommandType | null;
  args: Record<string, string>;
  confidence: number;
  originalMessage: string;
}

// Command aliases for fuzzy matching
const COMMAND_ALIASES: Record<string, CommandType> = {
  // English
  'confirm': 'confirm',
  'confirmed': 'confirm',
  'approve': 'confirm',
  'ok': 'confirm',
  'yes': 'confirm',

  'cancel': 'cancel',
  'cancelled': 'cancel',
  'delete': 'cancel',
  'remove': 'cancel',
  'no': 'cancel',

  'status': 'status',
  'check': 'status',
  'where': 'status',
  'info': 'status',

  'track': 'track',
  'tracking': 'track',
  'location': 'track',
  'find': 'track',

  'help': 'help',
  'commands': 'help',
  '?': 'help',

  'reorder': 'reorder',
  'again': 'reorder',
  'repeat': 'reorder',

  // Arabic/Darija
  'اكد': 'confirm',
  'تأكيد': 'confirm',
  'موافق': 'confirm',
  'واخا': 'confirm',

  'الغي': 'cancel',
  'الغاء': 'cancel',
  'حذف': 'cancel',
  'لا': 'cancel',

  'حالة': 'status',
  'وين': 'status',
  'فين': 'status',
  'شنو': 'status',

  'تتبع': 'track',
  'وصل': 'track',

  'مساعدة': 'help',
  'عاون': 'help',

  // French
  'confirmer': 'confirm',
  'annuler': 'cancel',
  'statut': 'status',
  'suivre': 'track',
  'aide': 'help',
  'recommander': 'reorder',
};

// Regex patterns for extracting order numbers
const ORDER_NUMBER_PATTERNS = [
  /(?:order|طلب|commande|#)\s*[:#]?\s*(\w+-?\d+)/i,
  /(\w{2,4}-\d{4,})/i,  // Format like VC-1234
  /(\d{4,})/,  // Just numbers
];

/**
 * WhatsApp Command Parser
 *
 * Parses "/" commands from WhatsApp messages.
 * Supports fuzzy matching and AI-powered understanding.
 */
export class WhatsAppCommandParser {
  private geminiService: GeminiAIService | null = null;

  constructor() {
    // Initialize Gemini if API key is available
    if (process.env.GEMINI_API_KEY) {
      this.geminiService = new GeminiAIService();
    }
  }

  /**
   * Parse a WhatsApp message for commands
   */
  async parse(message: string): Promise<ParsedCommand> {
    const trimmedMessage = message.trim();

    // Check if message starts with "/" (explicit command)
    if (trimmedMessage.startsWith('/')) {
      return this.parseExplicitCommand(trimmedMessage);
    }

    // Try natural language parsing with AI if available
    if (this.geminiService) {
      const aiResult = await this.parseWithAI(trimmedMessage);
      if (aiResult.isCommand && aiResult.confidence > 0.7) {
        return aiResult;
      }
    }

    // No command detected
    return {
      isCommand: false,
      command: null,
      args: {},
      confidence: 0,
      originalMessage: message,
    };
  }

  /**
   * Parse explicit "/" commands
   */
  private parseExplicitCommand(message: string): ParsedCommand {
    // Remove the leading "/"
    const content = message.slice(1).trim();

    // Split into command and rest
    const parts = content.split(/\s+/);
    const commandWord = parts[0].toLowerCase();
    const rest = parts.slice(1).join(' ');

    // Match command (with fuzzy matching)
    const command = this.matchCommand(commandWord);

    if (!command) {
      // Try fuzzy match
      const fuzzyMatch = this.fuzzyMatchCommand(commandWord);
      if (fuzzyMatch) {
        return {
          isCommand: true,
          command: fuzzyMatch,
          args: this.extractArgs(rest, fuzzyMatch),
          confidence: 0.8,
          originalMessage: message,
        };
      }

      return {
        isCommand: false,
        command: null,
        args: {},
        confidence: 0,
        originalMessage: message,
      };
    }

    return {
      isCommand: true,
      command,
      args: this.extractArgs(rest, command),
      confidence: 1.0,
      originalMessage: message,
    };
  }

  /**
   * Match command word to CommandType
   */
  private matchCommand(word: string): CommandType | null {
    // Direct match
    if (COMMAND_ALIASES[word]) {
      return COMMAND_ALIASES[word];
    }

    // Check if it's a valid command type
    const validCommands: CommandType[] = ['confirm', 'cancel', 'status', 'track', 'help', 'reorder'];
    if (validCommands.includes(word as CommandType)) {
      return word as CommandType;
    }

    return null;
  }

  /**
   * Fuzzy match for typos (e.g., /canfirm -> confirm)
   */
  private fuzzyMatchCommand(word: string): CommandType | null {
    const commands: CommandType[] = ['confirm', 'cancel', 'status', 'track', 'help', 'reorder'];

    for (const cmd of commands) {
      // Simple Levenshtein-like check (within 2 character difference)
      if (this.isSimilar(word, cmd, 2)) {
        return cmd;
      }
    }

    // Check aliases
    for (const [alias, cmd] of Object.entries(COMMAND_ALIASES)) {
      if (this.isSimilar(word, alias, 2)) {
        return cmd;
      }
    }

    return null;
  }

  /**
   * Check if two strings are similar within a given edit distance
   */
  private isSimilar(a: string, b: string, maxDistance: number): boolean {
    if (Math.abs(a.length - b.length) > maxDistance) return false;

    let differences = 0;
    const minLen = Math.min(a.length, b.length);

    for (let i = 0; i < minLen; i++) {
      if (a[i] !== b[i]) differences++;
      if (differences > maxDistance) return false;
    }

    differences += Math.abs(a.length - b.length);
    return differences <= maxDistance;
  }

  /**
   * Extract arguments from the rest of the message
   */
  private extractArgs(rest: string, command: CommandType): Record<string, string> {
    const args: Record<string, string> = {};

    if (!rest) return args;

    // Extract order number
    for (const pattern of ORDER_NUMBER_PATTERNS) {
      const match = rest.match(pattern);
      if (match) {
        args.orderNumber = match[1];
        break;
      }
    }

    // If no pattern matched, use the entire rest as order number for certain commands
    if (!args.orderNumber && ['confirm', 'cancel', 'status', 'track', 'reorder'].includes(command)) {
      // Clean up the input
      const cleaned = rest.replace(/[^a-zA-Z0-9-]/g, '').trim();
      if (cleaned) {
        args.orderNumber = cleaned;
      }
    }

    // Store raw args
    args.raw = rest;

    return args;
  }

  /**
   * Parse message using Gemini AI for natural language understanding
   */
  private async parseWithAI(message: string): Promise<ParsedCommand> {
    if (!this.geminiService) {
      return {
        isCommand: false,
        command: null,
        args: {},
        confidence: 0,
        originalMessage: message,
      };
    }

    try {
      const result = await this.geminiService.parseCommand(message);
      return {
        ...result,
        originalMessage: message,
      };
    } catch (error) {
      console.error('AI parsing error:', error);
      return {
        isCommand: false,
        command: null,
        args: {},
        confidence: 0,
        originalMessage: message,
      };
    }
  }
}
