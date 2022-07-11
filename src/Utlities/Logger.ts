import * as L from 'logger-fp-ts';
import { SystemClock } from 'clock-ts';
import { io as IO } from 'fp-ts';
import { Logger } from '@nestjs/common';

export const loggerEnv: L.LoggerEnv = {
  clock: SystemClock,
  logger: (entry: L.LogEntry) => {
    const level = entry.level === 'INFO' ? 'log' : entry.level.toLowerCase();
    return IO.of(Logger[level](entry.message, entry.payload));
  },
};
