/** @format */

const promisify = require("util-promisify");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppOpeError = require("../utils/appOpeErrors.js");
const crypto = require("crypto");
const Email = require("./../utils/email.js");
const moment = require("moment");
const { Users, sequelize } = require("../sequelize/models");

// transformer la methode query en promesse
// const query = promisify(db.query).bind(db);

//Génération de token
const generToken = () => {
  // Générer token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // crypter token généré qui sera enregistré dans la base
  const cryptResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const ConvExpireDate = moment(Date.now() + 10 * 60 * 1000).format(
    "YYYY-MM-DD HH:mm:ss"
  );
  const cryptData = {
    resetToken,
    cryptResetToken,
    resetToken,
    ConvExpireDate,
  };
  return cryptData;
};

// fonction de Génération du token
const GenToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRED,
  });
};

// Option des cookies
const cookieOptions = {
  expires: Date.now() + process.env.JWT_COOKIE_EXPIRED * 24 * 60 * 60 * 1000,
  httpOnly: true,
};
if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

// fonction d'Envoi du token
const creatSendToken = (user, statusCode, res) => {
  const token = GenToken(user.id);
  // Envoyer le token par cookie
  res.cookie("jwt", token, cookieOptions);

  user.password = null;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// Création d'un nouvel utilisateur
exports.signup = async (req, res, next) => {
  try {
    // Destructuring
    const { nom, prenoms, profil, email, tel, adresse, pwdcrypt } = req.body;

    // Crypter mot de passe
    req.body.pwdcrypt = await bcrypt.hash(req.body.password, 12);

    // Créer l'utilisateur s'il n'existe pas l'email
    const [user, created] = await Users.findOrCreate({
      where: {
        email: email,
      },
      defaults: {
        password: pwdcrypt,
        nom: nom,
        prenoms: prenoms,
        profil_id: profil,
        tel: tel,
        adresse: adresse,
        user_uuid: crypto.randomUUID(),
      },
    });
    // erreur en cas ou l'email existe déjà
    if (!created) {
      return next(new AppOpeError("Email déjà utilisé.", 400));
    }

    // envoi de mail de bienvenue

    // Url de redirection
    const url = `${req.protocol}://${req.get("host")}}`;
    // Fichier joint
    const join1 = `${__dirname}/../public/documents/Document test.txt`;
    const join2 = `${__dirname}/../public/documents/Pdf test.pdf`;
    const attach = [
      { filename: "Documents de souscription.txt", path: join1 },
      { filename: "Documents de souscription.pdf", path: join2 },
    ];
    // Envoi du mail
    await new Email(user, url, attach).sendWelcome();

    // Response
    res.status(201).json({
      status: "success",
      message: "utilisateur enregistré",
      data: user,
    });
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res, next) => {
  try {
    // Destructuring
    const { mail, pwd } = req.body;
    // Requete
    const user = await Users.findOne({ where: { email: mail } });
    // Controler utilisateur et password
    if (user === null || !(await bcrypt.compare(pwd, rows.password))) {
      return next(new AppOpeError("Email ou mot de passe incorrects"), 401);
    }
    // Générer et envoyer le token
    creatSendToken(user, 200, res);
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// Middleware de protection des routes avec auth token
exports.auth = async (req, res, next) => {
  try {
    // rechercher le token
    let token = "";
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Token introuvable
    if (!token) {
      return next(new AppOpeError("Token incorrect", 401));
    }

    // Valider le token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Vérifier si l'utilisateur existe
    const user = await Users.findOne({ where: { id: decode.id } });
    req.userId = user.id;

    next();
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// Gestion de la demande de nouveau mot de passe
exports.forgotPassword = async (req, res, next) => {
  try {
    const { mail } = req.body;
    // Vérifier l'existance de l'utilisateur
    let user = await Users.findOne({ where: { email: mail } });
    if (user === null) {
      return next(new AppOpeError("Utilisateur introuvable", 404));
    }
    // Générer un token temporaire à l'utilisateur
    const genToken = generToken();

    // enregistrer les informations du token dans la base
    await Users.update(
      { key: genToken.cryptResetToken, key_validity: genToken.ConvExpireDate },
      { where: { email: mail } }
    );

    // Créer le lien de reset
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${genToken.resetToken}`;

    const message = `Vous avez oublié votre mot de passe ? Veuillez le réinitialiser en cliquant sur le lien ${resetURL}. ce lien est valide 10mn, si vous n'êtes pas à la base de cette action et que vous n'avez pas oublié votre mot de passe veuillez ignorer ce message.`;

    try {
      // Envoi du mail de réinitialisation

      res.status(200).json({
        status: "success",
        message: "Un email de réinitilisation vous à été envoyé",
      });
    } catch (error) {
      // En cas d'erreur d'envoi remettre les informations de réinitilisation PWD du user en l'état
      await Users.update(
        { key: null, key_validity: null },
        { where: { email: mail } }
      );
      return next(new AppOpeError(error, 404));
    }
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// modifier le mot de passe
exports.resetPassword = async (req, res, next) => {
  try {
    // crypter le token
    let token = req.params.token;
    req.body.pwdcrypt = await bcrypt.hash(req.body.pwd, 12);
    const cryptToken = crypto.createHash("sha256").update(token).digest("hex");
    let user = await Users.findOne({
      where: {
        key: cryptToken,
        key_validity: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Vérifier la différence des passwords
    if (await bcrypt.compare(req.body.pwd, user.password)) {
      return next(
        new AppOpeError(
          "Votre nouveau mot de passe doit être différent l'ancien"
        ),
        400
      );
    }
    // mettre à jour le password
    const pwdChangeDate = moment(Date.now() - 1000).format(
      "YYYY-MM-DD HH:mm:ss"
    );
    await Users.update(
      {
        password: req.body.pwdcrypt,
        key: null,
        key_validity: null,
        passchange_at: pwdChangeDate,
      },
      {
        where: {
          id: user.id,
        },
      }
    );

    // Connecter l'utilisateur
    creatSendToken(rows[0], 200, res);
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// mise à jour du mot de passe de l'utilisateur connecté
exports.updatePassword = async (req, res, next) => {
  try {
    // récupérer l'ID du user à partir de la validation du token
    const { pwd, pwd1 } = req.body;
    const userId = req.userId;
    // Requete
    const user = await Users.findOne({ where: { id: userId } });
    // Controller si l'utilisateur existe et le mot de passe actuel est correcte
    if (user === null || !(await bcrypt.compare(pwd, user.password))) {
      return next(new AppOpeError("Mot de passe courant incorrect"), 400);
    }
    // Crypter et enregistrer le noveau mot de passe
    const pwdcrypt = await bcrypt.hash(pwd1, 12);
    // Mettre à jour le mot de passe de l'utilisateur
    const dTime = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

    await Users.update(
      { password: pwdcrypt, passchange_at: dTime },
      { where: { id: userId } }
    );

    // Reponse
    res.status(200).json({
      status: "success",
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};
