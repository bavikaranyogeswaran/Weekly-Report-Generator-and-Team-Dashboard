import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '../common/enums/role.enum';

// Guards around PATCH /users/:id/role — regression tests for the manager->ADMIN
// privilege-escalation fix. updateRole must never let a manager grant ADMIN,
// change their own role, or touch the admin account.
describe('UsersService.updateRole', () => {
  let usersRepo: { findOne: jest.Mock; save: jest.Mock };
  let emailService: { sendRoleAssignedEmail: jest.Mock };
  let service: UsersService;

  const REQUESTER = 'manager-id';

  beforeEach(() => {
    usersRepo = { findOne: jest.fn(), save: jest.fn() };
    emailService = { sendRoleAssignedEmail: jest.fn().mockResolvedValue(undefined) };
    service = new UsersService(usersRepo as never, emailService as never);
  });

  it('throws NotFound when the target user does not exist', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateRole('missing', { role: 'MANAGER' }, REQUESTER),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('forbids a manager from changing their own role', async () => {
    usersRepo.findOne.mockResolvedValue({ id: REQUESTER, role: Role.MANAGER });
    await expect(
      service.updateRole(REQUESTER, { role: 'MEMBER' }, REQUESTER),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('forbids changing the ADMIN account', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'admin-id', role: Role.ADMIN });
    await expect(
      service.updateRole('admin-id', { role: 'MEMBER' }, REQUESTER),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('promotes a MEMBER to MANAGER, strips passwordHash, and notifies them', async () => {
    const user = {
      id: 'u1',
      role: Role.MEMBER,
      email: 'u1@example.com',
      name: 'U One',
      passwordHash: 'secret-hash',
    };
    usersRepo.findOne.mockResolvedValue(user);
    usersRepo.save.mockImplementation(async (u: typeof user) => u);

    const result = (await service.updateRole('u1', { role: 'MANAGER' }, REQUESTER)) as unknown as Record<
      string,
      unknown
    >;

    expect(result.role).toBe(Role.MANAGER);
    expect(result.passwordHash).toBeUndefined();
    expect(emailService.sendRoleAssignedEmail).toHaveBeenCalledWith(
      'u1@example.com',
      'U One',
      Role.MANAGER,
    );
  });

  it('does not send an email when the role is unchanged', async () => {
    const user = {
      id: 'u2',
      role: Role.MANAGER,
      email: 'u2@example.com',
      name: 'U Two',
      passwordHash: 'h',
    };
    usersRepo.findOne.mockResolvedValue(user);
    usersRepo.save.mockImplementation(async (u: typeof user) => u);

    await service.updateRole('u2', { role: 'MANAGER' }, REQUESTER);

    expect(emailService.sendRoleAssignedEmail).not.toHaveBeenCalled();
  });
});
