export interface IUser {
  id_user: number;
  username: string;
  password: string;
  email: string;
  name: string;
  surname: string;
  id_rol: number;
  id_state: number;
  created_at?: Date;
  updated_at?: Date;
}
