import { IBcryptService } from '../../../domain/adapters/bcrypt.interface';
import { IJwtService } from '../../../domain/adapters/jwt.interface';
import { JWTConfig } from '../../../domain/config/jwt.interface';
import { IException } from '../../../domain/exceptions/exceptions.interface';
import { ILogger } from '../../../domain/logger/logger.interface';
import { UserModel } from '../../../domain/model/user';
import { UserRepository } from '../../../domain/repositories/userRepository.interface';
import { IsAuthenticatedUseCase } from '../isAuthenticated.usecase';
import { LoginUseCase } from '../login.usecase';
import { LogoutUseCase } from '../logout.usecase';

describe('uses_cases/authentication', () => {
  let loginUseCase: LoginUseCase;
  let logoutUseCase: LogoutUseCase;
  let isAuthenticated: IsAuthenticatedUseCase;
  let logger: ILogger;
  let exception: IException;
  let jwtService: IJwtService;
  let jwtConfig: JWTConfig;
  let adminUserRepo: UserRepository;
  let bcryptService: IBcryptService;

  beforeEach(() => {
    logger = {} as ILogger;
    logger.info = jest.fn();

    exception = {} as IException;

    jwtService = {} as IJwtService;
    jwtService.createToken = jest.fn();

    jwtConfig = {} as JWTConfig;
    jwtConfig.getJwtExpirationTime = jest.fn();
    jwtConfig.getJwtSecret = jest.fn();
    jwtConfig.getJwtRefreshSecret = jest.fn();
    jwtConfig.getJwtRefreshExpirationTime = jest.fn();

    adminUserRepo = {} as UserRepository;
    adminUserRepo.getUserByUsername = jest.fn();
    adminUserRepo.updateLastLogin = jest.fn();
    adminUserRepo.updateRefreshToken = jest.fn();

    bcryptService = {} as IBcryptService;
    bcryptService.compare = jest.fn();
    bcryptService.hash = jest.fn();

    loginUseCase = new LoginUseCase(logger, jwtService, jwtConfig, adminUserRepo, bcryptService);
    logoutUseCase = new LogoutUseCase();
    isAuthenticated = new IsAuthenticatedUseCase(adminUserRepo);
  });

  describe('creating a cookie', () => {
    it('should return a cookie', async () => {
      const expireIn = '200';
      const token = 'token';
      (jwtConfig.getJwtSecret as jest.Mock).mockReturnValue(() => 'secret');
      (jwtConfig.getJwtExpirationTime as jest.Mock).mockReturnValue(expireIn);
      (jwtService.createToken as jest.Mock).mockReturnValue(token);

      expect(await loginUseCase.getCookieWithJwtToken('username')).toEqual(
        `Authentication=${token}; HttpOnly; Path=/; Max-Age=${expireIn}`,
      );
    });
    it('should return a refresh cookie', async () => {
      const expireIn = '200';
      const token = 'token';
      (jwtConfig.getJwtRefreshSecret as jest.Mock).mockReturnValue(() => 'secret');
      (jwtConfig.getJwtRefreshExpirationTime as jest.Mock).mockReturnValue(expireIn);
      (jwtService.createToken as jest.Mock).mockReturnValue(token);
      (bcryptService.hash as jest.Mock).mockReturnValue(Promise.resolve('hashed password'));
      (adminUserRepo.updateRefreshToken as jest.Mock).mockReturnValue(Promise.resolve(null));

      expect(await loginUseCase.getCookieWithJwtRefreshToken('username')).toEqual(
        `Refresh=${token}; HttpOnly; Path=/; Max-Age=${expireIn}`,
      );
      expect(adminUserRepo.updateRefreshToken).toBeCalledTimes(1);
    });
  });

  describe('validation local strategy', () => {
    it('should return null because user not found', async () => {
      (adminUserRepo.getUserByUsername as jest.Mock).mockReturnValue(Promise.resolve(null));

      expect(await loginUseCase.validateUserForLocalStragtegy('username', 'password')).toEqual(null);
    });
    it('should return null because wrong password', async () => {
      const user: UserModel = {
        id: 1,
        username: 'username',
        password: 'password',
        createDate: new Date(),
        updatedDate: new Date(),
        lastLogin: null,
        hashRefreshToken: 'refresh token',
      };
      (adminUserRepo.getUserByUsername as jest.Mock).mockReturnValue(Promise.resolve(user));
      (bcryptService.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

      expect(await loginUseCase.validateUserForLocalStragtegy('username', 'password')).toEqual(null);
    });
    it('should return user without password', async () => {
      const user: UserModel = {
        id: 1,
        username: 'username',
        password: 'password',
        createDate: new Date(),
        updatedDate: new Date(),
        lastLogin: null,
        hashRefreshToken: 'refresh token',
      };
      (adminUserRepo.getUserByUsername as jest.Mock).mockReturnValue(Promise.resolve(user));
      (bcryptService.compare as jest.Mock).mockReturnValue(Promise.resolve(true));

      const { password, ...rest } = user;

      expect(await loginUseCase.validateUserForLocalStragtegy('username', 'password')).toEqual(rest);
    });
  });

  describe('Validation jwt strategy', () => {
    it('should return null because user not found', async () => {
      (adminUserRepo.getUserByUsername as jest.Mock).mockReturnValue(Promise.resolve(null));
      (bcryptService.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

      expect(await loginUseCase.validateUserForJWTStragtegy('username')).toEqual(null);
    });

    it('should return user', async () => {
      const user: UserModel = {
        id: 1,
        username: 'username',
        password: 'password',
        createDate: new Date(),
        updatedDate: new Date(),
        lastLogin: null,
        hashRefreshToken: 'refresh token',
      };
      (adminUserRepo.getUserByUsername as jest.Mock).mockReturnValue(Promise.resolve(user));

      expect(await loginUseCase.validateUserForJWTStragtegy('username')).toEqual(user);
    });
  });

  describe('Validation refresh token', () => {
    it('should return null because user not found', async () => {
      (adminUserRepo.getUserByUsername as jest.Mock).mockReturnValue(Promise.resolve(null));

      expect(await loginUseCase.getUserIfRefreshTokenMatches('refresh token', 'username')).toEqual(null);
    });

    it('should return null because user not found', async () => {
      const user: UserModel = {
        id: 1,
        username: 'username',
        password: 'password',
        createDate: new Date(),
        updatedDate: new Date(),
        lastLogin: null,
        hashRefreshToken: 'refresh token',
      };
      (adminUserRepo.getUserByUsername as jest.Mock).mockReturnValue(Promise.resolve(user));
      (bcryptService.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

      expect(await loginUseCase.getUserIfRefreshTokenMatches('refresh token', 'username')).toEqual(null);
    });

    it('should return user', async () => {
      const user: UserModel = {
        id: 1,
        username: 'username',
        password: 'password',
        createDate: new Date(),
        updatedDate: new Date(),
        lastLogin: null,
        hashRefreshToken: 'refresh token',
      };
      (adminUserRepo.getUserByUsername as jest.Mock).mockReturnValue(Promise.resolve(user));
      (bcryptService.compare as jest.Mock).mockReturnValue(Promise.resolve(true));

      expect(await loginUseCase.getUserIfRefreshTokenMatches('refresh token', 'username')).toEqual(user);
    });
  });

  describe('logout', () => {
    it('should return an array to invalid the cookie', async () => {
      expect(await logoutUseCase.execute()).toEqual([
        'Authentication=; HttpOnly; Path=/; Max-Age=0',
        'Refresh=; HttpOnly; Path=/; Max-Age=0',
      ]);
    });
  });

  describe('isAuthenticated', () => {
    it('should return an array to invalid the cookie', async () => {
      const user: UserModel = {
        id: 1,
        username: 'username',
        password: 'password',
        createDate: new Date(),
        updatedDate: new Date(),
        lastLogin: null,
        hashRefreshToken: 'refresh token',
      };
      (adminUserRepo.getUserByUsername as jest.Mock).mockReturnValue(Promise.resolve(user));

      const { password, ...rest } = user;

      expect(await isAuthenticated.execute('username')).toEqual(rest);
    });
  });
});
