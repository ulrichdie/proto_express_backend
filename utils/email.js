/** @format */

const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

// Class de gestion des emails
module.exports = class Email {
  constructor(user, url, fichierjoint = []) {
    this.to = user.email;
    this.name = user.nom + " " + user.prenoms;
    this.url = url;
    this.from = `Prototype Apps <${process.env.EMAIL_FROM}>`;
    this.attachments = fichierjoint;
  }

  // Méthode de Création de transporteur
  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Traiitements production
      return nodemailer.createTransport({
        service: "",
        auth: {
          user: "",
          pass: "",
        },
      });
    }
    // Traiitements développement
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Méthode d'envoi de mail
  async send(template, subject) {
    // 1- récupérer le template pug
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstname: this.name,
        url: this.url,
        subject,
      }
    );

    // 2- Définir les options du mail
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html, {
        wordwrap: 130,
      }),
      attachments: this.attachments,
      // [
      //   {
      //     filename: "text1.txt",
      //     path: "/path/to/file.txt",
      //   },
      // ],
    };

    // 3- créer le transporteur et envoyer le mail
    await this.newTransport().sendMail(mailOptions);
  }

  // Methode d'envoi de mail d'inscription
  async sendWelcome() {
    await this.send(
      "welcome",
      "Bienvenue, votre compte a été créé avec succès !"
    );
  }

  // Methode d'envoi de mail de récupération de mot de passe
  async sendPasswordReset() {
    await this.send(
      "welcome",
      "Votre token de réinitialisation de mot de passe"
    );
  }
};
