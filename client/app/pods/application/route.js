import Route from "@ember/routing/route";

export default class Application extends Route {
  beforeModel() {
    window.location = "http://suministrospr.com/";
  }
}
