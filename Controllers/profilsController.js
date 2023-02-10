/** @format */

// const promisify = require("util-promisify");
const AppOpeError = require("../utils/appOpeErrors.js");
const { Profils } = require("../sequelize/models");

// transformer la methode query en promesse
// const query = promisify(db.query).bind(db);

// Param middleware pour le contrôle de l'ID
/*exports.checkID = (req, res, next, val) => {
  //if (val * 1 === 0) {
  if (req.params.id * 1 === 0 || req.params.id === undefined) {
    return res.status(404).json({ status: "error", message: "ID invalide" });
  }
  next();
};*/

// Récupérer tous les profils
exports.getAllProfils = async (req, res, next) => {
  try {
    // Requete
    const profils = await Profils.finfAll();
    // Response
    res.status(200).json({
      status: "success",
      results: rows.length,
      data: profils,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Créer un profil
exports.createProfil = async (req, res, next) => {
  try {
    //destructuring
    const { code, description } = req.body;

    // Requete
    const [profil, created] = await Profils.findOrCreate({
      where: {
        code: code,
      },
      defaults: {
        description: description,
      },
    });
    if (!created) {
      next(new AppOpeError("Code profil déjà utilisé", 404));
    }

    // Response
    return res.status(200).json({
      status: "success",
      message: "Créé avec succès",
      data: profil,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Lire un profil
exports.getProfil = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Requete
    const profil = await Profils.findByPk(id);

    // Response
    return res.status(200).json({
      status: "success",
      data: profil,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Modifier un profil
exports.updateProfil = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { code, description } = req.body;

    // Requete
    await Profils.update(
      { code: code, description: description },
      { where: { id: id } }
    );

    // Response
    return res.status(200).json({
      status: "success",
      message: "Modifié avec succès",
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Supprimer un profil
exports.deleteProfil = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Requete
    await Profils.destroy({ where: { id: id } });
    // Response
    return res.status(200).json({
      status: "success",
      message: "Supprimé avec succès",
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};
