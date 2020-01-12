import Route from "@ember/routing/route";
import ENV from "client/config/environment";

export default class ApplicationRoute extends Route {
  async model() {
    try {
      let res = await fetch(`${ENV.API_HOST}/data.json`);
      return res.json();
    } catch (error) {
      alert("Hay problemas recibiendo los datos. Trata luego.");
    }
  }
}
