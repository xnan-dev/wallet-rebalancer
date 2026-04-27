import winston from "winston";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const { createLogger, format, transports } = winston;

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(),
    format.printf(({ message }) => {
      // By returning just `message` (with color codes), it matches our old console.log styling exactly
      if (typeof message === 'object') {
        return JSON.stringify(message, null, 2);
      }
      return `${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: path.join(logsDir, "rebalancer.log"),
      format: format.combine(
        format.uncolorize(), // Removes ANSI color codes in file
        format.timestamp(),
        format.printf(({ timestamp, message }) => `[${timestamp}] ${message}`)
      )
    })
  ]
});

export function ansiGreen(text: string) { return `\x1b[32m${text}\x1b[0m`; }
export function ansiYellow(text: string) { return `\x1b[1;93m${text}\x1b[0m`; }
export function ansiRed(text: string) { return `\x1b[1;91m${text}\x1b[0m`; }
export function ansiWhite(text: string) { return `\x1b[1;97m${text}\x1b[0m`; }

export function formatTitle(title: string): string {
  const totalLen = 30;
  const padding = totalLen - title.length - 2;
  if (padding <= 0) return `\n${ansiWhite(`= ${title} =`)}`;
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return `\n${ansiWhite(`${"=".repeat(leftPad)} ${title} ${"=".repeat(rightPad)}`)}`;
}

export function formatFooter(): string {
  return ansiWhite("=".repeat(30));
}
