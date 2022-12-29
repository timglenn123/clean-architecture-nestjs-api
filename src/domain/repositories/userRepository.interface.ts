import { UserModel } from '../model/user';

export interface UserRepository {
  getUserByUsername(username: string): Promise<UserModel>;
  updateLastLogin(username: string): Promise<void>;
  updateRefreshToken(username: string, refreshToken: string): Promise<void>;
}
