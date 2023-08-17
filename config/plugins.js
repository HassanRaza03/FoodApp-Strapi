module.exports = {
  email: {
    config: {
      provider: "mailgun",
      providerOptions: {
        key: process.env.MAILGUN_API_KEY, // Required
        domain: process.env.MAILGUN_API_DOMAIN, // Required
      },
      settings: {
        defaultFrom: "myemail@protonmail.com",
        defaultReplyTo: "myemail@protonmail.com",
      },
    },
  },
};
