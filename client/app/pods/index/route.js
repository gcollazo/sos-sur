import Route from "@ember/routing/route";
import ENV from "client/config/environment";

export default class ApplicationRoute extends Route {
  async model() {
    let res = await fetch(`${ENV.API_HOST}/data.json`);
    return res.json();
  }
}
