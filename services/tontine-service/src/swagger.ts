import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TontineApp — Tontine Service',
      version: '1.0.0',
      description: 'Logique métier : groupes, cotisations, rotation, score de fiabilité.',
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
});
