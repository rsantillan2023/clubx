import { userAssociations } from "./schemas/degira/associations/user.associations";

export const initAllAssociations = () => {
  console.log("Init Assocations");
  userAssociations();
};
