import { administrationMenuItems } from "./administration";
import { learningMenuItems } from "./learning";
import { operationsMenuItems } from "./operations";
import { peopleMenuItems } from "./people";
export const DASHBOARD_MENU_ITEMS = [
  ...peopleMenuItems,
  ...learningMenuItems,
  ...operationsMenuItems,
  ...administrationMenuItems,
];
