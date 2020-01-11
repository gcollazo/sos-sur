import { helper } from "@ember/component/helper";

export function slugify(params /*, hash*/) {
  if (params[0]) {
    return params[0]
      .toLowerCase()
      .replace(/\s/g, "-")
      .replace(/\W/g, "-");
  }
  return params;
}

export default helper(slugify);
