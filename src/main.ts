import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { App } from './App';

async function bootstrap() {
  const app = await NestFactory.create(App);
  await app.listen(3000);
}
bootstrap();
