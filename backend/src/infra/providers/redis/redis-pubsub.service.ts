import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Environment } from '../../config/environment';

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private publisherClient: Redis | null = null;

  constructor(private readonly config: ConfigService<Environment, true>) {}

  private getRedisConfig(): {
    host: string;
    port: number;
    password?: string;
    lazyConnect: boolean;
  } {
    return {
      host: this.config.get('redisHost', { infer: true }),
      port: this.config.get('redisPort', { infer: true }),
      password: this.config.get('redisPassword', { infer: true }),
      lazyConnect: true,
    };
  }

  private async getPublisher(): Promise<Redis> {
    if (!this.publisherClient) {
      this.publisherClient = new Redis(this.getRedisConfig());
      this.publisherClient.on('error', (err) => {
        this.logger.error('Redis Publisher error:', err);
      });
      await this.publisherClient.connect();
    }
    return this.publisherClient;
  }

  /**
   * Publica uma mensagem em formato JSON em um canal Redis
   */
  async publish(channel: string, message: unknown): Promise<void> {
    try {
      const publisher = await this.getPublisher();
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      await publisher.publish(channel, payload);
    } catch (error) {
      this.logger.error(`Erro ao publicar no canal Redis "${channel}":`, error);
    }
  }

  /**
   * Cria um cliente dedicado de subscrição para um canal específico.
   * Retorna uma função de cancelamento para desinscrever e fechar a conexão de forma segura.
   */
  async subscribe(
    channel: string,
    onMessage: (message: string) => void,
  ): Promise<() => Promise<void>> {
    const subscriber = new Redis(this.getRedisConfig());

    subscriber.on('error', (err) => {
      this.logger.error(`Redis Subscriber error on channel "${channel}":`, err);
    });

    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        onMessage(message);
      }
    });

    await subscriber.connect();
    await subscriber.subscribe(channel);

    return async () => {
      try {
        await subscriber.unsubscribe(channel);
        subscriber.disconnect();
      } catch (err) {
        this.logger.warn(`Erro ao desinscrever do canal "${channel}":`, err);
      }
    };
  }

  onModuleDestroy(): void {
    if (this.publisherClient) {
      try {
        this.publisherClient.disconnect();
      } catch (err) {
        this.logger.warn('Erro ao desconectar publisher Redis:', err);
      }
      this.publisherClient = null;
    }
  }
}
