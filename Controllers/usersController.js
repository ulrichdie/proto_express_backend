/** @format */

// const promisify = require("util-promisify");
const AppOpeError = require("../utils/appOpeErrors.js");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const sharp = require("sharp");
const crypto = require("crypto");
const password = require("secure-random-password");
const { Users } = require("../sequelize/models");
const mailsend = require("../utils/email");

// Enregistrer l'image en mémoire avec "multer" avant de le transmettre à "sharp" pour le redimensionner avant importation
const multerStorage = multer.memoryStorage();

// Multer Filter pour filtrer le type de fichier
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(AppOpeError("Format de fichier non supporté.", 400), false);
  }
};

// Options de chargement des fichiers
const upload = multer({
  Storage: multerStorage,
  fileFilter: multerFilter,
});

//Génération de mot de passe utilisateur
const generUserPassword = () => {
  const generatedPassword = password.randomPassword({
    length: 8,
    characters: [
      password.upper,
      password.digits,
      password.lower,
      password.symbols,
    ],
  });
  return generatedPassword;
};

// Middlewear Uploader la photo de l'utilisateur
exports.uploadUserPhoto = upload.single("photo");

// Middlewear Redimensionner les grandes photos avant de les uploader
exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.userId}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/images/users/${req.file.filename}`);
  next();
};

// Récupérer tous les profils
exports.getAllUsers = async (req, res, next) => {
  try {
    // Requete
    let users = await Users.findAll();

    // Response
    users.password = undefined;
    res.status(200).json({
      status: "success",
      results: users.length,
      data: users,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Modifier ses informations personnelles
exports.updateMe = async (req, res, next) => {
  try {
    // Destructuring
    const { nom, prenoms, email, tel, adresse, photo } = req.body;
    const userId = req.userId;
    // Requete
    if (photo !== null) {
      await Users.update(
        {
          nom: nom,
          prenoms: prenoms,
          tel: tel,
          adresse: adresse,
          photo: photo,
        },
        { where: { id: userId } }
      );
    } else {
      await Users.update(
        { nom: nom, prenoms: prenoms, tel: tel, adresse: adresse },
        { where: { id: userId } }
      );
    }

    // Reponse
    res.status(200).json({
      status: "success",
      message: "Informations mises à jour avec succès",
      data: rows,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Créer utilisateurs
exports.createUsers = async (req, res, next) => {
  // Destructuring
  const { nom, prenoms, email, tel, adresse, profil } = req.body;

  // Générer mot de passe de l'utilisateur
  const pwd = generUserPassword();

  // Crypter mot de passe
  const pwdcrypt = await bcrypt.hash(pwd, 12);
  // erreur en cas ou l'email existe déjà
  if (!pwdcrypt) {
    return next(
      new AppOpeError("Erreur lors de la création de l'utilisateur.", 500)
    );
  }

  // Enregistrer l'utilisateur
  const [rows, created] = await Users.findOrCreate({
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
  await new Email(user, url, attach).sendWelcome();

  // Reponse
  res.status(200).json({
    status: "success",
    message: "Utilisateur créé avec succès",
    data: rows,
  });
  try {
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Rechercher utilisateur
exports.getUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    let user = await Users.findOne({
      where: {
        id: id,
      },
    });
    // Reponse
    user.password = undefined;
    res.status(200).json({
      status: "success",
      results: rows.length,
      data: user,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Modifier utilisateur
exports.updateUser = async (req, res, next) => {
  try {
    // Destructuring
    const { nom, prenoms, email, tel, photo, adresse, profil } = req.body;
    const id = req.params.id;
    // Requete
    await Users.update(
      {
        nom: nom,
        prenoms: prenoms,
        email: mail,
        tel: tel,
        adresse: adresse,
        profil_id: profil,
        photo: photo,
      },
      { where: { id: id } }
    );
    // Reponse
    res.status(200).json({
      status: "success",
      message: "Utilisateur modifié avec succès",
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Supprimer utilisateur (le modifier en inactif)
exports.deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Users.destroy({
      where: {
        id: id,
      },
    });
    // Reponse
    res.status(200).json({
      status: "success",
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};
