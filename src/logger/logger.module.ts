import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppLogger } from './logger.service';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const level = config.get<string>('logging.level', 'debug');
        const isProduction = config.get<string>('app.nodeEnv') === 'production';

        const formats = isProduction
          ? [winston.format.timestamp(), winston.format.json()]
          : [
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.colorize({ all: true }),
              winston.format.printf(({ timestamp, level: lvl, message, context, ...meta }) => {
                const ctx = context ? `[${context}] ` : '';
                const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} ${lvl}: ${ctx}${message}${extra}`;
              }),
            ];

        return {
          transports: [
            new winston.transports.Console({
              level,
              format: winston.format.combine(...formats),
            }),
          ],
        };
      },
    }),
  ],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
