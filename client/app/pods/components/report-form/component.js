import { action } from "@ember/object";
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import ENV from "client/config/environment";

export default class ReportForm extends Component {
  categories = [
    "Servicios de salud",
    "Alimento y/o suministros",
    "Refugio / Campamento",
    "Centro de acopio"
  ];

  @tracked isEditing;
  @tracked selectedCategory;

  @tracked name;
  @tracked category;
  @tracked address;
  @tracked necesidades;
  @tracked contactos;

  resetForm() {
    this.name = null;
    this.category = null;
    this.address = null;
    this.necesidades = null;
    this.contactos = null;
  }

  @action
  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  @action
  async submitForm(event) {
    event.preventDefault();

    let name = this.name;
    let category = this.selectedCategory;
    let address = this.address;
    let necesidades = this.necesidades;
    let contactos = this.contactos;

    if (name && category && address) {
      let res = await fetch(`${ENV.API_HOST}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          category,
          address,
          necesidades,
          contactos
        })
      });

      if (res.status === 200) {
        alert("Lugar guardado");
        this.resetForm();
        this.toggleEdit();
      } else {
        alert("Hay problemas guardando lugar. Trata nuevamente.");
      }
    } else {
      alert("Error: Completa todos los campos");
    }
  }
}
