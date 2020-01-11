const { promisify } = require("util");
const fetch = require("node-fetch");
const parser = promisify(require("xml2js").parseString);

const PLACE_STYLE = {
  "#0": "Servicios de Salud",
  "#1": "Alimento y/o Suministros",
  "#2": "Refugio / Campamento"
};

async function getBatchGeoData() {
  let response = await fetch(
    "https://batchgeo.com/map/kml/de8ab2455315ad6fa4b05522d88c3ed6"
  );
  let body = await response.text();
  let data = await parser(body);

  let document = data.kml.Document[0];
  let name = document.name[0];
  let places = document.Placemark;

  let cleanData = places.map((place) => {
    return {
      need: PLACE_STYLE[place.styleUrl],
      address: place.address[0],
      name: place.name[0],
      location: place.Point[0].coordinates,
      data: place.ExtendedData[0].Data.filter(
        (d) => ["Necesidades", "Contactos"].indexOf(d.$.name) > -1
      ).map((d) => {
        return { key: d.$.name, value: d.value[0] };
      })
    };
  });

  return cleanData;
}

async function main() {
  let data = await getBatchGeoData();
  console.log(data);
}

main();
