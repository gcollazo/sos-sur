import Route from "@ember/routing/route";

export default class ApplicationRoute extends Route {
  async model() {
    let res = await fetch("http://localhost:3000/data.json");
    return res.json();
  }
}
