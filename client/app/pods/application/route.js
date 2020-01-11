import Route from "@ember/routing/route";

export default class ApplicationRoute extends Route {
  async model() {
    let res = await fetch("/data.json");
    return res.json();
  }
}
