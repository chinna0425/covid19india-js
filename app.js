const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
let db_path = path.join(__dirname, "covid19India.db");
let db = null;

const initializationofdbandserver = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server starts at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB error is ${error.message}`);
    process.exit(1);
  }
};

initializationofdbandserver();

//API GET

const convertitintformat = (result) => {
  let myarray = [];
  for (let i = 0; i < result.length; i++) {
    let vs = {
      stateId: result[i].state_id,
      stateName: result[i].state_name,
      population: result[i].population,
    };
    myarray.push(vs);
  }
  return myarray;
};

app.get("/states/", async (request, response) => {
  let query = `
    SELECT
    *
    FROM
    state;`;
  let res = await db.all(query);
  response.send(convertitintformat(res));
});

//API GET
app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let query = `
    SELECT * FROM state WHERE state_id=${stateId};`;
  let res = await db.get(query);
  response.send({
    stateId: res.state_id,
    stateName: res.state_name,
    population: res.population,
  });
});

//API POST
app.post("/districts/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let query = `
    insert into district(district_name,state_id,cases,cured,active,deaths) values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  let res = await db.run(query);
  response.send("District Successfully Added");
});

// API GET

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let query = `
    SELECT * FROM district WHERE district_id=${districtId};`;
  let res = await db.get(query);
  response.send({
    districtId: res.district_id,
    districtName: res.district_name,
    stateId: res.state_id,
    cases: res.cases,
    cured: res.cured,
    active: res.active,
    deaths: res.deaths,
  });
});

//API DELETE

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let query = `
    delete from district where district_id=${districtId};`;
  await db.run(query);
  response.send("District Removed");
});

//API PUT

app.put("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let query = `
update district set district_name='${districtName}',
state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} where district_id=${districtId};`;
  let res = await db.run(query);
  response.send("District Details Updated");
});

// API GET

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  let query = `
    select sum(cases) as totalCases,sum(cured) as totalCured,sum(active) as totalActive,sum(deaths) as totalDeaths from district where state_id=${stateId};`;
  let res = await db.get(query);
  response.send(res);
});

//API GET

app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;
  let getDistrictquery = `
  select state_id from district where district_id=${districtId};`;
  let res = await db.get(getDistrictquery);
  let statequery = `
  select state_name as stateName from state where state_id=${res.state_id};`;
  let res1 = await db.get(statequery);
  response.send(res1);
});

module.exports = app;
