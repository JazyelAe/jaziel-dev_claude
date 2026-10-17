'use strict';
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const nodemailer = require('nodemailer');
const { createHandler } = require('./handler');

// Configuración (ver firebase/README.md). La contraseña NUNCA va en el código: vive en Secret Manager.
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');
const MAIL_USER = defineString('MAIL_USER', { default: 'jahirarana06@gmail.com', description: 'Cuenta de Gmail que envía los mensajes' });
const CONTACT_TO = defineString('CONTACT_TO', { default: 'jahirarana06@gmail.com', description: 'Correo que recibe los mensajes' });
const ALLOWED_ORIGINS = defineString('ALLOWED_ORIGINS', { default: 'https://jazyelae.github.io', description: 'Orígenes permitidos, separados por comas' });

let handler;
exports.contact = onRequest(
  { region: 'us-central1', secrets: [GMAIL_APP_PASSWORD], maxInstances: 3, memory: '256MiB', timeoutSeconds: 30, invoker: 'public', cors: false },
  async (req, res) => {
    handler ||= createHandler({
      allowedOrigins: ALLOWED_ORIGINS.value().split(','),
      to: CONTACT_TO.value(),
      logger,
      sendMail: (mail) => nodemailer
        .createTransport({ service: 'gmail', auth: { user: MAIL_USER.value(), pass: GMAIL_APP_PASSWORD.value() } })
        .sendMail({ from: `"JAZIEL.DEV" <${MAIL_USER.value()}>`, ...mail }),
    });
    return handler(req, res);
  }
);
