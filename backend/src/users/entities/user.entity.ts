import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';
import { Report } from '../../reports/entities/report.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('users') // maps to the "users" table in PostgreSQL
export class User {
  // Auto-generated UUID — safer than sequential integers for user IDs
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Email must be unique across all users
  @Column({ unique: true })
  email: string;

  // Never store plain-text passwords — always store the bcrypt hash.
  // @Exclude strips this from all HTTP responses via ClassSerializerInterceptor.
  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  // MEMBER (default on signup), MANAGER (assigned by admin), or ADMIN (seeded from env)
  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role: Role;

  // True once the user clicks the link in the verification email
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  // Set to true for admin-created accounts so the user is forced to change their
  // temporary invite password on first login. Cleared by changePassword().
  @Column({ name: 'must_change_password', default: false })
  mustChangePassword: boolean;

  // One-time token emailed on registration — cleared after the user verifies
  // type must be explicit because TypeORM can't infer the SQL type from `string | null`
  // select: false means it is never included in normal SELECT * queries
  @Column({ name: 'verification_token', type: 'varchar', nullable: true, select: false })
  verificationToken: string | null;

  // One-time token emailed when the user requests a password reset — select:false for safety
  @Column({ name: 'password_reset_token', type: 'varchar', nullable: true, select: false })
  passwordResetToken: string | null;

  // Expiry for the password reset token — null when no reset is in progress.
  // select:false so it is never returned in user/admin responses (it reveals whether an
  // invite/reset is pending and when it expires); the reset flow only filters on it in a
  // WHERE clause and writes it, so it never needs to be loaded into a response.
  @Column({ name: 'password_reset_expiry', type: 'timestamp', nullable: true, select: false })
  passwordResetExpiry: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // One user can have many reports (one per week)
  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];

  // A user can be assigned to many projects (optional feature)
  @ManyToMany(() => Project, (project) => project.members)
  projects: Project[];
}
