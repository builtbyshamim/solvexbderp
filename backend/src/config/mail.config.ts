export default () => ({
  mail: {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM_ADDRESS,
  },
});
