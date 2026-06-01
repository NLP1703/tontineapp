import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TontineApp — Auth Service',
      version: '1.0.0',
      description: "Service d'authentification (inscription, connexion JWT, OTP, profil).",
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
});
