import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  // Protection des en-têtes HTTP (§9.3 du CDC)
  // Assouplissement temporaire de la CSP pour permettre Swagger et les outils Vercel/Translate
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://*.vercel.live"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://translate.googleapis.com", "https://www.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://validator.swagger.io", "https://*.googleapis.com", "https://*.gstatic.com"],
          connectSrc: ["'self'", "https://*.vercel.live"],
        },
      },
    }),
  );

  // Validation automatique des DTO (class-validator) — §7.2 du CDC
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Configuration CORS sécurisée (§9.3)
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        'https://uniflow.kernelforge.codes',
        'https://api-uniflow.kernelforge.codes',
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Documentation API interactive (§10.1 du CDC)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('UniFlow API')
    .setDescription(
      'API REST du backend UniFlow — plateforme universitaire intelligente, modulaire et Offline First.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrer le token JWT obtenu via /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  
  // Utilisation explicite des CDN pour les assets afin d'éviter le problème de 404/MIME type
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1,
    },
    customSiteTitle: 'UniFlow API Documentation',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/swagger-ui-standalone-preset.min.js'
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/swagger-ui.min.css'
    ],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error("Erreur au démarrage de l'application:", err);
  process.exit(1);
});
