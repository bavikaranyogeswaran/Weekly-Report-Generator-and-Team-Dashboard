import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Report } from '../../reports/entities/report.entity';

@Entity('projects') // maps to the "projects" table in PostgreSQL
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Project names must be unique (e.g. "Client A", "R&D", "Internal Tooling")
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Hex colour used to visually distinguish projects on the dashboard
  @Column({ default: '#6366f1' })
  color: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // All reports that belong to this project
  @OneToMany(() => Report, (report) => report.project)
  reports: Report[];

  // Team members assigned to this project — creates a "project_members" join table
  @ManyToMany(() => User, (user) => user.projects)
  @JoinTable({ name: 'project_members' })
  members: User[];
}
