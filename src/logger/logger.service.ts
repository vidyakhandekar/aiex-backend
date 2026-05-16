import { Injectable, Inject, LoggerService, Optional } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
  private context?: string;

  constructor(
    @Optional()
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winston: Logger,
  ) {}

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  log(message: any, context?: string): void {
    this.winston?.info(message, { context: context ?? this.context });
  }

  error(message: any, trace?: string, context?: string): void {
    this.winston?.error(message, { trace, context: context ?? this.context });
  }

  warn(message: any, context?: string): void {
    this.winston?.warn(message, { context: context ?? this.context });
  }

  debug(message: any, context?: string): void {
    this.winston?.debug(message, { context: context ?? this.context });
  }

  verbose(message: any, context?: string): void {
    this.winston?.verbose(message, { context: context ?? this.context });
  }
}
