import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { Role } from '../../common/enums/role.enum';

// Regression tests for the stale-JWT fix: validate() must load the user from the DB
// on every request and use the CURRENT role, never the (possibly stale/tampered) claim
// baked into the token. A token whose user no longer exists must be rejected.
describe('JwtStrategy.validate', () => {
  let usersRepo: { findOne: jest.Mock };
  let strategy: JwtStrategy;

  beforeEach(() => {
    usersRepo = { findOne: jest.fn() };
    const config = { getOrThrow: () => 'test-secret' };
    strategy = new JwtStrategy(config as never, usersRepo as never);
  });

  it('rejects a validly-signed token whose user no longer exists', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: 'ghost-id', role: Role.ADMIN }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('uses the current DB role and ignores the token role claim', async () => {
    // Token claims ADMIN, but the DB says this user is only a MEMBER now
    usersRepo.findOne.mockResolvedValue({
      id: 'u1',
      role: Role.MEMBER,
      mustChangePassword: false,
    });

    const result = await strategy.validate({ sub: 'u1', role: Role.ADMIN });

    expect(result).toEqual({ userId: 'u1', role: Role.MEMBER, mustChangePassword: false });
  });

  it('looks the user up by the token subject', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'u1',
      role: Role.MANAGER,
      mustChangePassword: false,
    });

    await strategy.validate({ sub: 'u1', role: Role.MANAGER });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } }),
    );
  });
});
