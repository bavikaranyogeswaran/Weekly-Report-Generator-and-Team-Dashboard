import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
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

  // Never store plain-text passwords — always store the bcrypt hash
  @Column({ name: 'password_hash' })
  passwordHash: string;

  // Every user is either a MEMBER or a MANAGER
  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role: Role;

  // True once the user clicks the link in the verification email
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  // One-time token emailed on registration — cleared after the user verifies
  // select: false means it is never included in normal SELECT * queries
  @Column({ name: 'verification_token', nullable: true, select: false })
  verificationToken: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // One user can have many reports (one per week)
  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];

  // A user can be assigned to many projects (optional feature)
  @ManyToMany(() => Project, (project) => project.members)
  projects: Project[];
}
