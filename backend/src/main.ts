import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as tsconfigPaths from 'tsconfig-paths';

// Registrar path aliases
const tsconfigPath = require('path').join(__dirname, '../tsconfig.json');
tsconfigPaths.register({
  baseUrl: require('path').join(__dirname, '../'),
  paths: require('fs').existsSync(tsconfigPath) 
    ? require(tsconfigPath).compilerOptions.paths 
    : {}
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todos los endpoints
  app.setGlobalPrefix('api');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS para desarrollo
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
}
bootstrap();
