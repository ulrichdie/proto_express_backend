/** @format */

const dotenv = require("dotenv");
const app = require("./app.js");
const { sequelize } = require("./sequelize/models/");

// unCaughtExceptions -- erreurs non gérées par express dans les codes synchrones
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION ! arrêt 💥");
  // Fermeture de l'application
  process.exit(1);
});

//Charger les variables de config.env dans les variables d'environnement de node.js
dotenv.config({ path: "./config.env" });

// fonction de connexion à la base de données
const connectDb = async () => {
  console.log("Connexion à la base de données...");
  try {
    await sequelize.authenticate();
    console.log("Base de données connectée.");
  } catch (error) {
    console.log("Echec connexion à la base de données.", error);
    process.exit(1);
  }
};

(async () => {
  //connexion à la base de données
  await connectDb();

  // Connexion au serveur node
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`node server running on port ${port}... 🖥️`);
  });
})();

// unHandleRejection -- erreurs non gérées par express dans les codes asynchrones
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION ! arrêt 💥");
  // lancement de l'arret du serveur
  server.close(() => {
    // Fermeture de l'application
    process.exit(1);
  });
});
