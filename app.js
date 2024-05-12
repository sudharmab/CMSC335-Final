// IDEA: Create a pokemon team. This way we store each pokemon in a mongo db.
const path = require("path");
const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
require("dotenv").config();

// for CSS
app.use(express.static(path.join(__dirname, "views")));

const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = { db: "CMSC335DB", collection: "pokemonTeam" };
const { MongoClient, ServerApiVersion } = require("mongodb");
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

app.set("view engine", "ejs");

const pokeAPI = "https://pokeapi.co/api/v2/";

app.use(express.urlencoded({ extended: false }));

async function getPokemon(pokemonName) {
  const response = await fetch(pokeAPI + `pokemon/${pokemonName}`);
  if (!response.ok) {
    console.log(`Error: Pokémon ${pokemonName} not found`);
    return null;
  }
  const result = await response.json();
  // console.log(result);
  return result;
}

app.get("/", (req, res) => {
  res.render("index", { error: null });
});

app.get("/pcBox", async (req, res) => {
  const result = await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find();

  const arr = await result.toArray();
  console.log(arr);
  let table = "<table border = '1'> <tr> <th>Pokemon</th> <th>Type</th> </tr>";
  arr.forEach((elem) => {
    table += `<tr> <td> ${elem.pokemon} </td> <td> ${elem.type} </td> </tr>`;
  });
  table += "</table>";
  variable = { table: table };
  res.render("pcBox", variable);
});

app.post("/releaseAll", async (req, res) => {
  const result = await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .deleteMany({});

    res.render("index", {"error": null});
});
app.post("/displayPokemon", async (req, res) => {
  const { pokemon } = req.body;
  // console.log(pokemon);
  let data = await getPokemon(pokemon);
  // console.log(data);

  if (!data) {
    // If Pokémon doesn't exist, return to the index page with an error message
    return res.render("index", {
      error: `Pokémon "${pokemon}" not found. Please try again.`,
    });
  }

  let imgSrc = `https://img.pokemondb.net/artwork/large/${pokemon}.jpg`;

  const pokemonTypesArr = [];
  let pokemonTypes = "";
  for (let i = 0; i < data.types.length; i++) {
    pokemonTypesArr.push(data.types[i].type.name);
  }
  pokemonTypesArr.forEach((e) => {
    pokemonTypes += e + " ";
  });

  // console.log("Pokemon Types:", pokemonTypes);

  const pokemonStats = [];
  let statsTable =
    "<table border = '1'><tr><th>Name</th><th>Base stat</th></tr>";
  for (let i = 0; i < data.stats.length; i++) {
    const stat = data.stats[i];
    pokemonStats.push({
      name: stat.stat.name,
      base_stat: stat.base_stat,
    });
  }

  pokemonStats.forEach((e) => {
    statsTable += `<tr><td>${e.name}</td><td>${e.base_stat}</td></tr>`;
  });

  statsTable += "</table>";
  // console.log("Pokemon Stats:", pokemonStats);

  res.render("displayPokemon", {
    pokemon: pokemon,
    imageSrc: imgSrc,
    type: pokemonTypes,
    stats: statsTable,
  });
});

app.use(bodyParser.urlencoded({ extended: false }));
app.post("/pokemonAction", async (req, res) => {
  const pokeName = req.body.pokemon;
  const pokeType = req.body.type;
  console.log(pokeName + pokeType);
  let obj = { pokemon: pokeName, type: pokeType };
  const result = await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .insertOne(obj);

  res.render("index", { error: null });
});

app.listen(port);
process.stdout.write(`Web server is running at http://localhost:${port}\n`);

const prompt = "Type stop to shutdown server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
  const dataInput = process.stdin.read();
  if (dataInput !== null) {
    const command = String(dataInput).trim();
    if (command === "stop") {
      process.stdout.write("Shutting down server\n");
      process.exit(0);
    } else {
      process.stdout.write(`Invalid Command: ${command}\n`);
    }
    process.stdout.write(prompt);
    process.stdin.resume();
  }
});
