import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const expressApp = express();

// Compatibilité avec les bundles frontend qui utilisent encore /api/auth/*.
expressApp.use((req, _res, next) => {
  if (req.url.startsWith('/api/auth/')) {
    req.url = `/api/v1${req.url.slice('/api'.length)}`;
  }
  next();
});

expressApp.get('/favicon.ico', (req, res) => res.status(204).end());

// Redirect Swagger UI static assets to CDN to prevent 404/MIME errors in Vercel Serverless
expressApp.get('/api/docs/swagger-ui.css', (req, res) =>
  res.redirect('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/swagger-ui.min.css'),
);
expressApp.get('/api/docs/swagger-ui-bundle.js', (req, res) =>
  res.redirect('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/swagger-ui-bundle.min.js'),
);
expressApp.get('/api/docs/swagger-ui-standalone-preset.js', (req, res) =>
  res.redirect('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/swagger-ui-standalone-preset.min.js'),
);
expressApp.get('/api/docs/favicon-32x32.png', (req, res) =>
  res.redirect('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/favicon-32x32.png'),
);
expressApp.get('/api/docs/favicon-16x16.png', (req, res) =>
  res.redirect('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/favicon-16x16.png'),
);

export const bootstrapServer = async (expressInstance: any) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'admin', 'docs', 'favicon.ico'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdnjs.cloudflare.com',
            'https://vercel.live',
            'https://*.vercel.live',
            'https://*.vercel.app',
          ],
          scriptSrcElem: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdnjs.cloudflare.com',
            'https://vercel.live',
            'https://*.vercel.live',
            'https://*.vercel.app',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
            'https://translate.googleapis.com',
            'https://www.gstatic.com',
            'https://fonts.googleapis.com',
          ],
          styleSrcElem: [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
            'https://translate.googleapis.com',
            'https://www.gstatic.com',
            'https://fonts.googleapis.com',
          ],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://validator.swagger.io',
            'https://cdnjs.cloudflare.com',
            'https://*.googleapis.com',
            'https://*.gstatic.com',
          ],
          connectSrc: [
            "'self'",
            'https://vercel.live',
            'https://*.vercel.live',
            'https://*.vercel.app',
          ],
        },
      },
    }),
  );

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

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        'https://uniflow.kernelforge.codes',
        'https://api-uniflow.kernelforge.codes',
        'https://api2-uniflow.kernelforge.codes',
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

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

  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1,
    },
    customSiteTitle: 'UniFlow API Documentation',
    customfavIcon:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/favicon-32x32.png',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.0/swagger-ui.min.css',
  });

  await app.init();
  return app;
};

let cachedApp: any;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await bootstrapServer(expressApp);
  }
  expressApp(req, res);
}
