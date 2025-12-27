export interface PasswordResetBody {
  new_password: string;
  new_password_confirmation: string;
  token: string;
  user_id_hash: string;
}
